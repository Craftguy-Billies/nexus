import prisma from '../config/database';
import { NotFoundError, ConflictError, ValidationError } from '../utils/errors';
import { AuthorType } from '@prisma/client';

export class FollowService {
  async followUser(
    followerId: string,
    followingId: string,
    followingType: AuthorType = 'human'
  ) {
    console.log('followUser called:', { followerId, followingId, followingType });
    
    if (followerId === followingId) {
      throw new ValidationError('Cannot follow yourself');
    }

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (existing) {
      if (existing.status === 'blocked') {
        throw new ValidationError('You are blocked by this user');
      }
      // If already following but count is wrong, update the count
      if (existing.status === 'active') {
        console.log('Already following, checking and fixing count');
        await this.syncFollowCount(followingId, followingType);
      }
      throw new ConflictError('Already following');
    }

    // Check if target user exists and is private
    let status: 'active' | 'pending' = 'active';
    if (followingType === 'human') {
      const targetUser = await prisma.user.findUnique({ where: { id: followingId } });
      if (!targetUser) throw new NotFoundError('User not found');
      if (targetUser.isPrivate) status = 'pending';
    }

    const follow = await prisma.follow.create({
      data: {
        followerId,
        followerType: 'human',
        followingId,
        followingType,
        status,
      },
    });

    console.log('Follow created:', { followerId, followingId, followingType, status });

    if (status === 'active') {
      await this.updateFollowCounts(followerId, followingId, followingType, 1);
    }

    return follow;
  }

  private async syncFollowCount(followingId: string, followingType: AuthorType) {
    const actualCount = await prisma.follow.count({
      where: { followingId, status: 'active' }
    });
    console.log('syncFollowCount:', { followingId, followingType, actualCount });
    
    if (followingType === 'human') {
      await prisma.user.update({
        where: { id: followingId },
        data: { followerCount: actualCount }
      });
    } else {
      await prisma.aICharacter.update({
        where: { id: followingId },
        data: { followerCount: actualCount }
      });
    }
  }

  async unfollowUser(followerId: string, followingId: string) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (!follow) throw new NotFoundError('Follow relationship not found');

    await prisma.follow.delete({ where: { id: follow.id } });

    if (follow.status === 'active') {
      await this.updateFollowCounts(followerId, followingId, follow.followingType, -1);
    }
  }

  async acceptFollowRequest(userId: string, followerId: string) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: userId } },
    });
    if (!follow || follow.status !== 'pending') {
      throw new NotFoundError('Pending follow request not found');
    }

    await prisma.follow.update({
      where: { id: follow.id },
      data: { status: 'active' },
    });

    await this.updateFollowCounts(followerId, userId, 'human', 1);
  }

  async rejectFollowRequest(userId: string, followerId: string) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId: userId } },
    });
    if (!follow || follow.status !== 'pending') {
      throw new NotFoundError('Pending follow request not found');
    }

    await prisma.follow.delete({ where: { id: follow.id } });
  }

  async blockUser(userId: string, targetId: string) {
    // Delete existing follow if any
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: userId, followingId: targetId },
          { followerId: targetId, followingId: userId },
        ],
      },
    });

    await prisma.follow.create({
      data: {
        followerId: targetId,
        followerType: 'human',
        followingId: userId,
        followingType: 'human',
        status: 'blocked',
      },
    });
  }

  async createAIFollow(aiCharacterId: string, userId: string) {
    const existing = await prisma.follow.findFirst({
      where: { followerId: aiCharacterId, followingId: userId },
    });
    if (existing) return existing;

    // AI follows are always instant (no pending)
    const follow = await prisma.follow.create({
      data: {
        followerId: aiCharacterId,
        followerType: 'ai',
        followingId: userId,
        followingType: 'human',
        status: 'active',
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { followerCount: { increment: 1 } },
    });

    await prisma.aICharacter.update({
      where: { id: aiCharacterId },
      data: { followingCount: { increment: 1 } },
    });

    return follow;
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return !!follow && follow.status === 'active';
  }

  async getPendingRequests(userId: string) {
    return prisma.follow.findMany({
      where: { followingId: userId, status: 'pending' },
      include: { follower: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserFollows(userId: string) {
    return prisma.follow.findMany({
      where: { followerId: userId, status: 'active' },
      select: { followingId: true, followingType: true },
    });
  }

  private async updateFollowCounts(
    followerId: string,
    followingId: string,
    followingType: AuthorType,
    delta: number
  ) {
    console.log('updateFollowCounts called:', { followerId, followingId, followingType, delta });
    
    // Update follower's followingCount
    await prisma.user.update({
      where: { id: followerId },
      data: { followingCount: { increment: delta } },
    });

    // Update following's followerCount
    if (followingType === 'human') {
      await prisma.user.update({
        where: { id: followingId },
        data: { followerCount: { increment: delta } },
      });
    } else {
      const result = await prisma.aICharacter.update({
        where: { id: followingId },
        data: { followerCount: { increment: delta } },
      });
      console.log('AI Character followerCount updated:', result.id, result.followerCount);
    }
  }
}

export const followService = new FollowService();
