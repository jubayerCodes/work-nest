import { Router } from 'express';
import {
  getMyWorkspaces, create, getOne, update, remove,
  invite, acceptInvite, getInvitation, kickMember, changeRole,
} from './workspaces.controller';
import { authMiddleware, workspaceGuard, adminGuard } from '../../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

// User's workspace list
router.get('/', getMyWorkspaces);
router.post('/', create);

// Invitation (public token lookup, but requires auth to accept)
router.get('/invitations/:token', getInvitation);
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
