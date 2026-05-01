import { Router } from 'express';
import * as ctrl from './goals.controller';
import { authMiddleware, workspaceGuard } from '../../middleware/auth.middleware';

const router = Router({ mergeParams: true }); // inherits workspaceId from parent
router.use(authMiddleware, workspaceGuard);

router.get('/', ctrl.getGoals);
router.post('/', ctrl.createGoal);
router.get('/:goalId', ctrl.getGoal);
router.patch('/:goalId', ctrl.updateGoal);
router.delete('/:goalId', ctrl.deleteGoal);

// Milestones
router.post('/:goalId/milestones', ctrl.createMilestone);
router.patch('/:goalId/milestones/:milestoneId', ctrl.updateMilestone);
router.delete('/:goalId/milestones/:milestoneId', ctrl.deleteMilestone);

export default router;
