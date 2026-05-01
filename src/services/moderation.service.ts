import { ModerationResult } from '../types';

/**
 * Content moderation service.
 * In production, this calls OpenAI's Moderation API.
 * This stub provides the interface and basic keyword filtering.
 */
export class ModerationService {
  private readonly blockedKeywords = [
    'violence',
    'self-harm',
    'hate speech',
  ];

  async checkContent(content: string): Promise<ModerationResult> {
    // In production, call OpenAI Moderation API:
    // const response = await openai.moderations.create({ input: content });
    // return { flagged: response.results[0].flagged, ... }

    const lowered = content.toLowerCase();
    const flaggedCategories: string[] = [];

    for (const keyword of this.blockedKeywords) {
      if (lowered.includes(keyword)) {
        flaggedCategories.push(keyword);
      }
    }

    const flagged = flaggedCategories.length > 0;

    return {
      flagged,
      approved: !flagged,
      categories: flaggedCategories,
      scores: {},
    };
  }

  async checkImage(_imageUrl: string): Promise<ModerationResult> {
    // Stub: In production, use an image moderation API
    return {
      flagged: false,
      approved: true,
      categories: [],
      scores: {},
    };
  }
}

export const moderationService = new ModerationService();
