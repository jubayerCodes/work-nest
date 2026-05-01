import { prisma } from '../../config/prisma';
import { uploadAvatar } from '../../services/cloudinary.service';

const USER_SELECT = {
  id: true, email: true, name: true, avatarUrl: true, createdAt: true, updatedAt: true,
  memberships: {
    select: {
      role: true,
      workspace: { select: { id: true, name: true, slug: true, accentColor: true, description: true } },
    },
  },
} as const;

export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({ where: { id: userId }, select: USER_SELECT });
}

export async function updateUserProfile(userId: string, data: { name?: string }) {
  return prisma.user.update({ where: { id: userId }, data, select: USER_SELECT });
}

export async function updateAvatar(userId: string, buffer: Buffer) {
  // Get current avatar public ID for cleanup
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } });

  // Extract public_id from existing Cloudinary URL (format: .../worknest/avatars/<id>)
  let oldPublicId: string | null = null;
  if (user?.avatarUrl?.includes('cloudinary.com')) {
    const parts = user.avatarUrl.split('/');
    const uploadIndex = parts.findIndex((p) => p === 'upload');
    if (uploadIndex !== -1) {
      // Skip version segment (v1234567) if present
      const afterUpload = parts.slice(uploadIndex + 1);
      const publicIdParts = afterUpload[0].startsWith('v') ? afterUpload.slice(1) : afterUpload;
      oldPublicId = publicIdParts.join('/').replace(/\.[^/.]+$/, ''); // remove extension
    }
  }

  const { url } = await uploadAvatar(buffer, oldPublicId);
  return prisma.user.update({ where: { id: userId }, data: { avatarUrl: url }, select: USER_SELECT });
}
