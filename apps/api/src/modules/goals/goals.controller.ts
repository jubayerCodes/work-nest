import { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { createGoalSchema, updateGoalSchema, createMilestoneSchema, updateMilestoneSchema, paginationSchema, goalFilterSchema } from '@worknest/validators';
import * as svc from './goals.service';

const wp = (req: AuthRequest) => req.params.workspaceId;
const uid = (req: AuthRequest) => req.user!.id;

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
    const goal = await svc.getGoalById(req.params.goalId, wp(req));
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
    const goal = await svc.updateGoal(req.params.goalId, wp(req), uid(req), data);
    res.json({ success: true, data: goal });
  } catch (e) { next(e); }
};

export const deleteGoal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await svc.deleteGoal(req.params.goalId, wp(req));
    res.json({ success: true, message: 'Goal deleted' });
  } catch (e) { next(e); }
};

export const createMilestone = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createMilestoneSchema.parse(req.body);
    const ms = await svc.createMilestone(req.params.goalId, wp(req), uid(req), data);
    res.status(201).json({ success: true, data: ms });
  } catch (e) { next(e); }
};

export const updateMilestone = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = updateMilestoneSchema.parse(req.body);
    const ms = await svc.updateMilestone(req.params.milestoneId, req.params.goalId, wp(req), uid(req), data);
    res.json({ success: true, data: ms });
  } catch (e) { next(e); }
};

export const deleteMilestone = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await svc.deleteMilestone(req.params.milestoneId, req.params.goalId, wp(req));
    res.json({ success: true, message: 'Milestone deleted' });
  } catch (e) { next(e); }
};
