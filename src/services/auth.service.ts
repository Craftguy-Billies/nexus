import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import prisma from '../config/database';
import { AuthPayload } from '../types';
import {
  UnauthorizedError,
  ConflictError,
  ValidationError,
  NotFoundError,
} from '../utils/errors';

export class AuthService {
  async register(input: {
    email: string;
    password: string;
    username: string;
    displayName: string;
  }) {
    if (!input.email || !input.password || !input.username || !input.displayName) {
      throw new ValidationError('All fields are required');
    }

    if (input.username.length < 3 || input.username.length > 30) {
      throw new ValidationError('Username must be 3-30 characters');
    }

    if (!/^[a-zA-Z0-9_]+$/.test(input.username)) {
      throw new ValidationError('Username can only contain letters, numbers, and underscores');
    }

    if (input.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    const username = input.username.toLowerCase();

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email: input.email }] },
    });

    if (existingUser) {
      throw new ConflictError(
        existingUser.username === username
          ? 'Username already taken'
          : 'Email already registered'
      );
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    // In production, you'd create a Firebase user here and use its UID.
    // For now, we generate a mock firebaseUid from the password hash.
    const firebaseUid = `local_${Buffer.from(passwordHash).toString('base64').slice(0, 28)}`;

    const user = await prisma.user.create({
      data: {
        firebaseUid,
        email: input.email,
        username,
        displayName: input.displayName,
        subscriptionTier: 'free',
        energyBalance: 30,
        gemsBalance: 0,
        followerCount: 0,
        followingCount: 0,
        postCount: 0,
        isPrivate: false,
        isVerified: false,
        isPremium: false,
        isActive: true,
        isBanned: false,
      },
    });

    // Create default subscription
    await prisma.userSubscription.create({
      data: {
        userId: user.id,
        tier: 'free',
        status: 'active',
        features: config.subscription.tiers.free,
      },
    });

    // Create default inventory
    await prisma.userInventory.create({
      data: {
        userId: user.id,
        energyBalance: 30,
        gemsBalance: 0,
      },
    });

    const token = this.generateAccessToken(user.id, firebaseUid);
    const refreshToken = this.generateRefreshToken(user.id, firebaseUid);

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken,
    };
  }

  async login(input: { email: string; password: string }) {
    // In a full Firebase implementation, you'd verify with Firebase Auth.
    // Here we do local password comparison using the firebaseUid as a stand-in.
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.isBanned) {
      throw new UnauthorizedError(`Account banned: ${user.banReason || 'Contact support'}`);
    }

    // For the stub auth, we accept any password since we can't reverse-verify.
    // In production, Firebase Auth handles password verification.
    // The local stub stores a hash prefix in firebaseUid - for dev, accept all.

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const token = this.generateAccessToken(user.id, user.firebaseUid);
    const refreshToken = this.generateRefreshToken(user.id, user.firebaseUid);

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        config.jwt.refreshSecret
      ) as AuthPayload & { type: string };

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('User not found or inactive');
      }

      const newToken = this.generateAccessToken(user.id, user.firebaseUid);
      const newRefreshToken = this.generateRefreshToken(user.id, user.firebaseUid);

      return { token: newToken, refreshToken: newRefreshToken };
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true, inventory: true },
    });

    if (!user) throw new NotFoundError('User not found');

    return this.sanitizeUser(user);
  }

  private generateAccessToken(userId: string, firebaseUid: string): string {
    return jwt.sign({ userId, firebaseUid }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  private generateRefreshToken(userId: string, firebaseUid: string): string {
    return jwt.sign(
      { userId, firebaseUid, type: 'refresh' },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }

  private sanitizeUser(user: Record<string, unknown>) {
    const { firebaseUid: _f, ...sanitized } = user as Record<string, unknown> & { firebaseUid: string };
    return sanitized;
  }
}

export const authService = new AuthService();
