import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { subscriptionService } from './subscription.service';
import { PersonalityProfile, ResponseStyle, ActivitySchedule } from '../types';

export class AICharacterService {
  async getCharacter(id: string) {
    const character = await prisma.aICharacter.findUnique({
      where: { id },
      include: { universe: true },
    });
    if (!character) throw new NotFoundError('AI Character not found');
    return character;
  }

  async listCharacters(params: {
    universeId?: string;
    isActive?: boolean;
    isPublic?: boolean;
    limit?: number;
    cursor?: string;
  }) {
    const where: Record<string, unknown> = {};
    if (params.universeId) where.universeId = params.universeId;
    if (params.isActive !== undefined) where.isActive = params.isActive;
    if (params.isPublic !== undefined) where.isPublic = params.isPublic;

    if (params.cursor) {
      where.createdAt = {
        lt: new Date(Buffer.from(params.cursor, 'base64').toString()),
      };
    }

    const limit = params.limit || 20;
    const characters = await prisma.aICharacter.findMany({
      where,
      take: limit + 1,
      orderBy: { followerCount: 'desc' },
      include: { universe: true },
    });

    const hasMore = characters.length > limit;
    const items = hasMore ? characters.slice(0, limit) : characters;
    const nextToken =
      hasMore && items.length > 0
        ? Buffer.from(
            items[items.length - 1].createdAt.toISOString()
          ).toString('base64')
        : null;

    return { items, nextToken };
  }

  async searchCharacters(query: string, limit = 20) {
    return prisma.aICharacter.findMany({
      where: {
        OR: [
          { username: { contains: query.toLowerCase(), mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true,
        isPublic: true,
      },
      take: limit,
      orderBy: { followerCount: 'desc' },
    });
  }

  async createCharacter(
    createdBy: string,
    input: {
      username: string;
      displayName: string;
      avatar: string;
      bio: string;
      persona: string;
      backstory?: string;
      interests: string[];
      expertise?: string[];
      universeId?: string;
      personalityProfile: PersonalityProfile;
      responseStyle: Partial<ResponseStyle>;
      activitySchedule?: Partial<ActivitySchedule>;
    },
    isAdmin = false
  ) {
    // Check subscription limits (unless admin)
    if (!isAdmin) {
      const limit = await subscriptionService.getAICharacterLimit(createdBy);
      const currentCount = await prisma.aICharacter.count({
        where: { createdBy },
      });

      if (currentCount >= limit) {
        throw new ForbiddenError(
          `You can create up to ${limit} AI characters on your current plan. Upgrade to create more.`
        );
      }
    }

    // Validate username
    if (!/^[a-zA-Z0-9_]+$/.test(input.username)) {
      throw new ValidationError(
        'Username can only contain letters, numbers, and underscores'
      );
    }

    const existing = await prisma.aICharacter.findUnique({
      where: { username: input.username.toLowerCase() },
    });
    if (existing) throw new ValidationError('Username already taken');

    // Set default response style
    const responseStyle: ResponseStyle = {
      temperature: 0.7,
      topP: 0.9,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1,
      maxTokens: 300,
      tone: 'friendly',
      verbosity: 'moderate',
      emojiUsage: 'minimal',
      questionFrequency: 0.3,
      ...input.responseStyle,
    };

    const activitySchedule: ActivitySchedule = {
      timezone: 'America/New_York',
      peakActivityHours: [9, 10, 11, 19, 20, 21],
      dailyPostTarget: 2,
      interactionProbability: 0.5,
      ...input.activitySchedule,
    };

    return prisma.aICharacter.create({
      data: {
        username: input.username.toLowerCase(),
        displayName: input.displayName,
        avatar: input.avatar,
        bio: input.bio,
        persona: input.persona,
        backstory: input.backstory || '',
        interests: input.interests,
        expertise: input.expertise || [],
        universeId: input.universeId,
        personalityProfile: input.personalityProfile as unknown as Prisma.InputJsonValue,
        responseStyle: responseStyle as unknown as Prisma.InputJsonValue,
        activitySchedule: activitySchedule as unknown as Prisma.InputJsonValue,
        createdBy,
        isActive: true,
        isPublic: true,
        monthlyTokenBudget: 500000,
      },
    });
  }

  async updateCharacter(
    id: string,
    data: Partial<{
      displayName: string;
      bio: string;
      avatar: string;
      persona: string;
      backstory: string;
      interests: string[];
      expertise: string[];
      personalityProfile: PersonalityProfile;
      responseStyle: ResponseStyle;
      activitySchedule: ActivitySchedule;
      isActive: boolean;
      isPublic: boolean;
      monthlyTokenBudget: number;
    }>
  ) {
    const character = await prisma.aICharacter.findUnique({ where: { id } });
    if (!character) throw new NotFoundError('AI Character not found');

    // Convert custom types to JSON-compatible for Prisma
    const prismaData: Record<string, unknown> = { ...data };
    if (data.personalityProfile) {
      prismaData.personalityProfile = data.personalityProfile as unknown as Prisma.InputJsonValue;
    }
    if (data.responseStyle) {
      prismaData.responseStyle = data.responseStyle as unknown as Prisma.InputJsonValue;
    }
    if (data.activitySchedule) {
      prismaData.activitySchedule = data.activitySchedule as unknown as Prisma.InputJsonValue;
    }

    return prisma.aICharacter.update({ where: { id }, data: prismaData });
  }

  async deleteCharacter(id: string) {
    const character = await prisma.aICharacter.findUnique({ where: { id } });
    if (!character) throw new NotFoundError('AI Character not found');

    // Soft delete: deactivate instead of deleting
    return prisma.aICharacter.update({
      where: { id },
      data: { isActive: false, isPublic: false },
    });
  }

  async resetMonthlyTokens() {
    await prisma.aICharacter.updateMany({
      data: { currentMonthTokens: 0 },
    });
  }
}

export const aiCharacterService = new AICharacterService();
