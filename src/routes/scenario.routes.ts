import { Router, Response, NextFunction } from 'express';
import { scenarioService } from '../services/scenario.service';
import { authMiddleware, optionalAuth } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

router.get(
  '/',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { limit, cursor } = req.query;
      const result = await scenarioService.listScenarios({
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
  '/:id',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const scenario = await scenarioService.getScenario(req.params.id as string);
      res.json(scenario);
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
      const scenario = await scenarioService.createScenario(
        req.user!.userId,
        req.body
      );
      res.status(201).json(scenario);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/join',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const scenario = await scenarioService.joinScenario(
        req.user!.userId,
        req.params.id as string
      );
      res.json(scenario);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/:id/leave',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const scenario = await scenarioService.leaveScenario(
        req.user!.userId,
        req.params.id as string
      );
      res.json(scenario);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
