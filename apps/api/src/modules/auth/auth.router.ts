import { Router } from 'express';
import { register, login, refresh, logout, getMe } from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router: Router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);

// Protected routes
router.post('/logout', authMiddleware, logout);
router.get('/me', authMiddleware, getMe);

export default router;
