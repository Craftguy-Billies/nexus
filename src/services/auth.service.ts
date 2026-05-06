import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import prisma from '../config/database';
import { AuthPayload } from '../types';
import {
  UnauthorizedError,
  ConflictError,
  ValidationError,
} from '../utils/errors';
import { getFirebaseAdmin } from '../config/firebase';
import * as admin from 'firebase-admin';

export class AuthService {
  /**
   * Register / complete onboarding with Firebase ID token.
   * The client signs in via Firebase Auth SDK (email or Google),
   * then sends the idToken + chosen handle + display name here.
   * Email is used as the primary key; duplicate usernames are allowed.
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

    // If a DB record already exists for this Firebase UID, just return it
    const existingByUid = await prisma.user.findUnique({
      where: { firebaseUid },
    });
    if (existingByUid) {
      const updated = await prisma.user.update({
        where: { id: existingByUid.id },
        data: {
          username,
          displayName: input.displayName,
          onboardingStep: 1,
          onboardingCompletedAt: null,
        },
      });
      const token = this.generateAccessToken(updated.id, firebaseUid);
      const refreshToken = this.generateRefreshToken(updated.id, firebaseUid);
      return {
        user: this.sanitizeUser(updated),
        token,
        refreshToken,
        isNewUser: true,
      };
    }

    // Email uniqueness is still enforced (one account per email)
    if (email) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email },
      });
      if (existingByEmail) {
        throw new ConflictError('Email already registered');
      }
    }

    // Usernames are NOT unique — no duplicate check needed
    const user = await this.createUserRecord(
      firebaseUid,
      email,
      username,
      input.displayName,
      1
    );
    const token = this.generateAccessToken(user.id, firebaseUid);
    const refreshToken = this.generateRefreshToken(user.id, firebaseUid);

    return { user: this.sanitizeUser(user), token, refreshToken, isNewUser: true };
  }

  /**
   * Login with Firebase ID token (Google or email/password via Firebase).
   * Returns isNewUser=true when no DB record exists yet so the client
   * knows to redirect to the handle-creation screen.
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

    // No DB record yet → create a temporary user record for onboarding
    if (!user) {
      const email = decoded.email || '';
      const username = decoded.email?.split('@')[0] || 'user';
      const displayName = decoded.displayName || decoded.email?.split('@')[0] || 'User';
      
      const newUser = await this.createUserRecord(
        decoded.uid,
        email,
        username,
        displayName,
        0
      );
      
      const token = this.generateAccessToken(newUser.id, decoded.uid);
      const refreshToken = this.generateRefreshToken(newUser.id, decoded.uid);
      
      return {
        user: this.sanitizeUser(newUser),
        token,
        refreshToken,
        isNewUser: true,
      };
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
      isNewUser: user.onboardingStep < 4,
    };
  }

  /**
   * Local register (email+password) — kept for dev/testing without Firebase client SDK.
   * Duplicate usernames are allowed; email is the unique identifier.
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

    if (input.password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    // Only check email uniqueness — username duplicates are allowed
    const existingByEmail = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existingByEmail) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const firebaseUid = `local_${Buffer.from(passwordHash).toString('base64').slice(0, 28)}`;

    const user = await this.createUserRecord(
      firebaseUid,
      input.email,
      username,
      input.displayName,
      4
    );
    const token = this.generateAccessToken(user.id, firebaseUid);
    const refreshToken = this.generateRefreshToken(user.id, firebaseUid);

    return {
      user: this.sanitizeUser(user),
      token,
      refreshToken,
      isNewUser: true,
    };
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
      isNewUser: false,
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
    displayName: string,
    onboardingStep = 1
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
        onboardingStep,
        onboardingInterests: [],
        onboardingCompletedAt: onboardingStep >= 4 ? new Date() : null,
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
