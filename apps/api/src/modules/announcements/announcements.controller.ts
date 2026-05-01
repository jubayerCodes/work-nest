import { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { createAnnouncementSchema, updateAnnouncementSchema, createCommentSchema, toggleReactionSchema } from '@worknest/validators';
import * as svc from './announcements.service';

const wp = (req: AuthRequest): string => req.params.workspaceId as string;
const uid = (req: AuthRequest): string => req.user!.id;
const p = (req: AuthRequest, key: string): string => req.params[key] as string;

export const getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.getAnnouncements(wp(req)) }); } catch (e) { next(e); }
};

export const getOne = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await svc.getAnnouncementById(p(req, 'announcementId'), wp(req)) }); } catch (e) { next(e); }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createAnnouncementSchema.parse(req.body);
    res.status(201).json({ success: true, data: await svc.createAnnouncement(wp(req), uid(req), data) });
  } catch (e) { next(e); }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = updateAnnouncementSchema.parse(req.body);
    res.json({ success: true, data: await svc.updateAnnouncement(p(req, 'announcementId'), wp(req), data) });
  } catch (e) { next(e); }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { await svc.deleteAnnouncement(p(req, 'announcementId'), wp(req)); res.json({ success: true }); } catch (e) { next(e); }
};

export const pin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { pinned } = req.body as { pinned: boolean };
    res.json({ success: true, data: await svc.pinAnnouncement(p(req, 'announcementId'), wp(req), pinned) });
  } catch (e) { next(e); }
};

export const toggleReaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = toggleReactionSchema.parse(req.body);
    res.json({ success: true, data: await svc.toggleReaction(p(req, 'announcementId'), uid(req), wp(req), data) });
  } catch (e) { next(e); }
};

export const addComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createCommentSchema.parse(req.body);
    res.status(201).json({ success: true, data: await svc.createComment(p(req, 'announcementId'), uid(req), wp(req), data) });
  } catch (e) { next(e); }
};

export const editComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { content } = req.body as { content: string };
    res.json({ success: true, data: await svc.updateComment(p(req, 'commentId'), uid(req), wp(req), content) });
  } catch (e) { next(e); }
};

export const removeComment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { await svc.deleteComment(p(req, 'commentId'), uid(req), wp(req)); res.json({ success: true }); } catch (e) { next(e); }
};
