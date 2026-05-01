import { Router, Response, NextFunction } from 'express';
import { mediaService } from '../services/media.service';
import { authMiddleware } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

router.post(
  '/presigned-url',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { fileType, fileName } = req.body;
      const result = await mediaService.getPresignedUploadUrl(
        req.user!.userId,
        fileType,
        fileName
      );
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/confirm-upload',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { mediaId, key } = req.body;
      const result = await mediaService.confirmUpload(mediaId, key);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

router.delete(
  '/:key',
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await mediaService.deleteMedia(req.params.key as string);
      res.json({ message: 'Media deleted' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
