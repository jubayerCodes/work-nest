import { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { createActionItemSchema, updateActionItemSchema, actionItemFilterSchema } from '@worknest/validators';
import * as svc from './action-items.service';

const wp = (req: AuthRequest) => req.params.workspaceId;

export const getItems = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filter = actionItemFilterSchema.parse(req.query);
    const items = await svc.getActionItems(wp(req), filter);
    res.json({ success: true, data: items });
  } catch (e) { next(e); }
};

export const getItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const item = await svc.getActionItemById(req.params.itemId, wp(req));
    res.json({ success: true, data: item });
  } catch (e) { next(e); }
};

export const createItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createActionItemSchema.parse(req.body);
    const item = await svc.createActionItem(wp(req), data);
    res.status(201).json({ success: true, data: item });
  } catch (e) { next(e); }
};

export const updateItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = updateActionItemSchema.parse(req.body);
    const item = await svc.updateActionItem(req.params.itemId, wp(req), data);
    res.json({ success: true, data: item });
  } catch (e) { next(e); }
};

export const deleteItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await svc.deleteActionItem(req.params.itemId, wp(req));
    res.json({ success: true, message: 'Action item deleted' });
  } catch (e) { next(e); }
};
