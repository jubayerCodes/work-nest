import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { prisma } from '../../config/prisma';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { Response, NextFunction } from 'express';

const router: Router = Router();
router.use(authMiddleware);

// GET /api/notifications?workspaceId=...
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: notifications });
  } catch (e) { next(e); }
});

router.patch('/read-all', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user!.id, read: false }, data: { read: true } });
    res.json({ success: true });
  } catch (e) { next(e); }
});

router.patch('/:id/read', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({ where: { id: req.params.id as string, userId: req.user!.id }, data: { read: true } });
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default router;
