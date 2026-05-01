import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Optional until avatar upload feature is used
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),

  // Optional until invitation emails are needed
  RESEND_API_KEY: z.string().optional().default(''),
  EMAIL_FROM: z.string().optional().default('WorkNest <noreply@worknest.io>'),

  CLIENT_URL: z.string().url().default('http://localhost:3000'),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;

// Warn about missing optional services (non-fatal)
if (!env.CLOUDINARY_CLOUD_NAME) {
  console.warn('⚠️  Cloudinary not configured — avatar uploads will be unavailable');
}
if (!env.RESEND_API_KEY) {
  console.warn('⚠️  Resend not configured — email invitations will be unavailable');
}
