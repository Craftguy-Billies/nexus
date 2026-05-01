import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { authMiddleware } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { AuthenticatedRequest } from '../types';

const router = Router();

router.post(
  '/register',
  authLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/login',
  authLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/logout',
  authMiddleware,
  async (_req: Request, res: Response) => {
    // In production, invalidate the token in Redis
    res.json({ message: 'Logged out successfully' });
  }
);

router.get(
  '/me',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getMe(req.user!.userId);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
