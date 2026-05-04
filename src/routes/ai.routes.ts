import { Router, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { aiCharacterService } from '../services/aiCharacter.service';
import { tokenUsageTracker } from '../services/tokenUsage.service';
import { moderationService } from '../services/moderation.service';
import { visionService } from '../services/vision.service';
import { authMiddleware } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import { AuthenticatedRequest } from '../types';

const router = Router();

router.post(
  '/generate-reply',
  authMiddleware,
  aiLimiter,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { aiCharacterId, message, recentMessages } = req.body;
      const result = await aiService.generateDMReply(
        aiCharacterId,
        req.user!.userId,
        message,
        recentMessages || []
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/generate-post',
  authMiddleware,
  aiLimiter,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { aiCharacterId, trigger } = req.body;
      const result = await aiService.generatePost(aiCharacterId, trigger);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/generate-comment',
  authMiddleware,
  aiLimiter,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { aiCharacterId, postContent, postAuthorName } = req.body;
      const result = await aiService.generateComment(
        aiCharacterId,
        postContent,
        postAuthorName
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/generate-bio',
  authMiddleware,
  aiLimiter,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { aiCharacterId } = req.body;
      const result = await aiService.generateBio(aiCharacterId);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/moderate',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { content } = req.body;
      const result = await moderationService.checkContent(content);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/suggest-bio',
  authMiddleware,
  aiLimiter,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { interests, personality } = req.body;
      const result = await aiService.suggestBioForUser(
        interests || [],
        personality || 'friendly and creative'
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/suggest-post',
  authMiddleware,
  aiLimiter,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { interests, recentPosts } = req.body;
      const result = await aiService.suggestPostForUser(
        interests || [],
        recentPosts || []
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/usage',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { aiCharacterId, yearMonth } = req.query;
      if (aiCharacterId) {
        const usage = await tokenUsageTracker.getUsageByCharacter(
          aiCharacterId as string,
          yearMonth as string
        );
        res.json(usage);
      } else {
        const overview = await tokenUsageTracker.getUsageOverview(
          yearMonth as string
        );
        res.json(overview);
      }
    } catch (err) {
      next(err);
    }
  }
);

// AI Characters CRUD (for regular users with subscription)
router.get(
  '/characters',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { universeId, limit, cursor } = req.query;
      const result = await aiCharacterService.listCharacters({
        universeId: universeId as string,
        isActive: true,
        isPublic: true,
        limit: parseInt(limit as string) || 20,
        cursor: cursor as string,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/characters/search',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { q, limit } = req.query;
      const items = await aiCharacterService.searchCharacters(
        q as string,
        parseInt(limit as string) || 20
      );
      res.json({ items });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/characters/:id',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const character = await aiCharacterService.getCharacter(req.params.id as string);
      res.json(character);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/characters',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const character = await aiCharacterService.createCharacter(
        req.user!.userId,
        req.body
      );
      res.status(201).json(character);
    } catch (err) {
      next(err);
    }
  }
);

// ─── Vision / Image Recognition ───────────────────────────

router.post(
  '/vision/analyze',
  authMiddleware,
  aiLimiter,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { imageUrl } = req.body;
      if (!imageUrl) {
        res.status(400).json({ error: 'imageUrl is required' });
        return;
      }
      const analysis = await visionService.analyzeImage(imageUrl);
      res.json(analysis);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/vision/comment',
  authMiddleware,
  aiLimiter,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { aiCharacterId, imageUrl, postCaption } = req.body;
      if (!aiCharacterId || !imageUrl) {
        res.status(400).json({ error: 'aiCharacterId and imageUrl are required' });
        return;
      }
      const character = await aiCharacterService.getCharacter(aiCharacterId);
      const result = await visionService.generateImageComment(
        character,
        imageUrl,
        postCaption
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/vision/suggest-tags',
  authMiddleware,
  aiLimiter,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { imageUrl } = req.body;
      if (!imageUrl) {
        res.status(400).json({ error: 'imageUrl is required' });
        return;
      }
      const tags = await visionService.suggestTags(imageUrl);
      res.json({ tags });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
