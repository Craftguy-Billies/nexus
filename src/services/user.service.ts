import prisma from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';
import { PaginatedResult } from '../types';
import { User } from '@prisma/client';
import { getFirebaseAdmin } from '../config/firebase';
import * as admin from 'firebase-admin';
import { followService } from './follow.service';

export class UserService {
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { subscription: true },
    });
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async getUserByUsername(username: string) {
    // username is no longer unique — return the first match (most followed)
    const user = await prisma.user.findFirst({
      where: { username: username.toLowerCase() },
      include: { subscription: true },
      orderBy: { followerCount: 'desc' },
    });
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async searchUsers(query: string, limit = 20): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query.toLowerCase(), mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true,
        isBanned: false,
      },
      take: limit,
      orderBy: { followerCount: 'desc' },
    });
  }

  async updateProfile(
    userId: string,
    data: {
      displayName?: string;
      bio?: string;
      avatar?: string;
      coverImage?: string;
      isPrivate?: boolean;
    }
  ) {
    if (data.displayName && (data.displayName.length < 1 || data.displayName.length > 50)) {
      throw new ValidationError('Display name must be 1-50 characters');
    }
    if (data.bio && data.bio.length > 160) {
      throw new ValidationError('Bio must be at most 160 characters');
    }

    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async updatePushToken(userId: string, expoPushToken: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        expoPushToken,
        pushTokenUpdatedAt: new Date(),
      },
    });
  }

  async updateNotificationPreferences(
    userId: string,
    prefs: {
      notifyNewFollower?: boolean;
      notifyNewLike?: boolean;
      notifyNewComment?: boolean;
      notifyAiInteraction?: boolean;
      notifySystemAlerts?: boolean;
      notifyMarketing?: boolean;
    }
  ) {
    return prisma.user.update({
      where: { id: userId },
      data: prefs,
    });
  }

  async saveOnboardingInterests(userId: string, interests: string[]) {
    const uniqueInterests = Array.from(
      new Set(interests.map((item) => item.trim()).filter(Boolean))
    );

    if (uniqueInterests.length < 3 || uniqueInterests.length > 5) {
      throw new ValidationError('Select between 3 and 5 interests');
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        onboardingInterests: uniqueInterests,
        onboardingStep: 2,
        onboardingCompletedAt: null,
      },
    });
  }

  async saveOnboardingFriends(userId: string, aiCharacterIds: string[]) {
    const uniqueIds = Array.from(new Set(aiCharacterIds.filter(Boolean)));

    if (uniqueIds.length > 0) {
      const existing = await prisma.aICharacter.findMany({
        where: {
          id: { in: uniqueIds },
          isActive: true,
          isPublic: true,
        },
        select: { id: true },
      });

      for (const character of existing) {
        try {
          await followService.followUser(userId, character.id, 'ai');
        } catch (err) {
          // Log error for debugging but don't fail the entire operation
          console.error('Failed to follow AI character during onboarding:', character.id, err);
        }
      }
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        onboardingStep: 3,
        onboardingCompletedAt: null,
      },
    });
  }

  async completeOnboarding(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingInterests: true },
    });
    if (!user) throw new NotFoundError('User not found');

    if (user.onboardingInterests.length < 3) {
      throw new ValidationError('Please select interests before completing onboarding');
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        onboardingStep: 4,
        onboardingCompletedAt: new Date(),
      },
    });
  }

  async deleteAccount(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firebaseUid: true,
        isActive: true,
      },
    });

    if (!user) throw new NotFoundError('User not found');
    if (!user.isActive) {
      return { message: 'Account already deleted' };
    }

    const compactId = user.id.replace(/-/g, '');
    const deletedFirebaseUid = `deleted_${compactId}`;
    const deletedEmail = `deleted+${compactId}@nexus.local`;
    const deletedUsername = `deleted_${user.id.slice(0, 8)}`;

    await prisma.$transaction(async (tx) => {
      await tx.post.updateMany({
        where: { authorId: userId, authorType: 'human' },
        data: { isArchived: true },
      });

      await tx.admin.deleteMany({ where: { userId } });

      await tx.userSubscription.updateMany({
        where: { userId },
        data: { status: 'cancelled', tier: 'free' },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          isBanned: true,
          banReason: 'account_deleted',
          username: deletedUsername,
          displayName: 'Deleted User',
          email: deletedEmail,
          firebaseUid: deletedFirebaseUid,
          bio: null,
          avatar: null,
          coverImage: null,
          expoPushToken: null,
          notifyNewFollower: false,
          notifyNewLike: false,
          notifyNewComment: false,
          notifyAiInteraction: false,
          notifySystemAlerts: false,
          notifyMarketing: false,
          onboardingStep: 0,
          onboardingInterests: [],
          onboardingCompletedAt: null,
        },
      });
    });

    if (!user.firebaseUid.startsWith('local_')) {
      try {
        const app = getFirebaseAdmin() as admin.app.App | null;
        if (app) {
          await admin.auth(app).deleteUser(user.firebaseUid);
        }
      } catch (err) {
        console.warn('Failed to delete Firebase Auth user during account deletion:', (err as Error).message);
      }
    }

    return { message: 'Account deleted successfully' };
  }

  async getFollowers(
    userId: string,
    limit = 20,
    cursor?: string
  ): Promise<PaginatedResult<unknown>> {
    const where: Record<string, unknown> = {
      followingId: userId,
      status: 'active',
    };
    if (cursor) {
      where.createdAt = { lt: new Date(Buffer.from(cursor, 'base64').toString()) };
    }

    const follows = await prisma.follow.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: { follower: true },
    });

    const hasMore = follows.length > limit;
    const items = hasMore ? follows.slice(0, limit) : follows;
    const nextToken = hasMore
      ? Buffer.from(items[items.length - 1].createdAt.toISOString()).toString('base64')
      : null;

    return { items, nextToken };
  }

  async getFollowing(
    userId: string,
    limit = 20,
    cursor?: string
  ): Promise<PaginatedResult<unknown>> {
    const where: Record<string, unknown> = {
      followerId: userId,
      status: 'active',
    };
    if (cursor) {
      where.createdAt = { lt: new Date(Buffer.from(cursor, 'base64').toString()) };
    }

    const follows = await prisma.follow.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: { following: true },
    });

    const hasMore = follows.length > limit;
    const items = hasMore ? follows.slice(0, limit) : follows;
    const nextToken = hasMore
      ? Buffer.from(items[items.length - 1].createdAt.toISOString()).toString('base64')
      : null;

    return { items, nextToken };
  }
}

export const userService = new UserService();
