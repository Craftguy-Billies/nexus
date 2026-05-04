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
import { getFirebaseAdmin } from '../config/firebase';
import * as admin from 'firebase-admin';

export class AuthService {
  /**
   * Register with Firebase ID token (from mobile app).
   * The client signs up via Firebase Auth SDK, then sends the idToken here.
   */
  async registerWithFirebase(input: {
    firebaseIdToken: string;
    username: string;
    displayName: string;
  }) {
    if (!input.firebaseIdToken || !input.username || !input.displayName) {
      throw new ValidationError('firebaseIdToken, username, and displayName are required');
    }

    const username = input.username.toLowerCase();
    this.validateUsername(username);

    const app = getFirebaseAdmin();
    if (!app) {
      throw new ValidationError('Firebase is not configured');
    }

    const decoded = await admin.auth(app).verifyIdToken(input.firebaseIdToken);
    const firebaseUid = decoded.uid;
    const email = decoded.email || '';

    const existingByUid = await prisma.user.findUnique({
      where: { firebaseUid },
    });
    if (existingByUid) {
      throw new ConflictError('Firebase account already registered');
    }

    const existingByUsername = await prisma.user.findUnique({
      where: { username },
    });
    if (existingByUsername) {
      throw new ConflictError('Username already taken');
    }

    if (email) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingByEmail) {
        throw new ConflictError('Email already registered');
      }
    }

    const user = await this.createUserRecord(firebaseUid, email, username, input.displayName);
    const token = this.generateAccessToken(user.id, firebaseUid);
    const refreshToken = this.generateRefreshToken(user.id, firebaseUid);

    return { user: this.sanitizeUser(user), token, refreshToken };
  }

  /**
   * Local register (email+password) — for dev/testing without Firebase client SDK.
   */
  async register(input: {
    email: string;
    password: string;
    username: string;
    displayName: string;
  }) {
    if (!input.email || !input.password || !input.username || !input.displayName) {
      throw new ValidationError('All fields are required');
    }

    const username = input.username.toLowerCase();
    this.validateUsername(username);

    if (input.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

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
    const firebaseUid = `local_${Buffer.from(passwordHash).toString('base64').slice(0, 28)}`;

    const user = await this.createUserRecord(firebaseUid, input.email, username, input.displayName);
    const token = this.generateAccessToken(user.id, firebaseUid);
    const refreshToken = this.generateRefreshToken(user.id, firebaseUid);

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken,
    };
  }

  /**
   * Login with Firebase ID token (from mobile app).
   */
  async loginWithFirebase(firebaseIdToken: string) {
    const app = getFirebaseAdmin();
    if (!app) {
      throw new ValidationError('Firebase is not configured');
    }

    const decoded = await admin.auth(app).verifyIdToken(firebaseIdToken);
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
    });

    if (!user) {
      throw new NotFoundError('No account found for this Firebase user. Please register first.');
    }

    if (user.isBanned) {
      throw new UnauthorizedError(`Account banned: ${user.banReason || 'Contact support'}`);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    const token = this.generateAccessToken(user.id, user.firebaseUid);
    const refreshToken = this.generateRefreshToken(user.id, user.firebaseUid);

    return { user: this.sanitizeUser(user), token, refreshToken };
  }

  /**
   * Local login (email+password) — for dev/testing.
   */
  async login(input: { email: string; password: string }) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.isBanned) {
      throw new UnauthorizedError(`Account banned: ${user.banReason || 'Contact support'}`);
    }

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

  private validateUsername(username: string): void {
    if (username.length < 3 || username.length > 30) {
      throw new ValidationError('Username must be 3-30 characters');
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      throw new ValidationError('Username can only contain letters, numbers, and underscores');
    }
  }

  private async createUserRecord(
    firebaseUid: string,
    email: string,
    username: string,
    displayName: string
  ) {
    const user = await prisma.user.create({
      data: {
        firebaseUid,
        email,
        username,
        displayName,
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

    await prisma.userSubscription.create({
      data: {
        userId: user.id,
        tier: 'free',
        status: 'active',
        features: config.subscription.tiers.free,
      },
    });

    await prisma.userInventory.create({
      data: {
        userId: user.id,
        energyBalance: 30,
        gemsBalance: 0,
      },
    });

    return user;
  }

  private sanitizeUser(user: Record<string, unknown>) {
    const { firebaseUid: _f, ...sanitized } = user as Record<string, unknown> & { firebaseUid: string };
    return sanitized;
  }
}

export const authService = new AuthService();
