import { Router, Response, NextFunction } from 'express';
import { feedService } from '../services/feed.service';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

router.get(
  '/home',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit, cursor } = req.query;
      const result = await feedService.getHomeFeed(
        req.user!.userId,
        parseInt(limit as string) || 20,
        cursor as string
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/discover',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit, cursor } = req.query;
      const result = await feedService.getDiscoverFeed(
        parseInt(limit as string) || 20,
        cursor as string
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/following',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit, cursor } = req.query;
      const result = await feedService.getFollowingFeed(
        req.user!.userId,
        parseInt(limit as string) || 20,
        cursor as string
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
