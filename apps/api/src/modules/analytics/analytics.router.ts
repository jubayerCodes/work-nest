import { Router } from 'express';
import { authMiddleware, workspaceGuard } from '../../middleware/auth.middleware';
import { getWorkspaceAnalytics } from './analytics.service';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { Response, NextFunction } from 'express';

const router = Router({ mergeParams: true });
router.use(authMiddleware, workspaceGuard);

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = await getWorkspaceAnalytics(req.params.workspaceId);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

export default router;
