import { Router } from 'express';
import {
  getMyWorkspaces, create, getOne, update, remove,
  invite, acceptInvite, getInvitation, kickMember, changeRole,
} from './workspaces.controller';
import { authMiddleware, workspaceGuard, adminGuard } from '../../middleware/auth.middleware';

const router: Router = Router();

// Public: invitation preview (no auth needed — user may not be logged in yet)
router.get('/invitations/:token', getInvitation);

// All routes below require authentication
router.use(authMiddleware);

// User's workspace list
router.get('/', getMyWorkspaces);
router.post('/', create);

// Accept invitation (requires auth — must be logged in to join)
router.post('/invitations/accept', acceptInvite);

// Workspace-scoped routes
router.get('/:workspaceId', workspaceGuard, getOne);
router.patch('/:workspaceId', workspaceGuard, adminGuard, update);
router.delete('/:workspaceId', workspaceGuard, adminGuard, remove);

// Member management (admin only)
router.post('/:workspaceId/members/invite', workspaceGuard, adminGuard, invite);
router.delete('/:workspaceId/members/:userId', workspaceGuard, adminGuard, kickMember);
router.patch('/:workspaceId/members/:userId/role', workspaceGuard, adminGuard, changeRole);

export default router;
