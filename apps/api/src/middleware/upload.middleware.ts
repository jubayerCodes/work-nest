import multer from 'multer';
import { AppError } from './error.middleware';

// Store file in memory (buffer) for streaming to Cloudinary
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only JPEG, PNG, WebP, and GIF images are allowed', 400));
    }
  },
});
