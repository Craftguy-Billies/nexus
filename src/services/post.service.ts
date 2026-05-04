import prisma from '../config/database';
import { ValidationError, NotFoundError } from '../utils/errors';
import { extractHashtags, extractMentions, calculateFreshnessScore } from '../utils/helpers';
import { PaginatedResult } from '../types';
import { Post, Prisma } from '@prisma/client';
import { moderationService } from './moderation.service';
import { aiReactionQueue } from '../jobs/queues';

const MAX_CONTENT_LENGTH = 2000;
const MAX_MEDIA_FILES = 4;

export class PostService {
  async createPost(
    userId: string,
    input: {
      content: string;
      mediaUrls?: string[];
      mediaTypes?: string[];
    }
  ): Promise<Post> {
    this.validatePostInput(input);

    const tags = extractHashtags(input.content);
    const mentions = extractMentions(input.content);

    const moderationResult = await moderationService.checkContent(input.content);

    const post = await prisma.post.create({
      data: {
        content: input.content,
        mediaUrls: input.mediaUrls || [],
        mediaTypes: input.mediaTypes || [],
        authorId: userId,
        authorType: 'human',
        isAI: false,
        tags,
        mentions,
        moderationStatus: moderationResult.flagged ? 'flagged' : 'approved',
        moderationDetails: moderationResult.flagged
          ? { autoCheckPassed: false, flaggedCategories: moderationResult.categories }
          : { autoCheckPassed: true },
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        viewsCount: 0,
        publishedAt: new Date(),
      },
    });

    // Update user post count
    await prisma.user.update({
      where: { id: userId },
      data: { postCount: { increment: 1 } },
    });

    // Queue AI reactions (delayed by 1 minute)
    if (!moderationResult.flagged) {
      try {
        await aiReactionQueue.add(
          'generate-ai-reactions',
          { postId: post.id, userId, content: input.content },
          { delay: 60000 }
        );
      } catch {
        // Queue might not be available in dev
        console.warn('Failed to queue AI reactions - Redis may not be available');
      }
    }

    return post;
  }

  async createAIPost(
    aiCharacterId: string,
    content: string,
    meta: {
      model: string;
      promptTokens: number;
      completionTokens: number;
      generationTrigger: 'scheduled' | 'reaction' | 'mention';
    }
  ): Promise<Post> {
    const tags = extractHashtags(content);

    const post = await prisma.post.create({
      data: {
        content,
        mediaUrls: [],
        mediaTypes: [],
        authorId: aiCharacterId,
        authorType: 'ai',
        isAI: true,
        tags,
        mentions: [],
        moderationStatus: 'approved',
        aiGenerationMeta: meta,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        viewsCount: 0,
        publishedAt: new Date(),
      },
    });

    await prisma.aICharacter.update({
      where: { id: aiCharacterId },
      data: { totalPosts: { increment: 1 } },
    });

    return post;
  }

  async getPost(postId: string, currentUserId?: string) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        humanAuthor: { select: { id: true, username: true, displayName: true, avatar: true } },
        aiAuthor: { select: { id: true, username: true, displayName: true, avatar: true } },
        comments: {
          where: { parentId: null },
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!post || post.isArchived) throw new NotFoundError('Post not found');

    let isLikedByCurrentUser = false;
    if (currentUserId) {
      const like = await prisma.like.findUnique({
        where: { postId_authorId: { postId, authorId: currentUserId } },
      });
      isLikedByCurrentUser = !!like;
    }

    // Increment views
    await prisma.post.update({
      where: { id: postId },
      data: { viewsCount: { increment: 1 } },
    });

    return { ...post, isLikedByCurrentUser };
  }

  async getUserPosts(
    authorId: string,
    limit = 20,
    cursor?: string
  ): Promise<PaginatedResult<Post>> {
    const where: Prisma.PostWhereInput = {
      authorId,
      isArchived: false,
    };

    if (cursor) {
      where.createdAt = { lt: new Date(Buffer.from(cursor, 'base64').toString()) };
    }

    const posts = await prisma.post.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = posts.length > limit;
    const items = hasMore ? posts.slice(0, limit) : posts;
    const nextToken = hasMore
      ? Buffer.from(items[items.length - 1].createdAt.toISOString()).toString('base64')
      : null;

    return { items, nextToken };
  }

  async updatePost(
    postId: string,
    userId: string,
    data: { content?: string }
  ): Promise<Post> {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundError('Post not found');
    if (post.authorId !== userId) throw new ValidationError('Not authorized to edit this post');
    if (post.authorType !== 'human') throw new ValidationError('Cannot edit AI posts');

    if (data.content) {
      if (data.content.length > MAX_CONTENT_LENGTH) {
        throw new ValidationError(`Content must be less than ${MAX_CONTENT_LENGTH} characters`);
      }
    }

    return prisma.post.update({
      where: { id: postId },
      data: {
        ...data,
        tags: data.content ? extractHashtags(data.content) : undefined,
        mentions: data.content ? extractMentions(data.content) : undefined,
        isEdited: true,
      },
    });
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundError('Post not found');
    if (post.authorId !== userId) throw new ValidationError('Not authorized');

    await prisma.post.update({
      where: { id: postId },
      data: { isArchived: true },
    });
  }

  async getTrendingPosts(limit = 20, cursor?: string): Promise<PaginatedResult<Post>> {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const where: Prisma.PostWhereInput = {
      isArchived: false,
      moderationStatus: 'approved',
      createdAt: { gte: since },
    };

    if (cursor) {
      where.createdAt = { ...where.createdAt as Record<string, unknown>, lt: new Date(Buffer.from(cursor, 'base64').toString()) };
    }

    const posts = await prisma.post.findMany({
      where,
      take: limit * 3, // Get more posts to sort by score
      orderBy: { createdAt: 'desc' },
    });

    // Sort by freshness score
    const scored = posts
      .map((p) => ({
        post: p,
        score: calculateFreshnessScore(p.createdAt, p.likesCount, p.commentsCount, p.sharesCount),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit + 1);

    const hasMore = scored.length > limit;
    const items = (hasMore ? scored.slice(0, limit) : scored).map((s) => s.post);
    const nextToken = hasMore
      ? Buffer.from(items[items.length - 1].createdAt.toISOString()).toString('base64')
      : null;

    return { items, nextToken };
  }

  private validatePostInput(input: { content: string; mediaUrls?: string[] }): void {
    if (!input.content || input.content.trim().length === 0) {
      throw new ValidationError('Post content is required');
    }
    if (input.content.length > MAX_CONTENT_LENGTH) {
      throw new ValidationError(`Post content must be less than ${MAX_CONTENT_LENGTH} characters`);
    }
    if (input.mediaUrls && input.mediaUrls.length > MAX_MEDIA_FILES) {
      throw new ValidationError(`Maximum ${MAX_MEDIA_FILES} media files allowed`);
    }
  }
}

export const postService = new PostService();
