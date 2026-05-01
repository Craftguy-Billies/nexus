import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../config/database';
import { AuthenticatedRequest, AuthPayload } from '../types';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

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

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
      req.user = decoded;
    } catch {
      // Token invalid, continue without auth
    }
  }
  next();
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
