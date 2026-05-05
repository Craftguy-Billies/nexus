import prisma from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';
import { PaginatedResult } from '../types';
import { User } from '@prisma/client';

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
