import { Router, Request, Response, NextFunction } from 'express';
import { subscriptionService } from '../services/subscription.service';
import { authMiddleware } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

router.get(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const sub = await subscriptionService.getSubscription(req.user!.userId);
      res.json(sub);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/update',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { tier, revenueCatData } = req.body;
      const sub = await subscriptionService.updateSubscription(
        req.user!.userId,
        tier,
        revenueCatData
      );
      res.json(sub);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/cancel',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await subscriptionService.cancelSubscription(
        req.user!.userId
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// RevenueCat Webhook
router.post(
  '/webhook/revenuecat',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // In production, verify webhook signature
      const event = req.body;
      await subscriptionService.handleRevenueCatWebhook(event);
      res.json({ received: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
