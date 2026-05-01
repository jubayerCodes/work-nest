import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/error.middleware';
import { emitToWorkspace } from '../../realtime/socket';
import type { CreateActionItemInput, UpdateActionItemInput } from '@worknest/validators';

const ITEM_SELECT = {
  id: true, title: true, priority: true, status: true, dueDate: true, createdAt: true, updatedAt: true, workspaceId: true, goalId: true,
  assignee: { select: { id: true, name: true, email: true, avatarUrl: true } },
  goal: { select: { id: true, title: true } },
} as const;

export async function getActionItems(workspaceId: string, filters: {
  status?: string; priority?: string; assigneeId?: string; goalId?: string; search?: string;
}) {
  const { status, priority, assigneeId, goalId, search } = filters;
  return prisma.actionItem.findMany({
    where: {
      workspaceId,
      ...(status && { status: status as never }),
      ...(priority && { priority: priority as never }),
      ...(assigneeId && { assigneeId }),
      ...(goalId && { goalId }),
      ...(search && { title: { contains: search, mode: 'insensitive' as const } }),
    },
    select: ITEM_SELECT,
    orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function getActionItemById(id: string, workspaceId: string) {
  const item = await prisma.actionItem.findFirst({ where: { id, workspaceId }, select: ITEM_SELECT });
  if (!item) throw new AppError('Action item not found', 404);
  return item;
}

export async function createActionItem(workspaceId: string, data: CreateActionItemInput) {
  const item = await prisma.actionItem.create({
    data: { ...data, workspaceId, dueDate: data.dueDate ? new Date(data.dueDate) : null },
    select: ITEM_SELECT,
  });

  // Notify assignee
  if (data.assigneeId) {
    await prisma.notification.create({ data: { userId: data.assigneeId, type: 'ACTION_ASSIGNED', payload: { itemId: item.id, title: item.title } } });
  }

  emitToWorkspace(workspaceId, 'action:updated', item as never);
  return item;
}

export async function updateActionItem(id: string, workspaceId: string, data: UpdateActionItemInput) {
  const existing = await prisma.actionItem.findFirst({ where: { id, workspaceId } });
  if (!existing) throw new AppError('Action item not found', 404);

  const item = await prisma.actionItem.update({
    where: { id },
    data: { ...data, dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined },
    select: ITEM_SELECT,
  });

  // Emit specific kanban move event if only status changed
  if (data.status && Object.keys(data).length === 1) {
    emitToWorkspace(workspaceId, 'action:moved', { id, status: data.status as never });
  } else {
    emitToWorkspace(workspaceId, 'action:updated', item as never);
  }

  return item;
}

export async function deleteActionItem(id: string, workspaceId: string) {
  const item = await prisma.actionItem.findFirst({ where: { id, workspaceId } });
  if (!item) throw new AppError('Action item not found', 404);
  return prisma.actionItem.delete({ where: { id } });
}
