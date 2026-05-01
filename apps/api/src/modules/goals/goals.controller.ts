import { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { createGoalSchema, updateGoalSchema, createMilestoneSchema, updateMilestoneSchema, paginationSchema, goalFilterSchema } from '@worknest/validators';
import * as svc from './goals.service';

const wp = (req: AuthRequest): string => req.params.workspaceId as string;
const uid = (req: AuthRequest): string => req.user!.id;
const p = (req: AuthRequest, key: string): string => req.params[key] as string;

export const getGoals = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const filter = goalFilterSchema.parse(req.query);
    const page = paginationSchema.parse(req.query);
    const result = await svc.getGoals(wp(req), { ...filter, ...page });
    res.json({ success: true, ...result });
  } catch (e) { next(e); }
};

export const getGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const goal = await svc.getGoalById(p(req, 'goalId'), wp(req));
    res.json({ success: true, data: goal });
  } catch (e) { next(e); }
};

export const createGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createGoalSchema.parse(req.body);
    const goal = await svc.createGoal(wp(req), uid(req), data);
    res.status(201).json({ success: true, message: 'Goal created', data: goal });
  } catch (e) { next(e); }
};

export const updateGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = updateGoalSchema.parse(req.body);
    const goal = await svc.updateGoal(p(req, 'goalId'), wp(req), uid(req), data);
    res.json({ success: true, data: goal });
  } catch (e) { next(e); }
};

export const deleteGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await svc.deleteGoal(p(req, 'goalId'), wp(req));
    res.json({ success: true, message: 'Goal deleted' });
  } catch (e) { next(e); }
};

export const createMilestone = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createMilestoneSchema.parse(req.body);
    const ms = await svc.createMilestone(p(req, 'goalId'), wp(req), uid(req), data);
    res.status(201).json({ success: true, data: ms });
  } catch (e) { next(e); }
};

export const updateMilestone = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = updateMilestoneSchema.parse(req.body);
    const ms = await svc.updateMilestone(p(req, 'milestoneId'), p(req, 'goalId'), wp(req), uid(req), data);
    res.json({ success: true, data: ms });
  } catch (e) { next(e); }
};

export const deleteMilestone = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await svc.deleteMilestone(p(req, 'milestoneId'), p(req, 'goalId'), wp(req));
    res.json({ success: true, message: 'Milestone deleted' });
  } catch (e) { next(e); }
};
