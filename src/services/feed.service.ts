import prisma from '../config/database';
import { calculateFreshnessScore } from '../utils/helpers';
import { PaginatedResult } from '../types';
import { Post, Prisma } from '@prisma/client';

export class FeedService {
  async getHomeFeed(
    userId: string,
    limit = 20,
    cursor?: string
  ): Promise<PaginatedResult<Post>> {
    const [followingPosts, activeAIPosts, trendingPosts] = await Promise.all([
      this.getFollowingPosts(userId, Math.floor(limit * 0.5)),
      this.getActiveAIPosts(userId, Math.floor(limit * 0.3)),
      this.getTrendingPostsForUser(userId, Math.floor(limit * 0.2)),
    ]);

    const allPosts = this.mergePosts([
      ...followingPosts,
      ...activeAIPosts,
      ...trendingPosts,
    ]);

    const sortedPosts = this.sortWithFreshnessBias(allPosts);

    const startIndex = cursor
      ? sortedPosts.findIndex(
          (p) =>
            p.createdAt.toISOString() ===
            Buffer.from(cursor, 'base64').toString()
        ) + 1
      : 0;

    const paginatedPosts = sortedPosts.slice(startIndex, startIndex + limit + 1);
    const hasMore = paginatedPosts.length > limit;
    const items = hasMore ? paginatedPosts.slice(0, limit) : paginatedPosts;
    const nextToken =
      hasMore && items.length > 0
        ? Buffer.from(items[items.length - 1].createdAt.toISOString()).toString(
            'base64'
          )
        : null;

    return { items, nextToken };
  }

  async getDiscoverFeed(
    limit = 20,
    cursor?: string
  ): Promise<PaginatedResult<Post>> {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const where: Prisma.PostWhereInput = {
      isArchived: false,
      moderationStatus: 'approved',
      createdAt: { gte: since },
    };

    if (cursor) {
      where.createdAt = {
        gte: since,
        lt: new Date(Buffer.from(cursor, 'base64').toString()),
      };
    }

    const posts = await prisma.post.findMany({
      where,
      take: limit * 3,
      orderBy: { createdAt: 'desc' },
    });

    const sorted = this.sortWithFreshnessBias(posts).slice(0, limit + 1);
    const hasMore = sorted.length > limit;
    const items = hasMore ? sorted.slice(0, limit) : sorted;
    const nextToken =
      hasMore && items.length > 0
        ? Buffer.from(items[items.length - 1].createdAt.toISOString()).toString(
            'base64'
          )
        : null;

    return { items, nextToken };
  }

  async getFollowingFeed(
    userId: string,
    limit = 20,
    cursor?: string
  ): Promise<PaginatedResult<Post>> {
    const following = await prisma.follow.findMany({
      where: { followerId: userId, status: 'active' },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    if (followingIds.length === 0) return { items: [], nextToken: null };

    const where: Prisma.PostWhereInput = {
      authorId: { in: followingIds },
      isArchived: false,
      moderationStatus: 'approved',
    };

    if (cursor) {
      where.createdAt = {
        lt: new Date(Buffer.from(cursor, 'base64').toString()),
      };
    }

    const posts = await prisma.post.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextToken =
      hasMore && items.length > 0
        ? Buffer.from(items[items.length - 1].createdAt.toISOString()).toString(
            'base64'
          )
        : null;

    return { items, nextToken };
  }

  private async getFollowingPosts(
    userId: string,
    limit: number
  ): Promise<Post[]> {
    const following = await prisma.follow.findMany({
      where: { followerId: userId, status: 'active' },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    if (followingIds.length === 0) return [];

    return prisma.post.findMany({
      where: {
        authorId: { in: followingIds },
        isArchived: false,
        moderationStatus: 'approved',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private async getActiveAIPosts(
    _userId: string,
    limit: number
  ): Promise<Post[]> {
    const activeAIs = await prisma.aICharacter.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: { lastInteractionAt: 'desc' },
      take: 20,
      select: { id: true },
    });

    const aiIds = activeAIs.map((ai) => ai.id);
    if (aiIds.length === 0) return [];

    return prisma.post.findMany({
      where: {
        authorId: { in: aiIds },
        authorType: 'ai',
        isArchived: false,
        moderationStatus: 'approved',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  private async getTrendingPostsForUser(
    _userId: string,
    limit: number
  ): Promise<Post[]> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return prisma.post.findMany({
      where: {
        isArchived: false,
        moderationStatus: 'approved',
        createdAt: { gte: since },
      },
      orderBy: [
        { likesCount: 'desc' },
        { commentsCount: 'desc' },
      ],
      take: limit,
    });
  }

  private mergePosts(posts: Post[]): Post[] {
    const seen = new Set<string>();
    return posts.filter((post) => {
      if (seen.has(post.id)) return false;
      seen.add(post.id);
      return true;
    });
  }

  private sortWithFreshnessBias(posts: Post[]): Post[] {
    return posts.sort((a, b) => {
      const scoreA = calculateFreshnessScore(
        a.createdAt,
        a.likesCount,
        a.commentsCount,
        a.sharesCount
      );
      const scoreB = calculateFreshnessScore(
        b.createdAt,
        b.likesCount,
        b.commentsCount,
        b.sharesCount
      );
      return scoreB - scoreA;
    });
  }
}

export const feedService = new FeedService();
