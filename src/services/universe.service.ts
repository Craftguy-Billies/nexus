import prisma from '../config/database';
import { NotFoundError, ValidationError, ConflictError } from '../utils/errors';

export class UniverseService {
  async getUniverse(id: string) {
    const universe = await prisma.universe.findUnique({
      where: { id },
      include: {
        aiCharacters: { where: { isActive: true, isPublic: true }, take: 10 },
      },
    });
    if (!universe) throw new NotFoundError('Universe not found');
    return universe;
  }

  async listUniverses(limit = 20, cursor?: string) {
    const where: Record<string, unknown> = {};
    if (cursor) {
      where.createdAt = {
        lt: new Date(Buffer.from(cursor, 'base64').toString()),
      };
    }

    const universes = await prisma.universe.findMany({
      where,
      take: limit + 1,
      orderBy: { trendingScore: 'desc' },
    });

    const hasMore = universes.length > limit;
    const items = hasMore ? universes.slice(0, limit) : universes;
    const nextToken =
      hasMore && items.length > 0
        ? Buffer.from(
            items[items.length - 1].createdAt.toISOString()
          ).toString('base64')
        : null;

    return { items, nextToken };
  }

  async createUniverse(
    creatorId: string,
    input: {
      name: string;
      description: string;
      coverImage: string;
      lore: string;
      rules?: string[];
      tags?: string[];
      isOfficial?: boolean;
    }
  ) {
    const existing = await prisma.universe.findUnique({
      where: { name: input.name },
    });
    if (existing) throw new ConflictError('Universe name already taken');

    return prisma.universe.create({
      data: {
        name: input.name,
        description: input.description,
        coverImage: input.coverImage,
        lore: input.lore,
        rules: input.rules || [],
        tags: input.tags || [],
        isOfficial: input.isOfficial || false,
        creatorId,
      },
    });
  }

  async updateUniverse(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      coverImage: string;
      lore: string;
      rules: string[];
      tags: string[];
      isOfficial: boolean;
    }>
  ) {
    const universe = await prisma.universe.findUnique({ where: { id } });
    if (!universe) throw new NotFoundError('Universe not found');

    return prisma.universe.update({ where: { id }, data });
  }

  async searchUniverses(query: string, limit = 20) {
    return prisma.universe.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { has: query.toLowerCase() } },
        ],
      },
      take: limit,
      orderBy: { trendingScore: 'desc' },
    });
  }
}

export const universeService = new UniverseService();
