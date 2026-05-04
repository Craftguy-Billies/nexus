import prisma from '../config/database';
import { getYearMonth } from '../utils/helpers';
import { TokenOperation, TokenPricing } from '../types';

export class TokenUsageTracker {
  private readonly pricing: Record<string, TokenPricing> = {
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-4o': { input: 0.005, output: 0.015 },
    'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
    'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
  };

  async trackUsage(params: {
    aiCharacterId: string;
    triggeredByUserId?: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    operation: TokenOperation;
  }): Promise<void> {
    const pricing = this.pricing[params.model] || this.pricing['gpt-4o-mini'];
    const inputCost = (params.promptTokens / 1000) * pricing.input;
    const outputCost = (params.completionTokens / 1000) * pricing.output;
    const totalCost = inputCost + outputCost;

    const yearMonth = getYearMonth();

    await prisma.tokenUsage.create({
      data: {
        aiCharacterId: params.aiCharacterId,
        triggeredByUserId: params.triggeredByUserId,
        promptTokens: params.promptTokens,
        completionTokens: params.completionTokens,
        totalTokens: params.promptTokens + params.completionTokens,
        model: params.model,
        provider: params.model.startsWith('claude') ? 'anthropic' : 'openai',
        costPer1KInputTokens: pricing.input,
        costPer1KOutputTokens: pricing.output,
        totalCostUsd: totalCost,
        operation: params.operation,
        yearMonth,
      },
    });

    // Update AI character token counts
    await prisma.aICharacter.update({
      where: { id: params.aiCharacterId },
      data: {
        totalTokensConsumed: { increment: params.promptTokens + params.completionTokens },
        currentMonthTokens: { increment: params.promptTokens + params.completionTokens },
      },
    });
  }

  async getUsageByCharacter(aiCharacterId: string, yearMonth?: string) {
    const ym = yearMonth || getYearMonth();

    const usage = await prisma.tokenUsage.aggregate({
      where: { aiCharacterId, yearMonth: ym },
      _sum: {
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        totalCostUsd: true,
      },
      _count: true,
    });

    return {
      yearMonth: ym,
      totalPromptTokens: usage._sum.promptTokens || 0,
      totalCompletionTokens: usage._sum.completionTokens || 0,
      totalTokens: usage._sum.totalTokens || 0,
      totalCostUsd: usage._sum.totalCostUsd || 0,
      requestCount: usage._count,
    };
  }

  async getUsageOverview(yearMonth?: string) {
    const ym = yearMonth || getYearMonth();

    const usage = await prisma.tokenUsage.groupBy({
      by: ['model', 'operation'],
      where: { yearMonth: ym },
      _sum: {
        totalTokens: true,
        totalCostUsd: true,
      },
      _count: true,
    });

    const totals = await prisma.tokenUsage.aggregate({
      where: { yearMonth: ym },
      _sum: {
        totalTokens: true,
        totalCostUsd: true,
      },
      _count: true,
    });

    return {
      yearMonth: ym,
      breakdown: usage,
      totals: {
        totalTokens: totals._sum.totalTokens || 0,
        totalCostUsd: totals._sum.totalCostUsd || 0,
        totalRequests: totals._count,
      },
    };
  }

  async checkBudget(aiCharacterId: string): Promise<{
    withinBudget: boolean;
    used: number;
    budget: number;
    remaining: number;
  }> {
    const character = await prisma.aICharacter.findUnique({
      where: { id: aiCharacterId },
      select: { monthlyTokenBudget: true, currentMonthTokens: true },
    });

    if (!character) {
      return { withinBudget: false, used: 0, budget: 0, remaining: 0 };
    }

    const remaining = character.monthlyTokenBudget - character.currentMonthTokens;

    return {
      withinBudget: remaining > 0,
      used: character.currentMonthTokens,
      budget: character.monthlyTokenBudget,
      remaining: Math.max(0, remaining),
    };
  }
}

export const tokenUsageTracker = new TokenUsageTracker();
