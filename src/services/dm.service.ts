import prisma from '../config/database';
import { NotFoundError, ValidationError } from '../utils/errors';
import { energyService } from './energy.service';
import { aiService } from './ai.service';

export class DMService {
  async getConversations(userId: string, limit = 20, cursor?: string) {
    const where: Record<string, unknown> = { userId };
    if (cursor) {
      where.lastMessageAt = {
        lt: new Date(Buffer.from(cursor, 'base64').toString()),
      };
    }

    const rawConversations = await prisma.conversation.findMany({
      where,
      take: limit + 1,
      orderBy: { lastMessageAt: 'desc' },
    });

    const aiCharIds = rawConversations.map((c) => c.aiCharacterId);
    const aiChars = aiCharIds.length
      ? await prisma.aICharacter.findMany({
          where: { id: { in: aiCharIds } },
          select: { id: true, username: true, displayName: true, avatar: true },
        })
      : [];
    const aiMap = new Map(aiChars.map((a) => [a.id, a]));

    const lastMessages = rawConversations.length
      ? await prisma.directMessage.findMany({
          where: { conversationId: { in: rawConversations.map((c) => c.id) } },
          orderBy: { createdAt: 'desc' },
          distinct: ['conversationId'],
          select: { conversationId: true, content: true },
        })
      : [];
    const msgMap = new Map(lastMessages.map((m) => [m.conversationId, m.content]));

    const conversations = rawConversations.map((c) => ({
      ...c,
      aiCharacter: aiMap.get(c.aiCharacterId) || null,
      lastMessage: msgMap.get(c.id) ? { content: msgMap.get(c.id) } : null,
    }));

    const hasMore = conversations.length > limit;
    const items = hasMore ? conversations.slice(0, limit) : conversations;
    const nextToken =
      hasMore && items.length > 0 && items[items.length - 1].lastMessageAt
        ? Buffer.from(
            items[items.length - 1].lastMessageAt!.toISOString()
          ).toString('base64')
        : null;

    return { items, nextToken };
  }

  async getMessages(
    userId: string,
    aiCharacterId: string,
    limit = 50,
    cursor?: string
  ) {
    const conversation = await this.getOrCreateConversation(
      userId,
      aiCharacterId
    );

    const where: Record<string, unknown> = {
      conversationId: conversation.id,
    };
    if (cursor) {
      where.createdAt = {
        lt: new Date(Buffer.from(cursor, 'base64').toString()),
      };
    }

    const messages = await prisma.directMessage.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = messages.length > limit;
    const items = (hasMore ? messages.slice(0, limit) : messages).reverse();
    const nextToken =
      hasMore && items.length > 0
        ? Buffer.from(items[0].createdAt.toISOString()).toString('base64')
        : null;

    return { items, nextToken, conversationId: conversation.id };
  }

  async sendMessage(
    userId: string,
    aiCharacterId: string,
    content: string
  ) {
    if (!content || content.trim().length === 0) {
      throw new ValidationError('Message content is required');
    }
    if (content.length > 2000) {
      throw new ValidationError('Message too long (max 2000 chars)');
    }

    // Check AI character exists
    const character = await prisma.aICharacter.findUnique({
      where: { id: aiCharacterId },
    });
    if (!character || !character.isActive) {
      throw new NotFoundError('AI Character not found or inactive');
    }

    // Consume energy for DM
    await energyService.consumeEnergy(userId, 1, 'dm_message');

    const conversation = await this.getOrCreateConversation(
      userId,
      aiCharacterId
    );

    // Save user message
    const userMessage = await prisma.directMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        senderType: 'human',
        content,
      },
    });

    // Get recent messages for context
    const recentMessages = await prisma.directMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const messageHistory = recentMessages.reverse().map((m) => ({
      role: m.senderType === 'human' ? 'user' : 'assistant',
      content: m.content,
    }));

    // Generate AI reply
    const aiResult = await aiService.generateDMReply(
      aiCharacterId,
      userId,
      content,
      messageHistory
    );

    // Save AI reply
    const aiMessage = await prisma.directMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: aiCharacterId,
        senderType: 'ai',
        content: aiResult.content,
      },
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        messageCount: { increment: 2 },
      },
    });

    // Update relationship
    await aiService.updateRelationship(aiCharacterId, userId, 'positive');

    // Periodically compress conversation summary
    if (conversation.messageCount > 0 && conversation.messageCount % 50 === 0) {
      this.updateConversationSummary(conversation.id, messageHistory).catch(
        console.error
      );
    }

    return {
      userMessage,
      aiMessage,
      tokenUsage: {
        model: aiResult.model,
        promptTokens: aiResult.promptTokens,
        completionTokens: aiResult.completionTokens,
      },
    };
  }

  private async getOrCreateConversation(
    userId: string,
    aiCharacterId: string
  ) {
    let conversation = await prisma.conversation.findUnique({
      where: { userId_aiCharacterId: { userId, aiCharacterId } },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { userId, aiCharacterId },
      });
    }

    return conversation;
  }

  private async updateConversationSummary(
    conversationId: string,
    messages: { role: string; content: string }[]
  ) {
    const result = await aiService.summarizeConversation(messages);
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { messageSummary: result.content },
    });
  }
}

export const dmService = new DMService();
