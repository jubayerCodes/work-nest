import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/error.middleware';
import { emitToWorkspace } from '../../realtime/socket';
import type { CreateGoalInput, UpdateGoalInput, CreateMilestoneInput, UpdateMilestoneInput } from '@worknest/validators';

const GOAL_SELECT = {
  id: true, title: true, description: true, status: true, dueDate: true,
  createdAt: true, updatedAt: true, workspaceId: true,
  owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
  _count: { select: { milestones: true, actionItems: true } },
} as const;

export async function getGoals(workspaceId: string, filters: {
  status?: string; ownerId?: string; search?: string; page?: number; limit?: number;
}) {
  const { status, ownerId, search, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const where = {
    workspaceId,
    ...(status && { status: status as never }),
    ...(ownerId && { ownerId }),
    ...(search && { title: { contains: search, mode: 'insensitive' as const } }),
  };

  const [goals, total] = await Promise.all([
    prisma.goal.findMany({ where, select: GOAL_SELECT, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.goal.count({ where }),
  ]);

  return { goals, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
}

export async function getGoalById(goalId: string, workspaceId: string) {
  const goal = await prisma.goal.findFirst({
    where: { id: goalId, workspaceId },
    select: {
      ...GOAL_SELECT,
      milestones: { orderBy: { createdAt: 'asc' } },
      activities: {
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { id: true, name: true, avatarUrl: true } } },
      },
    },
  });
  if (!goal) throw new AppError('Goal not found', 404);
  return goal;
}

export async function createGoal(workspaceId: string, ownerId: string, data: CreateGoalInput) {
  const goal = await prisma.goal.create({
    data: { title: data.title, description: data.description, dueDate: data.dueDate ? new Date(data.dueDate) : null, ownerId: data.ownerId ?? ownerId, workspaceId },
    select: GOAL_SELECT,
  });
  await prisma.activity.create({ data: { type: 'GOAL_CREATED', payload: { goalId: goal.id, title: goal.title }, actorId: ownerId, goalId: goal.id } });
  emitToWorkspace(workspaceId, 'goal:updated', goal as never);
  return goal;
}

export async function updateGoal(goalId: string, workspaceId: string, actorId: string, data: UpdateGoalInput) {
  const existing = await prisma.goal.findFirst({ where: { id: goalId, workspaceId } });
  if (!existing) throw new AppError('Goal not found', 404);

  const goal = await prisma.goal.update({
    where: { id: goalId },
    data: { ...data, dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined },
    select: GOAL_SELECT,
  });

  if (data.status && data.status !== existing.status) {
    await prisma.activity.create({ data: { type: 'GOAL_STATUS_CHANGED', payload: { from: existing.status, to: data.status }, actorId, goalId } });
    // Notify goal owner
    if (existing.ownerId !== actorId) {
      await prisma.notification.create({ data: { userId: existing.ownerId, type: 'GOAL_UPDATE', payload: { goalId, title: existing.title, newStatus: data.status } } });
    }
  }

  emitToWorkspace(workspaceId, 'goal:updated', goal as never);
  return goal;
}

export async function deleteGoal(goalId: string, workspaceId: string) {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, workspaceId } });
  if (!goal) throw new AppError('Goal not found', 404);
  return prisma.goal.delete({ where: { id: goalId } });
}

// --- Milestones ---
export async function createMilestone(goalId: string, workspaceId: string, actorId: string, data: CreateMilestoneInput) {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, workspaceId } });
  if (!goal) throw new AppError('Goal not found', 404);

  const milestone = await prisma.milestone.create({
    data: { title: data.title, dueDate: data.dueDate ? new Date(data.dueDate) : null, goalId },
  });

  await prisma.activity.create({ data: { type: 'MILESTONE_ADDED', payload: { milestoneId: milestone.id, title: milestone.title }, actorId, goalId } });
  emitToWorkspace(workspaceId, 'milestone:updated', milestone as never);
  return milestone;
}

export async function updateMilestone(milestoneId: string, goalId: string, workspaceId: string, actorId: string, data: UpdateMilestoneInput) {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, workspaceId } });
  if (!goal) throw new AppError('Goal not found', 404);

  const milestone = await prisma.milestone.update({ where: { id: milestoneId }, data });

  if (data.completed !== undefined) {
    await prisma.activity.create({
      data: { type: data.completed ? 'MILESTONE_COMPLETED' : 'MILESTONE_REOPENED', payload: { milestoneId, title: milestone.title }, actorId, goalId },
    });
  }

  emitToWorkspace(workspaceId, 'milestone:updated', milestone as never);
  return milestone;
}

export async function deleteMilestone(milestoneId: string, goalId: string, workspaceId: string) {
  const goal = await prisma.goal.findFirst({ where: { id: goalId, workspaceId } });
  if (!goal) throw new AppError('Goal not found', 404);
  return prisma.milestone.delete({ where: { id: milestoneId } });
}
