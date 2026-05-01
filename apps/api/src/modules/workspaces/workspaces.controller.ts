import { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import {
  getUserWorkspaces,
  createWorkspace,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
  inviteMember,
  acceptInvitation,
  removeMember,
  updateMemberRole,
  getInvitationByToken,
} from './workspaces.service';
import { createWorkspaceSchema, updateWorkspaceSchema, inviteMemberSchema, updateMemberRoleSchema } from '@worknest/validators';
import { env } from '../../config/env';

const p = (req: AuthRequest, key: string): string => req.params[key] as string;

export async function getMyWorkspaces(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const memberships = await getUserWorkspaces(req.user!.id);
    res.json({ success: true, data: memberships });
  } catch (e) { next(e); }
}

export async function create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createWorkspaceSchema.parse(req.body);
    const workspace = await createWorkspace(req.user!.id, data);
    res.status(201).json({ success: true, message: 'Workspace created', data: workspace });
  } catch (e) { next(e); }
}

export async function getOne(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const workspace = await getWorkspaceById(p(req, 'workspaceId'), req.user!.id);
    res.json({ success: true, data: workspace });
  } catch (e) { next(e); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateWorkspaceSchema.parse(req.body);
    const workspace = await updateWorkspace(p(req, 'workspaceId'), data);
    res.json({ success: true, message: 'Workspace updated', data: workspace });
  } catch (e) { next(e); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteWorkspace(p(req, 'workspaceId'));
    res.json({ success: true, message: 'Workspace deleted' });
  } catch (e) { next(e); }
}

export async function invite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = inviteMemberSchema.parse(req.body);
    const result = await inviteMember(p(req, 'workspaceId'), data, env.CLIENT_URL);
    res.json({ success: true, message: result.message, data: { inviteLink: result.inviteLink } });
  } catch (e) { next(e); }
}

export async function acceptInvite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.body;
    const workspace = await acceptInvitation(token, req.user!.id);
    res.json({ success: true, message: 'Joined workspace', data: workspace });
  } catch (e) { next(e); }
}

export async function getInvitation(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const invitation = await getInvitationByToken(p(req, 'token'));
    res.json({ success: true, data: invitation });
  } catch (e) { next(e); }
}

export async function kickMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await removeMember(p(req, 'workspaceId'), p(req, 'userId'), req.user!.id);
    res.json({ success: true, message: 'Member removed' });
  } catch (e) { next(e); }
}

export async function changeRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role } = updateMemberRoleSchema.parse(req.body);
    const member = await updateMemberRole(p(req, 'workspaceId'), p(req, 'userId'), role);
    res.json({ success: true, data: member });
  } catch (e) { next(e); }
}
