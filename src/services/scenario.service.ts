import prisma from '../config/database';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { energyService } from './energy.service';
import { subscriptionService } from './subscription.service';

export class ScenarioService {
  async getScenario(id: string) {
    const scenario = await prisma.scenario.findUnique({
      where: { id },
      include: {
        universe: true,
        characters: { include: { aiCharacter: true } },
      },
    });
    if (!scenario) throw new NotFoundError('Scenario not found');
    return scenario;
  }

  async listScenarios(params: {
    universeId?: string;
    isPublic?: boolean;
    limit?: number;
    cursor?: string;
  }) {
    const where: Record<string, unknown> = { isActive: true };
    if (params.universeId) where.universeId = params.universeId;
    if (params.isPublic !== undefined) where.isPublic = params.isPublic;

    if (params.cursor) {
      where.createdAt = {
        lt: new Date(Buffer.from(params.cursor, 'base64').toString()),
      };
    }

    const limit = params.limit || 20;
    const scenarios = await prisma.scenario.findMany({
      where,
      take: limit + 1,
      orderBy: { playCount: 'desc' },
      include: { universe: true },
    });

    const hasMore = scenarios.length > limit;
    const items = hasMore ? scenarios.slice(0, limit) : scenarios;
    const nextToken =
      hasMore && items.length > 0
        ? Buffer.from(
            items[items.length - 1].createdAt.toISOString()
          ).toString('base64')
        : null;

    return { items, nextToken };
  }

  async createScenario(
    creatorId: string,
    input: {
      title: string;
      description: string;
      coverImage: string;
      universeId?: string;
      sceneSetting: string;
      aiCharacterIds: string[];
      maxHumanPlayers?: number;
      plotPoints?: { title: string; description: string; triggerCondition?: string }[];
    }
  ) {
    const scenario = await prisma.scenario.create({
      data: {
        title: input.title,
        description: input.description,
        coverImage: input.coverImage,
        universeId: input.universeId,
        creatorId,
        sceneSetting: input.sceneSetting,
        maxHumanPlayers: input.maxHumanPlayers || 1,
        plotPoints: (input.plotPoints || []).map((pp, i) => ({
          id: `pp_${i}`,
          ...pp,
          isCompleted: false,
        })),
      },
    });

    // Link AI characters
    if (input.aiCharacterIds.length > 0) {
      await prisma.scenarioCharacter.createMany({
        data: input.aiCharacterIds.map((aiCharacterId) => ({
          scenarioId: scenario.id,
          aiCharacterId,
        })),
      });
    }

    return scenario;
  }

  async joinScenario(userId: string, scenarioId: string) {
    // Check multiplayer access
    const hasAccess = await subscriptionService.checkFeature(
      userId,
      'multiplayerAccess'
    );
    if (!hasAccess) {
      throw new ForbiddenError(
        'Multiplayer access requires Premium or Pro subscription'
      );
    }

    // Consume energy
    await energyService.consumeEnergy(userId, 3, 'join_scenario');

    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
    });
    if (!scenario) throw new NotFoundError('Scenario not found');

    if (scenario.currentPlayers.length >= scenario.maxHumanPlayers) {
      throw new ValidationError('Scenario is full');
    }

    if (scenario.currentPlayers.includes(userId)) {
      throw new ValidationError('Already in this scenario');
    }

    return prisma.scenario.update({
      where: { id: scenarioId },
      data: {
        currentPlayers: { push: userId },
        playCount: { increment: 1 },
        lastPlayedAt: new Date(),
      },
    });
  }

  async leaveScenario(userId: string, scenarioId: string) {
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
    });
    if (!scenario) throw new NotFoundError('Scenario not found');

    return prisma.scenario.update({
      where: { id: scenarioId },
      data: {
        currentPlayers: {
          set: scenario.currentPlayers.filter((id) => id !== userId),
        },
      },
    });
  }
}

export const scenarioService = new ScenarioService();
