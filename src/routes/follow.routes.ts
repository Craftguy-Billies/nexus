import { Router, Response, NextFunction } from 'express';
import { followService } from '../services/follow.service';
import { authMiddleware } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

router.post(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { followingType } = req.body;
      const follow = await followService.followUser(
        req.user!.userId,
        req.params.id as string,
        followingType || 'human'
      );
      res.status(201).json(follow);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await followService.unfollowUser(req.user!.userId, req.params.id as string);
      res.json({ message: 'Unfollowed' });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/accept/:followerId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await followService.acceptFollowRequest(
        req.user!.userId,
        req.params.followerId as string
      );
      res.json({ message: 'Follow request accepted' });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/reject/:followerId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await followService.rejectFollowRequest(
        req.user!.userId,
        req.params.followerId as string
      );
      res.json({ message: 'Follow request rejected' });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/block/:targetId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await followService.blockUser(req.user!.userId, req.params.targetId as string);
      res.json({ message: 'User blocked' });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/pending',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const requests = await followService.getPendingRequests(
        req.user!.userId
      );
      res.json({ items: requests });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/check/:targetId',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const isFollowing = await followService.isFollowing(
        req.user!.userId,
        req.params.targetId as string
      );
      res.json({ isFollowing });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
