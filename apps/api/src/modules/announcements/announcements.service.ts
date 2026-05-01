import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/error.middleware';
import { emitToWorkspace } from '../../realtime/socket';
import type { CreateAnnouncementInput, UpdateAnnouncementInput, CreateCommentInput, ToggleReactionInput } from '@worknest/validators';

const ANNOUNCEMENT_SELECT = {
  id: true, title: true, content: true, pinned: true, publishedAt: true, updatedAt: true, authorId: true, workspaceId: true,
  reactions: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } },
  _count: { select: { comments: true } },
} as const;

export async function getAnnouncements(workspaceId: string) {
  return prisma.announcement.findMany({
    where: { workspaceId },
    select: ANNOUNCEMENT_SELECT,
    orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
  });
}

export async function getAnnouncementById(id: string, workspaceId: string) {
  const ann = await prisma.announcement.findFirst({
    where: { id, workspaceId },
    select: {
      ...ANNOUNCEMENT_SELECT,
      comments: {
        where: { parentId: null },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          replies: { include: { author: { select: { id: true, name: true, avatarUrl: true } } }, orderBy: { createdAt: 'asc' } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!ann) throw new AppError('Announcement not found', 404);
  return ann;
}

export async function createAnnouncement(workspaceId: string, authorId: string, data: CreateAnnouncementInput) {
  const ann = await prisma.announcement.create({
    data: { title: data.title, content: data.content, authorId, workspaceId },
    select: ANNOUNCEMENT_SELECT,
  });

  // Notify all workspace members
  const members = await prisma.workspaceMember.findMany({ where: { workspaceId }, select: { userId: true } });
  await prisma.notification.createMany({
    data: members.filter((m) => m.userId !== authorId).map((m) => ({
      userId: m.userId, type: 'ANNOUNCEMENT', payload: { announcementId: ann.id, title: ann.title },
    })),
  });

  emitToWorkspace(workspaceId, 'announcement:new', ann as never);
  return ann;
}

export async function updateAnnouncement(id: string, workspaceId: string, data: UpdateAnnouncementInput) {
  const ann = await prisma.announcement.findFirst({ where: { id, workspaceId } });
  if (!ann) throw new AppError('Announcement not found', 404);

  const updated = await prisma.announcement.update({ where: { id }, data, select: ANNOUNCEMENT_SELECT });
  emitToWorkspace(workspaceId, 'announcement:updated', updated as never);
  return updated;
}

export async function deleteAnnouncement(id: string, workspaceId: string) {
  const ann = await prisma.announcement.findFirst({ where: { id, workspaceId } });
  if (!ann) throw new AppError('Announcement not found', 404);
  await prisma.announcement.delete({ where: { id } });
  emitToWorkspace(workspaceId, 'announcement:deleted' as never, { id } as never);
}

export async function pinAnnouncement(id: string, workspaceId: string, pin: boolean) {
  if (pin) {
    const pinnedCount = await prisma.announcement.count({ where: { workspaceId, pinned: true } });
    if (pinnedCount >= 3) throw new AppError('Cannot pin more than 3 announcements. Unpin one first.', 400, 'PIN_LIMIT');
  }
  const ann = await prisma.announcement.update({ where: { id }, data: { pinned: pin }, select: { id: true, pinned: true } });
  emitToWorkspace(workspaceId, 'announcement:pinned', ann as never);
  return ann;
}

// --- Reactions ---
export async function toggleReaction(announcementId: string, userId: string, workspaceId: string, data: ToggleReactionInput) {
  const existing = await prisma.reaction.findUnique({ where: { userId_announcementId_emoji: { userId, announcementId, emoji: data.emoji } } });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.reaction.create({ data: { emoji: data.emoji, userId, announcementId } });
  }

  const reactions = await prisma.reaction.findMany({
    where: { announcementId },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });

  emitToWorkspace(workspaceId, 'reaction:toggled', { announcementId, reactions } as never);
  return reactions;
}

// --- Comments ---
export async function createComment(announcementId: string, authorId: string, workspaceId: string, data: CreateCommentInput) {
  const ann = await prisma.announcement.findFirst({ where: { id: announcementId, workspaceId } });
  if (!ann) throw new AppError('Announcement not found', 404);

  const comment = await prisma.comment.create({
    data: { content: data.content, authorId, announcementId, parentId: data.parentId ?? null },
    include: {
      author: { select: { id: true, name: true, avatarUrl: true } },
      replies: { include: { author: { select: { id: true, name: true, avatarUrl: true } } } },
    },
  });

  // Notify announcement author on new top-level comment
  if (!data.parentId && ann.authorId !== authorId) {
    await prisma.notification.create({
      data: { userId: ann.authorId, type: 'COMMENT', payload: { announcementId, commentId: comment.id, preview: data.content.slice(0, 100) } },
    });
  }

  emitToWorkspace(workspaceId, 'comment:new', comment as never);
  return comment;
}

export async function updateComment(commentId: string, authorId: string, workspaceId: string, content: string) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new AppError('Comment not found', 404);
  if (comment.authorId !== authorId) throw new AppError('Forbidden', 403);

  const updated = await prisma.comment.update({
    where: { id: commentId }, data: { content },
    include: { author: { select: { id: true, name: true, avatarUrl: true } } },
  });
  emitToWorkspace(workspaceId, 'comment:updated', updated as never);
  return updated;
}

export async function deleteComment(commentId: string, authorId: string, workspaceId: string) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new AppError('Comment not found', 404);
  if (comment.authorId !== authorId) throw new AppError('Forbidden', 403);
  await prisma.comment.delete({ where: { id: commentId } });
  emitToWorkspace(workspaceId, 'comment:deleted', { id: commentId, announcementId: comment.announcementId } as never);
}
