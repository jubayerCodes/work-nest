import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/error.middleware';
import { sendInvitationEmail } from '../../services/email.service';
import { generateSlug } from '@worknest/utils';
import { nanoid } from 'nanoid';
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  InviteMemberInput,
} from '@worknest/validators';

const WORKSPACE_SELECT = {
  id: true,
  name: true,
  description: true,
  accentColor: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
} as const;

const MEMBER_SELECT = {
  id: true,
  role: true,
  joinedAt: true,
  user: {
    select: { id: true, email: true, name: true, avatarUrl: true },
  },
} as const;

export async function getUserWorkspaces(userId: string) {
  return prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: { select: WORKSPACE_SELECT },
    },
    orderBy: { joinedAt: 'asc' },
  });
}

export async function createWorkspace(userId: string, data: CreateWorkspaceInput) {
  let slug = generateSlug(data.name);

  // Ensure slug is unique
  const existing = await prisma.workspace.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${nanoid(6)}`;

  return prisma.workspace.create({
    data: {
      name: data.name,
      description: data.description,
      accentColor: data.accentColor ?? '#6366f1',
      slug,
      members: {
        create: { userId, role: 'ADMIN' },
      },
    },
    select: WORKSPACE_SELECT,
  });
}

export async function getWorkspaceById(workspaceId: string, userId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      ...WORKSPACE_SELECT,
      members: { select: MEMBER_SELECT, orderBy: { joinedAt: 'asc' } },
    },
  });

  if (!workspace) throw new AppError('Workspace not found', 404);

  // Get current user's role
  const currentMember = workspace.members.find((m) => m.user.id === userId);

  return { ...workspace, currentUserRole: currentMember?.role ?? null };
}

export async function updateWorkspace(
  workspaceId: string,
  data: UpdateWorkspaceInput
) {
  return prisma.workspace.update({
    where: { id: workspaceId },
    data,
    select: WORKSPACE_SELECT,
  });
}

export async function deleteWorkspace(workspaceId: string) {
  return prisma.workspace.delete({ where: { id: workspaceId } });
}

export async function inviteMember(
  workspaceId: string,
  data: InviteMemberInput,
  clientUrl: string
) {
  // Check if already a member
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { name: true, members: { select: { user: { select: { email: true } } } } },
  });

  if (!workspace) throw new AppError('Workspace not found', 404);

  const alreadyMember = workspace.members.some((m) => m.user.email === data.email);
  if (alreadyMember) {
    throw new AppError('User is already a member', 409, 'ALREADY_MEMBER');
  }

  // Revoke any existing pending invitation
  await prisma.invitation.deleteMany({
    where: { workspaceId, email: data.email, accepted: false },
  });

  const token = nanoid(48);
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

  await prisma.invitation.create({
    data: { email: data.email, token, expiresAt, workspaceId },
  });

  const inviteLink = `${clientUrl}/invite?token=${token}`;

  // Non-fatal: email failure should not block the invitation creation
  try {
    await sendInvitationEmail(data.email, workspace.name, inviteLink);
  } catch (emailErr) {
    console.error('[Email] Failed to send invitation email:', emailErr);
    // Invitation is still stored — user can share the link manually
  }

  return { message: 'Invitation sent', inviteLink };
}

export async function acceptInvitation(token: string, userId: string) {
  const invitation = await prisma.invitation.findUnique({ where: { token } });

  if (!invitation) throw new AppError('Invalid invitation', 404);
  if (invitation.accepted) throw new AppError('Invitation already used', 400);
  if (invitation.expiresAt < new Date()) {
    throw new AppError('Invitation has expired', 400, 'INVITATION_EXPIRED');
  }

  // Check user email matches invitation email
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user || user.email !== invitation.email) {
    throw new AppError('This invitation was sent to a different email address', 403);
  }

  // Already a member?
  const existingMember = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId: invitation.workspaceId } },
  });
  if (existingMember) throw new AppError('Already a member of this workspace', 409);

  await prisma.$transaction([
    prisma.workspaceMember.create({
      data: { userId, workspaceId: invitation.workspaceId, role: 'MEMBER' },
    }),
    prisma.invitation.update({ where: { token }, data: { accepted: true } }),
  ]);

  return prisma.workspace.findUnique({
    where: { id: invitation.workspaceId },
    select: { id: true, name: true, slug: true, accentColor: true },
  });
}

export async function removeMember(workspaceId: string, targetUserId: string, requestingUserId: string) {
  // Prevent self-removal of last admin
  const adminCount = await prisma.workspaceMember.count({
    where: { workspaceId, role: 'ADMIN' },
  });

  const targetMember = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
  });

  if (!targetMember) throw new AppError('Member not found', 404);

  if (targetMember.role === 'ADMIN' && adminCount <= 1) {
    throw new AppError('Cannot remove the last admin from the workspace', 400);
  }

  return prisma.workspaceMember.delete({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
  });
}

export async function updateMemberRole(
  workspaceId: string,
  targetUserId: string,
  role: 'ADMIN' | 'MEMBER'
) {
  return prisma.workspaceMember.update({
    where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
    data: { role },
    select: MEMBER_SELECT,
  });
}

export async function getInvitationByToken(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { workspace: { select: { name: true, accentColor: true } } },
  });

  if (!invitation) throw new AppError('Invalid invitation', 404);
  if (invitation.expiresAt < new Date()) {
    throw new AppError('Invitation has expired', 400, 'INVITATION_EXPIRED');
  }

  return invitation;
}
