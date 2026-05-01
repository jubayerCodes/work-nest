import { Router } from 'express';
import * as ctrl from './announcements.controller';
import { authMiddleware, workspaceGuard, adminGuard } from '../../middleware/auth.middleware';

const router = Router({ mergeParams: true });
router.use(authMiddleware, workspaceGuard);

router.get('/', ctrl.getAll);
router.post('/', adminGuard, ctrl.create);            // Admin only
router.get('/:announcementId', ctrl.getOne);
router.patch('/:announcementId', adminGuard, ctrl.update);
router.delete('/:announcementId', adminGuard, ctrl.remove);
router.patch('/:announcementId/pin', adminGuard, ctrl.pin);

// Reactions & Comments (all members)
router.post('/:announcementId/reactions', ctrl.toggleReaction);
router.post('/:announcementId/comments', ctrl.addComment);
router.patch('/:announcementId/comments/:commentId', ctrl.editComment);
router.delete('/:announcementId/comments/:commentId', ctrl.removeComment);

export default router;
