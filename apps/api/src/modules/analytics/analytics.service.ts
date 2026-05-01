import { prisma } from '../../config/prisma';
import { subDays, format } from 'date-fns';

export async function getWorkspaceAnalytics(workspaceId: string) {
  const thirtyDaysAgo = subDays(new Date(), 30);

  const [goalsByStatus, actionsByStatus, overdueItems, recentlyCompleted] = await Promise.all([
    prisma.goal.groupBy({ by: ['status'], where: { workspaceId }, _count: true }),
    prisma.actionItem.groupBy({ by: ['status'], where: { workspaceId }, _count: true }),
    prisma.actionItem.count({ where: { workspaceId, status: { not: 'DONE' }, dueDate: { lt: new Date() } } }),
    prisma.actionItem.findMany({
      where: { workspaceId, status: 'DONE', updatedAt: { gte: thirtyDaysAgo } },
      select: { updatedAt: true },
    }),
  ]);

  // Build goal status map
  const goalMap: Record<string, number> = { NOT_STARTED: 0, IN_PROGRESS: 0, COMPLETED: 0, AT_RISK: 0 };
  goalsByStatus.forEach((g) => { goalMap[g.status] = g._count; });

  // Build action status map
  const actionMap: Record<string, number> = { TODO: 0, IN_PROGRESS: 0, IN_REVIEW: 0, DONE: 0 };
  actionsByStatus.forEach((a) => { actionMap[a.status] = a._count; });

  // Calculate completion rate
  const totalGoals = Object.values(goalMap).reduce((a, b) => a + b, 0);
  const completionRate = totalGoals > 0 ? Math.round((goalMap.COMPLETED / totalGoals) * 100) : 0;

  // Build 30-day trend (group by date)
  const trendMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    trendMap[format(subDays(new Date(), i), 'MMM d')] = 0;
  }
  recentlyCompleted.forEach((item) => {
    const day = format(new Date(item.updatedAt), 'MMM d');
    if (trendMap[day] !== undefined) trendMap[day]++;
  });
  const trend = Object.entries(trendMap).map(([date, completed]) => ({ date, completed }));

  // Top assignees
  const topAssignees = await prisma.actionItem.groupBy({
    by: ['assigneeId'],
    where: { workspaceId, status: 'DONE', assigneeId: { not: null } },
    _count: true,
    orderBy: { _count: { assigneeId: 'desc' } },
    take: 5,
  });

  const assigneeDetails = await Promise.all(
    topAssignees.map(async (a) => ({
      user: await prisma.user.findUnique({ where: { id: a.assigneeId! }, select: { id: true, name: true, avatarUrl: true } }),
      completedCount: a._count,
    }))
  );

  return {
    goalsByStatus: goalMap,
    actionItemsByStatus: actionMap,
    overdueActionItems: overdueItems,
    completionRate,
    trend,
    topAssignees: assigneeDetails.filter((a) => a.user),
  };
}
