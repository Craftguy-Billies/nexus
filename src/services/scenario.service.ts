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
        characters: { include: { character: true } },
      },
    });
    if (!scenario) throw new NotFoundError('Scenario not found');
    return scenario;
  }

  async listScenarios(params: {
    universeId?: string;
    limit?: number;
    cursor?: string;
  }) {
    const where: Record<string, unknown> = { isActive: true };
    if (params.universeId) where.universeId = params.universeId;

    if (params.cursor) {
      where.createdAt = {
        lt: new Date(Buffer.from(params.cursor, 'base64').toString()),
      };
    }

    const limit = params.limit || 20;
    const scenarios = await prisma.scenario.findMany({
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
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
    _creatorId: string,
    input: {
      title: string;
      description: string;
      coverImage: string;
      universeId?: string;
      sceneSetting: string;
      aiCharacterIds: string[];
      maxParticipants?: number;
      energyCost?: number;
    }
  ) {
    const scenario = await prisma.scenario.create({
      data: {
        title: input.title,
        description: input.description,
        coverImage: input.coverImage,
        universeId: input.universeId,
        sceneSetting: input.sceneSetting,
        maxParticipants: input.maxParticipants || 1,
        energyCost: input.energyCost || 5,
      },
    });

    // Link AI characters
    if (input.aiCharacterIds.length > 0) {
      await prisma.scenarioCharacter.createMany({
        data: input.aiCharacterIds.map((aiCharacterId) => ({
          scenarioId: scenario.id,
          characterId: aiCharacterId,
        })),
      });
    }

    return scenario;
  }

  async joinScenario(userId: string, scenarioId: string) {
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
    });
    if (!scenario) throw new NotFoundError('Scenario not found');

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
    await energyService.consumeEnergy(userId, scenario.energyCost, 'join_scenario');

    throw new ValidationError(
      'Scenario participation tracking is not configured in the current database schema'
    );
  }

  async leaveScenario(_userId: string, scenarioId: string) {
    const scenario = await prisma.scenario.findUnique({
      where: { id: scenarioId },
    });
    if (!scenario) throw new NotFoundError('Scenario not found');

    throw new ValidationError(
      'Scenario participation tracking is not configured in the current database schema'
    );
  }
}

export const scenarioService = new ScenarioService();
