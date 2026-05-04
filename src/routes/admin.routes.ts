import { Router, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { aiCharacterService } from '../services/aiCharacter.service';
import { tokenUsageTracker } from '../services/tokenUsage.service';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

// All admin routes require auth + admin role
router.use(authMiddleware);

// Users
router.get(
  '/users',
  adminMiddleware(),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit, offset, search } = req.query;
      const where: Record<string, unknown> = {};
      if (search) {
        where.OR = [
          { username: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { displayName: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          take: parseInt(limit as string) || 50,
          skip: parseInt(offset as string) || 0,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            username: true,
            email: true,
            displayName: true,
            subscriptionTier: true,
            isActive: true,
            isBanned: true,
            followerCount: true,
            postCount: true,
            createdAt: true,
            lastActiveAt: true,
          },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({ items: users, total });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/users/:id/ban',
  adminMiddleware(['ban_user']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { reason } = req.body;
      const user = await prisma.user.update({
        where: { id: req.params.id as string },
        data: {
          isBanned: true,
          banReason: reason || 'Banned by admin',
          isActive: false,
        },
      });
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/users/:id/unban',
  adminMiddleware(['ban_user']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.update({
        where: { id: req.params.id as string },
        data: {
          isBanned: false,
          banReason: null,
          isActive: true,
        },
      });
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

// AI Characters
router.get(
  '/ai-characters',
  adminMiddleware(['manage_ai_characters']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit, cursor } = req.query;
      const result = await aiCharacterService.listCharacters({
        limit: parseInt(limit as string) || 50,
        cursor: cursor as string,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/ai-characters',
  adminMiddleware(['manage_ai_characters']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const character = await aiCharacterService.createCharacter(
        req.user!.userId,
        req.body,
        true // isAdmin
      );
      res.status(201).json(character);
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/ai-characters/:id',
  adminMiddleware(['manage_ai_characters']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const character = await aiCharacterService.updateCharacter(
        req.params.id as string,
        req.body
      );
      res.json(character);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/ai-characters/:id',
  adminMiddleware(['manage_ai_characters']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await aiCharacterService.deleteCharacter(req.params.id as string);
      res.json({ message: 'AI Character deactivated' });
    } catch (err) {
      next(err);
    }
  }
);

// Token Usage
router.get(
  '/token-usage',
  adminMiddleware(['view_token_usage']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { yearMonth } = req.query;
      const overview = await tokenUsageTracker.getUsageOverview(
        yearMonth as string
      );
      res.json(overview);
    } catch (err) {
      next(err);
    }
  }
);

// Moderation Queue
router.get(
  '/moderation-queue',
  adminMiddleware(),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit, offset } = req.query;
      const [posts, total] = await Promise.all([
        prisma.post.findMany({
          where: { moderationStatus: { in: ['pending', 'flagged'] } },
          take: parseInt(limit as string) || 20,
          skip: parseInt(offset as string) || 0,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.post.count({
          where: { moderationStatus: { in: ['pending', 'flagged'] } },
        }),
      ]);
      res.json({ items: posts, total });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  '/moderation/:id',
  adminMiddleware(),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { decision } = req.body; // 'approved' | 'rejected'
      const post = await prisma.post.update({
        where: { id: req.params.id as string },
        data: {
          moderationStatus: decision,
          moderationDetails: {
            reviewedBy: req.user!.userId,
            reviewedAt: new Date().toISOString(),
          },
        },
      });
      res.json(post);
    } catch (err) {
      next(err);
    }
  }
);

// Analytics
router.get(
  '/analytics',
  adminMiddleware(['view_analytics']),
  async (_req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const [
        totalUsers,
        activeUsers,
        totalPosts,
        totalAICharacters,
        premiumUsers,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({
          where: {
            lastActiveAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        prisma.post.count({ where: { isArchived: false } }),
        prisma.aICharacter.count({ where: { isActive: true } }),
        prisma.user.count({
          where: { subscriptionTier: { in: ['premium', 'pro'] } },
        }),
      ]);

      const tokenUsage = await tokenUsageTracker.getUsageOverview();

      res.json({
        users: {
          total: totalUsers,
          activeLastWeek: activeUsers,
          premium: premiumUsers,
        },
        content: {
          totalPosts,
          totalAICharacters,
        },
        tokenUsage: tokenUsage.totals,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
