import { Router, Response, NextFunction } from 'express';
import { postService } from '../services/post.service';
import { commentService } from '../services/comment.service';
import { likeService } from '../services/like.service';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

router.post(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const post = await postService.createPost(req.user!.userId, req.body);
      res.status(201).json(post);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/trending',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit, cursor } = req.query;
      const result = await postService.getTrendingPosts(
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
  '/:id',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const post = await postService.getPost(
        req.params.id as string,
        req.user?.userId
      );
      res.json(post);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/:id',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const post = await postService.updatePost(
        req.params.id as string,
        req.user!.userId,
        req.body
      );
      res.json(post);
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
      await postService.deletePost(req.params.id as string, req.user!.userId);
      res.json({ message: 'Post deleted' });
    } catch (err) {
      next(err);
    }
  }
);

// User's posts
router.get(
  '/user/:userId',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit, cursor } = req.query;
      const result = await postService.getUserPosts(
        req.params.userId as string,
        parseInt(limit as string) || 20,
        cursor as string
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// Comments
router.get(
  '/:id/comments',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit, cursor } = req.query;
      const result = await commentService.getComments(
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

router.post(
  '/:id/comments',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const comment = await commentService.createComment(req.user!.userId, {
        postId: req.params.id as string,
        content: req.body.content,
        parentId: req.body.parentId,
      });
      res.status(201).json(comment);
    } catch (err) {
      next(err);
    }
  }
);

// Likes
router.post(
  '/:id/like',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const like = await likeService.likePost(req.user!.userId, req.params.id as string);
      res.status(201).json(like);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:id/like',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await likeService.unlikePost(req.user!.userId, req.params.id as string);
      res.json({ message: 'Unliked' });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/:id/likes',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit, cursor } = req.query;
      const result = await likeService.getPostLikes(
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
