import { Router, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service';
import { authMiddleware } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

router.get(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit, cursor } = req.query;
      const result = await notificationService.getNotifications(
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
  '/unread-count',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const count = await notificationService.getUnreadCount(
        req.user!.userId
      );
      res.json({ count });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:id/read',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await notificationService.markAsRead(req.params.id as string, req.user!.userId);
      res.json({ message: 'Marked as read' });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/read-all',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await notificationService.markAllAsRead(req.user!.userId);
      res.json({ message: 'All marked as read' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
