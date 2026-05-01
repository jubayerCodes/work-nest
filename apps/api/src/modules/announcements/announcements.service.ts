import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/error.middleware';
import { emitToWorkspace, getIO } from '../../realtime/socket';
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

  // --- Notifications ---
  const notificationsToCreate: { userId: string; type: string; payload: object }[] = [];

  // 1. Notify announcement author on new top-level comment (if not self)
  if (!data.parentId && ann.authorId !== authorId) {
    notificationsToCreate.push({
      userId: ann.authorId,
      type: 'COMMENT',
      payload: { announcementId, commentId: comment.id, message: `💬 New comment on "${ann.title}"`, preview: data.content.slice(0, 100) },
    });
  }

  // 2. Parse @mentions — extract all @Name patterns from the comment
  const mentionPattern = /@([\w\s]{2,30}?)(?=\s|$|[^a-zA-Z0-9_\s])/g;
  const mentionedNames = [...new Set([...data.content.matchAll(mentionPattern)].map((m) => m[1].trim().toLowerCase()))];

  if (mentionedNames.length > 0) {
    // Find workspace members whose names match a mention
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true } } },
    });

    const authorUser = members.find((m) => m.userId === authorId)?.user;
    const mentionedUsers = members
      .filter((m) => m.userId !== authorId && mentionedNames.some((n) => m.user.name.toLowerCase().includes(n)))
      .map((m) => m.user);

    if (mentionedUsers.length > 0) {
      // Create Mention records + notifications in one transaction
      const mentionData = mentionedUsers.map((u) => ({ userId: u.id, commentId: comment.id }));
      await prisma.mention.createMany({ data: mentionData, skipDuplicates: true });

      for (const mentioned of mentionedUsers) {
        // Skip if already notified as comment author above
        if (notificationsToCreate.some((n) => n.userId === mentioned.id)) continue;
        notificationsToCreate.push({
          userId: mentioned.id,
          type: 'MENTION',
          payload: {
            announcementId,
            commentId: comment.id,
            message: `🔔 ${authorUser?.name ?? 'Someone'} mentioned you in "${ann.title}"`,
            preview: data.content.slice(0, 100),
          },
        });
      }
    }
  }

  // Bulk-create all notifications and emit to each recipient
  if (notificationsToCreate.length > 0) {
    const created = await prisma.$transaction(
      notificationsToCreate.map((n) =>
        prisma.notification.create({ data: { userId: n.userId, type: n.type, payload: n.payload } })
      )
    );
    // Emit notification:new to each user's personal room
    try {
      const ioInstance = getIO();
      created.forEach((notif) => {
        ioInstance.to(`user:${notif.userId}`).emit('notification:new', notif as unknown as import('@worknest/types').INotification);
      });
    } catch { /* socket may not be ready in test/seed context */ }
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
