import prisma from '../config/database';
import { NotFoundError, ConflictError } from '../utils/errors';

export class LikeService {
  async likePost(userId: string, postId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.isArchived) throw new NotFoundError('Post not found');

    const existing = await prisma.like.findUnique({
      where: { postId_authorId: { postId, authorId: userId } },
    });
    if (existing) throw new ConflictError('Already liked');

    const like = await prisma.like.create({
      data: {
        postId,
        authorId: userId,
        authorType: 'human',
        isAI: false,
      },
    });

    await prisma.post.update({
      where: { id: postId },
      data: { likesCount: { increment: 1 } },
    });

    return like;
  }

  async unlikePost(userId: string, postId: string) {
    const like = await prisma.like.findUnique({
      where: { postId_authorId: { postId, authorId: userId } },
    });
    if (!like) throw new NotFoundError('Like not found');

    await prisma.like.delete({ where: { id: like.id } });

    await prisma.post.update({
      where: { id: postId },
      data: { likesCount: { decrement: 1 } },
    });
  }

  async createAILike(aiCharacterId: string, postId: string) {
    const existing = await prisma.like.findUnique({
      where: { postId_authorId: { postId, authorId: aiCharacterId } },
    });
    if (existing) return existing;

    const like = await prisma.like.create({
      data: {
        postId,
        authorId: aiCharacterId,
        authorType: 'ai',
        isAI: true,
      },
    });

    await prisma.post.update({
      where: { id: postId },
      data: { likesCount: { increment: 1 } },
    });

    await prisma.aICharacter.update({
      where: { id: aiCharacterId },
      data: { totalLikes: { increment: 1 } },
    });

    return like;
  }

  async getPostLikes(postId: string, limit = 20, cursor?: string) {
    const where: Record<string, unknown> = { postId };
    if (cursor) {
      where.createdAt = { lt: new Date(Buffer.from(cursor, 'base64').toString()) };
    }

    const likes = await prisma.like.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = likes.length > limit;
    const items = hasMore ? likes.slice(0, limit) : likes;
    const nextToken = hasMore
      ? Buffer.from(items[items.length - 1].createdAt.toISOString()).toString('base64')
      : null;

    return { items, nextToken };
  }

  async isLiked(userId: string, postId: string): Promise<boolean> {
    const like = await prisma.like.findUnique({
      where: { postId_authorId: { postId, authorId: userId } },
    });
    return !!like;
  }
}

export const likeService = new LikeService();
