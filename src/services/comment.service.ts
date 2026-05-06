import prisma from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';

const MAX_COMMENT_LENGTH = 1000;

export class CommentService {
  async createComment(
    userId: string,
    input: { postId: string; content: string; parentId?: string }
  ) {
    if (!input.content || input.content.trim().length === 0) {
      throw new ValidationError('Comment content is required');
    }
    if (input.content.length > MAX_COMMENT_LENGTH) {
      throw new ValidationError(`Comment must be less than ${MAX_COMMENT_LENGTH} characters`);
    }

    const post = await prisma.post.findUnique({ where: { id: input.postId } });
    if (!post || post.isArchived) throw new NotFoundError('Post not found');

    if (input.parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: input.parentId } });
      if (!parent || parent.postId !== input.postId) {
        throw new ValidationError('Invalid parent comment');
      }
    }

    const comment = await prisma.comment.create({
      data: {
        postId: input.postId,
        authorId: userId,
        authorType: 'human',
        isAI: false,
        content: input.content,
        parentId: input.parentId,
      },
      include: {
        humanAuthor: { select: { id: true, username: true, displayName: true, avatar: true } },
        aiAuthor: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    });

    await prisma.post.update({
      where: { id: input.postId },
      data: { commentsCount: { increment: 1 } },
    });

    return comment;
  }

  async createAIComment(
    aiCharacterId: string,
    postId: string,
    content: string,
    parentId?: string
  ) {
    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: aiCharacterId,
        authorType: 'ai',
        isAI: true,
        content,
        parentId,
      },
      include: {
        humanAuthor: { select: { id: true, username: true, displayName: true, avatar: true } },
        aiAuthor: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    });

    await prisma.post.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } },
    });

    await prisma.aICharacter.update({
      where: { id: aiCharacterId },
      data: { totalComments: { increment: 1 } },
    });

    return comment;
  }

  async getComments(postId: string, limit = 20, cursor?: string) {
    const where: Record<string, unknown> = {
      postId,
      parentId: null,
    };

    if (cursor) {
      where.createdAt = { lt: new Date(Buffer.from(cursor, 'base64').toString()) };
    }

    const comments = await prisma.comment.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        humanAuthor: { select: { id: true, username: true, displayName: true, avatar: true } },
        aiAuthor: { select: { id: true, username: true, displayName: true, avatar: true } },
        replies: {
          take: 3,
          orderBy: { createdAt: 'asc' },
          include: {
            humanAuthor: { select: { id: true, username: true, displayName: true, avatar: true } },
            aiAuthor: { select: { id: true, username: true, displayName: true, avatar: true } },
          },
        },
      },
    });

    const hasMore = comments.length > limit;
    const items = hasMore ? comments.slice(0, limit) : comments;
    const nextToken = hasMore
      ? Buffer.from(items[items.length - 1].createdAt.toISOString()).toString('base64')
      : null;

    return { items, nextToken };
  }

  async updateComment(commentId: string, userId: string, content: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundError('Comment not found');
    if (comment.authorId !== userId || comment.authorType !== 'human') {
      throw new ValidationError('Not authorized');
    }

    if (content.length > MAX_COMMENT_LENGTH) {
      throw new ValidationError(`Comment must be less than ${MAX_COMMENT_LENGTH} characters`);
    }

    return prisma.comment.update({
      where: { id: commentId },
      data: { content, isEdited: true },
    });
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundError('Comment not found');
    if (comment.authorId !== userId) throw new ValidationError('Not authorized');

    // Delete replies first
    await prisma.comment.deleteMany({ where: { parentId: commentId } });
    await prisma.comment.delete({ where: { id: commentId } });

    await prisma.post.update({
      where: { id: comment.postId },
      data: { commentsCount: { decrement: 1 } },
    });
  }
}

export const commentService = new CommentService();
