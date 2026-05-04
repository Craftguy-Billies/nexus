import { Router, Response, NextFunction } from 'express';
import { universeService } from '../services/universe.service';
import { scenarioService } from '../services/scenario.service';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

// Universes
router.get(
  '/',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit, cursor } = req.query;
      const result = await universeService.listUniverses(
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
  '/search',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { q, limit } = req.query;
      const items = await universeService.searchUniverses(
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
  '/:id',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const universe = await universeService.getUniverse(req.params.id as string);
      res.json(universe);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const universe = await universeService.createUniverse(
        req.user!.userId,
        req.body
      );
      res.status(201).json(universe);
    } catch (err) {
      next(err);
    }
  }
);

// Scenarios
router.get(
  '/:universeId/scenarios',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit, cursor } = req.query;
      const result = await scenarioService.listScenarios({
        universeId: req.params.universeId as string,
        limit: parseInt(limit as string) || 20,
        cursor: cursor as string,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
