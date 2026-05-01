import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { upload } from '../../middleware/upload.middleware';
import { uploadAvatar } from '../../services/cloudinary.service';
import { prisma } from '../../config/prisma';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { Response, NextFunction } from 'express';
import { AppError } from '../../middleware/error.middleware';

const router = Router();
router.use(authMiddleware);

// GET /api/users/me — full profile with workspace memberships
router.get('/me', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true, email: true, name: true, avatarUrl: true, createdAt: true, updatedAt: true,
        memberships: { select: { role: true, workspace: { select: { id: true, name: true, slug: true, accentColor: true, description: true } } } },
      },
    });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

// PATCH /api/users/profile
router.patch('/profile', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body as { name?: string };
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { ...(name && { name }) },
      select: { id: true, email: true, name: true, avatarUrl: true },
    });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

// POST /api/users/avatar
router.post('/avatar', upload.single('avatar'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400);

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { avatarPublicId: true },
    });

    const { url, publicId } = await uploadAvatar(req.file.buffer, currentUser?.avatarPublicId);

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarUrl: url, avatarPublicId: publicId },
      select: { id: true, email: true, name: true, avatarUrl: true },
    });

    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

// PATCH /api/users/preferences
router.patch('/preferences', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { actionItemView } = req.body as { actionItemView?: string };
    const prefs = await prisma.userPreference.upsert({
      where: { userId: req.user!.id },
      update: { ...(actionItemView && { actionItemView }) },
      create: { userId: req.user!.id, actionItemView: actionItemView ?? 'kanban' },
    });
    res.json({ success: true, data: prefs });
  } catch (e) { next(e); }
});

export default router;
