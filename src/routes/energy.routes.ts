import { Router, Response, NextFunction } from 'express';
import { energyService } from '../services/energy.service';
import { authMiddleware } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

router.get(
  '/balance',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const balance = await energyService.getBalance(req.user!.userId);
      res.json(balance);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/claim-ad-reward',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // In production, verify ad completion callback from AppLovin MAX
      const result = await energyService.claimRewardedAd(req.user!.userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/claim-streak',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await energyService.claimDailyStreak(req.user!.userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
