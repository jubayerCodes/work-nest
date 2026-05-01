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
    const workspace = await getWorkspaceById(req.params.workspaceId, req.user!.id);
    res.json({ success: true, data: workspace });
  } catch (e) { next(e); }
}

export async function update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateWorkspaceSchema.parse(req.body);
    const workspace = await updateWorkspace(req.params.workspaceId, data);
    res.json({ success: true, message: 'Workspace updated', data: workspace });
  } catch (e) { next(e); }
}

export async function remove(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await deleteWorkspace(req.params.workspaceId);
    res.json({ success: true, message: 'Workspace deleted' });
  } catch (e) { next(e); }
}

export async function invite(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = inviteMemberSchema.parse(req.body);
    const result = await inviteMember(req.params.workspaceId, data, env.CLIENT_URL);
    res.json({ success: true, message: result.message });
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
    const invitation = await getInvitationByToken(req.params.token);
    res.json({ success: true, data: invitation });
  } catch (e) { next(e); }
}

export async function kickMember(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    await removeMember(req.params.workspaceId, req.params.userId, req.user!.id);
    res.json({ success: true, message: 'Member removed' });
  } catch (e) { next(e); }
}

export async function changeRole(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role } = updateMemberRoleSchema.parse(req.body);
    const member = await updateMemberRole(req.params.workspaceId, req.params.userId, role);
    res.json({ success: true, data: member });
  } catch (e) { next(e); }
}
