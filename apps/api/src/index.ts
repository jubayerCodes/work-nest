import './config/env'; // Validate env first
import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';

import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';

// Routers
import authRouter from './modules/auth/auth.router';
import workspacesRouter from './modules/workspaces/workspaces.router';
import goalsRouter from './modules/goals/goals.router';
import actionItemsRouter from './modules/action-items/action-items.router';
import announcementsRouter from './modules/announcements/announcements.router';
import analyticsRouter from './modules/analytics/analytics.router';
import notificationsRouter from './modules/notifications/notifications.router';
import usersRouter from './modules/users/users.router';

// Socket.io
import { initSocket } from './realtime/socket';

const app: express.Application = express();
const server = http.createServer(app);

// ---- Security & Parsing Middleware ----
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true, // required for httpOnly cookies
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// ---- Rate Limiting ----
// Skip rate limiting in development so repeated testing doesn't block you
const isDev = env.NODE_ENV === 'development';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10_000 : 300,
  skip: () => isDev,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10_000 : 20, // strict only in production
  skip: () => isDev,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

app.use('/api', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ---- Health Check ----
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---- API Routes ----
app.use('/api/auth', authRouter);
app.use('/api/workspaces', workspacesRouter);
app.use('/api/workspaces/:workspaceId/goals', goalsRouter);
app.use('/api/workspaces/:workspaceId/action-items', actionItemsRouter);
app.use('/api/workspaces/:workspaceId/announcements', announcementsRouter);
app.use('/api/workspaces/:workspaceId/analytics', analyticsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/users', usersRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ---- Global Error Handler (must be last) ----
app.use(errorHandler);

// ---- Socket.io ----
initSocket(server);

// ---- Start Server ----
const PORT = env.PORT;
server.listen(PORT, () => {
  console.log(`🚀 WorkNest API running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready`);
  console.log(`🌍 Environment: ${env.NODE_ENV}`);
});

export { app, server };
