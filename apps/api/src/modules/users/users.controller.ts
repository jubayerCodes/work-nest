import { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { getUserProfile, updateUserProfile, updateAvatar } from './users.service';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50).optional(),
});

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await getUserProfile(req.user!.id);
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    res.json({ success: true, data: { user } });
  } catch (e) { next(e); }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await updateUserProfile(req.user!.id, data);
    res.json({ success: true, message: 'Profile updated', data: { user } });
  } catch (e) { next(e); }
}

export async function uploadAvatarHandler(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) { res.status(400).json({ success: false, message: 'No file uploaded' }); return; }
    const user = await updateAvatar(req.user!.id, req.file.buffer);
    res.json({ success: true, message: 'Avatar updated', data: { user } });
  } catch (e) { next(e); }
}
