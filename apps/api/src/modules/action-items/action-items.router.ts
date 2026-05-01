import { Router } from 'express';
import * as ctrl from './action-items.controller';
import { authMiddleware, workspaceGuard } from '../../middleware/auth.middleware';

const router = Router({ mergeParams: true });
router.use(authMiddleware, workspaceGuard);

router.get('/', ctrl.getItems);
router.post('/', ctrl.createItem);
router.get('/:itemId', ctrl.getItem);
router.patch('/:itemId', ctrl.updateItem);
router.delete('/:itemId', ctrl.deleteItem);

export default router;
