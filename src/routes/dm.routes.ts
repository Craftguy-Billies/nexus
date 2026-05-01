import { Router, Response, NextFunction } from 'express';
import { dmService } from '../services/dm.service';
import { authMiddleware } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import { AuthenticatedRequest } from '../types';

const router = Router();

router.get(
  '/conversations',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit, cursor } = req.query;
      const result = await dmService.getConversations(
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
  '/messages/:aiCharacterId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit, cursor } = req.query;
      const result = await dmService.getMessages(
        req.user!.userId,
        req.params.aiCharacterId as string,
        parseInt(limit as string) || 50,
        cursor as string
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/send/:aiCharacterId',
  authMiddleware,
  aiLimiter,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { content } = req.body;
      const result = await dmService.sendMessage(
        req.user!.userId,
        req.params.aiCharacterId as string,
        content
      );
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
