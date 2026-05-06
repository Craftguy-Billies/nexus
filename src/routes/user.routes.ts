import { Router, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

router.get(
  '/search',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { q, limit } = req.query;
      const users = await userService.searchUsers(
        q as string,
        parseInt(limit as string) || 20
      );
      res.json({ items: users });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:identifier',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const identifier = req.params.identifier as string;
      // Try by ID first, then by username
      let user;
      try {
        user = await userService.getUserById(identifier);
      } catch {
        user = await userService.getUserByUsername(identifier);
      }
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/profile',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await userService.updateProfile(req.user!.userId, req.body);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/push-token',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { expoPushToken } = req.body;
      await userService.updatePushToken(req.user!.userId, expoPushToken);
      res.json({ message: 'Push token updated' });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/notification-preferences',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await userService.updateNotificationPreferences(
        req.user!.userId,
        req.body
      );
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/onboarding/interests',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const interests = Array.isArray(req.body?.interests) ? req.body.interests : [];
      const user = await userService.saveOnboardingInterests(req.user!.userId, interests);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/onboarding/friends',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const aiCharacterIds = Array.isArray(req.body?.aiCharacterIds)
        ? req.body.aiCharacterIds
        : [];
      const user = await userService.saveOnboardingFriends(req.user!.userId, aiCharacterIds);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/onboarding/complete',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await userService.completeOnboarding(req.user!.userId);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/me',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await userService.deleteAccount(req.user!.userId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:id/followers',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit, cursor } = req.query;
      const result = await userService.getFollowers(
        req.params.id as string,
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
  '/:id/following',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit, cursor } = req.query;
      const result = await userService.getFollowing(
        req.params.id as string,
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
