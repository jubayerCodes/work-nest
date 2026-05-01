import { cloudinary } from '../config/cloudinary';
import { AppError } from '../middleware/error.middleware';

export async function uploadAvatar(
  buffer: Buffer,
  oldPublicId?: string | null
): Promise<{ url: string; publicId: string }> {
  // Delete old avatar if it exists
  if (oldPublicId) {
    await cloudinary.uploader.destroy(oldPublicId).catch(() => {
      // Non-critical: log but don't block the upload
      console.warn(`Failed to delete old avatar: ${oldPublicId}`);
    });
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'worknest/avatars',
        transformation: [
          { width: 200, height: 200, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error || !result) {
          reject(new AppError('Failed to upload avatar', 500));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    uploadStream.end(buffer);
  });
}
