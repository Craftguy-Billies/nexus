import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../config/database';
import { AuthenticatedRequest, AuthPayload } from '../types';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { verifyFirebaseToken } from '../config/firebase';

async function resolveToken(token: string): Promise<AuthPayload | null> {
  // Try local JWT first
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, firebaseUid: true, isActive: true, isBanned: true },
    });
    if (user && user.isActive && !user.isBanned) {
      return { userId: user.id, firebaseUid: user.firebaseUid };
    }
    return null;
  } catch {
    // Not a local JWT — try Firebase
  }

  // Try Firebase ID token
  const decoded = await verifyFirebaseToken(token);
  if (decoded) {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { id: true, isActive: true, isBanned: true },
    });
    if (user && user.isActive && !user.isBanned) {
      return { userId: user.id, firebaseUid: decoded.uid };
    }
  }

  return null;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing or invalid authorization header'));
    return;
  }

  const token = authHeader.split(' ')[1];

  resolveToken(token)
    .then((payload) => {
      if (!payload) {
        next(new UnauthorizedError('Invalid or expired token'));
        return;
      }
      req.user = payload;
      next();
    })
    .catch(() => {
      next(new UnauthorizedError('Invalid or expired token'));
    });
}

export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    resolveToken(token)
      .then((payload) => {
        if (payload) req.user = payload;
        next();
      })
      .catch(() => {
        next();
      });
  } else {
    next();
  }
}

export function adminMiddleware(requiredPermissions?: string[]) {
  return async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }

    const admin = await prisma.admin.findUnique({
      where: { userId: req.user.userId },
    });

    if (!admin) {
      next(new ForbiddenError('Admin access required'));
      return;
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.every((p) =>
        admin.permissions.includes(p)
      );
      if (!hasPermission && admin.role !== 'super_admin') {
        next(new ForbiddenError('Insufficient permissions'));
        return;
      }
    }

    next();
  };
}
