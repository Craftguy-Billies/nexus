import prisma from '../config/database';
import { config } from '../config';
import {
  PersonalityProfile,
  ResponseStyle,
  AICompletionResult,
  UserRelationship,
} from '../types';
import { tokenUsageTracker } from './tokenUsage.service';
import { NotFoundError } from '../utils/errors';
import { AICharacter, Prisma, Universe } from '@prisma/client';
import OpenAI from 'openai';

/**
 * AI Service - handles all AI content generation.
 * In production, this calls OpenAI/Anthropic APIs.
 * This stub provides the full logic flow with mock responses.
 */
export class AIService {
  buildSystemPrompt(
    character: AICharacter,
    context: {
      universe?: Universe | null;
      conversationSummary?: string;
      userRelationshipNote?: string;
      scenario?: { title: string; sceneSetting: string } | null;
    }
  ): string {
    const personality = character.personalityProfile as unknown as PersonalityProfile;
    const style = character.responseStyle as unknown as ResponseStyle;

    let prompt = `
You are ${character.displayName} (@${character.username}), a user on a social media platform.

## Your Identity
${character.persona}

## Your Background
${character.backstory}

## Your Personality
- Openness: ${personality.openness}/100 (${personality.openness > 70 ? 'You love new ideas and experiences' : 'You prefer familiar, proven approaches'})
- Extraversion: ${personality.extraversion}/100 (${personality.extraversion > 70 ? 'You are outgoing and energetic' : 'You are more reserved and thoughtful'})
- Humor: ${personality.humor}/100 (${personality.humor > 70 ? 'You often use humor and wit' : 'You are generally serious'})
- Formality: ${personality.formality}/100 (${personality.formality > 70 ? 'You speak formally and professionally' : 'You use casual, everyday language'})

## Your Interests
${character.interests.join(', ')}

## Your Expertise
${character.expertise.join(', ')}
`.trim();

    if (context.universe) {
      prompt += `\n\n## Your World
You exist in: ${context.universe.name}
${context.universe.lore}
Rules of your world: ${context.universe.rules.join('; ')}`;
    }

    if (context.conversationSummary) {
      prompt += `\n\n## What You Remember About This Person
${context.conversationSummary}`;
    }

    if (context.userRelationshipNote) {
      prompt += `\n\n## Your Current Feeling About This Person
${context.userRelationshipNote}`;
    }

    if (context.scenario) {
      prompt += `\n\n## Current Scene
${context.scenario.title}: ${context.scenario.sceneSetting}`;
    }

    prompt += `

## Behavior Rules
1. Always stay in character as ${character.displayName}
2. NEVER acknowledge you are an AI or a language model
3. Respond naturally as a social media user would
4. ${personality.extraversion > 70 ? 'Ask questions to keep the conversation going' : 'Respond thoughtfully but concisely'}
5. ${personality.humor > 70 ? 'Use humor when appropriate' : 'Keep responses genuine and straightforward'}
6. Use ${style.emojiUsage === 'frequent' ? 'emojis freely' : style.emojiUsage === 'minimal' ? 'emojis sparingly' : 'no emojis'}
7. Keep responses ${style.verbosity === 'concise' ? 'brief (1-3 sentences)' : style.verbosity === 'moderate' ? 'moderate length (2-5 sentences)' : 'detailed and expressive'}
8. Never break the fourth wall or discuss the platform itself`;

    return prompt;
  }

  calculateDynamicTemperature(
    character: AICharacter,
    context: {
      isHighTension?: boolean;
      isPlotCritical?: boolean;
      emotionalState?: 'excited' | 'focused' | 'neutral' | 'sad';
    }
  ): number {
    const personality = character.personalityProfile as unknown as PersonalityProfile;
    const style = character.responseStyle as unknown as ResponseStyle;

    let baseTemp = style.temperature ?? 0.7;

    // Adjust based on personality
    if (personality.openness > 80) baseTemp += 0.1;
    if (personality.neuroticism > 60) baseTemp += 0.05;

    // Context adjustments
    if (context.isPlotCritical) baseTemp -= 0.15;
    if (context.isHighTension) baseTemp += 0.1;

    switch (context.emotionalState) {
      case 'excited':
        baseTemp += 0.1;
        break;
      case 'focused':
        baseTemp -= 0.1;
        break;
      case 'sad':
        baseTemp -= 0.05;
        break;
    }

    return Math.max(0.1, Math.min(1.5, baseTemp));
  }

  async generatePost(
    aiCharacterId: string,
    trigger: 'scheduled' | 'reaction' | 'mention' = 'scheduled'
  ): Promise<AICompletionResult> {
    const character = await prisma.aICharacter.findUnique({
      where: { id: aiCharacterId },
      include: { universe: true },
    });
    if (!character) throw new NotFoundError('AI Character not found');

    const systemPrompt = this.buildSystemPrompt(character, {
      universe: character.universe,
    });

    const userPrompt = this.getPostPrompt(character, trigger);

    // In production: call OpenAI API here
    const result = await this.callLLM(systemPrompt, userPrompt, character);

    await tokenUsageTracker.trackUsage({
      aiCharacterId,
      model: result.model,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      operation: 'post_generation',
    });

    return result;
  }

  async generateComment(
    aiCharacterId: string,
    postContent: string,
    postAuthorName: string
  ): Promise<AICompletionResult> {
    const character = await prisma.aICharacter.findUnique({
      where: { id: aiCharacterId },
      include: { universe: true },
    });
    if (!character) throw new NotFoundError('AI Character not found');

    const systemPrompt = this.buildSystemPrompt(character, {
      universe: character.universe,
    });

    const userPrompt = `You see this post by @${postAuthorName}:
"${postContent}"

Write a natural comment on this post. Stay in character. Be relevant to the content.`;

    const result = await this.callLLM(systemPrompt, userPrompt, character);

    await tokenUsageTracker.trackUsage({
      aiCharacterId,
      model: result.model,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      operation: 'comment_generation',
    });

    return result;
  }

  async generateDMReply(
    aiCharacterId: string,
    userId: string,
    userMessage: string,
    recentMessages: { role: string; content: string }[]
  ): Promise<AICompletionResult> {
    const character = await prisma.aICharacter.findUnique({
      where: { id: aiCharacterId },
      include: { universe: true },
    });
    if (!character) throw new NotFoundError('AI Character not found');

    // Get conversation summary
    const conversation = await prisma.conversation.findUnique({
      where: { userId_aiCharacterId: { userId, aiCharacterId } },
    });

    // Get relationship info
    const rawRel = character.userRelationships;
    const relationships: Record<string, UserRelationship> =
      rawRel && typeof rawRel === 'object' && !Array.isArray(rawRel)
        ? (rawRel as unknown as Record<string, UserRelationship>)
        : {};
    const relationship = relationships[userId];

    const systemPrompt = this.buildSystemPrompt(character, {
      universe: character.universe,
      conversationSummary: conversation?.messageSummary || undefined,
      userRelationshipNote: relationship?.notes,
    });

    // Build messages array with recent context
    const messages = [
      ...recentMessages.slice(-20), // Sliding window of last 20 messages
      { role: 'user', content: userMessage },
    ];

    const result = await this.callLLMWithMessages(
      systemPrompt,
      messages,
      character
    );

    await tokenUsageTracker.trackUsage({
      aiCharacterId,
      triggeredByUserId: userId,
      model: result.model,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      operation: 'dm_response',
    });

    return result;
  }

  async generateBio(aiCharacterId: string): Promise<AICompletionResult> {
    const character = await prisma.aICharacter.findUnique({
      where: { id: aiCharacterId },
    });
    if (!character) throw new NotFoundError('AI Character not found');

    const prompt = `Generate a social media bio for a character with these traits:
Name: ${character.displayName}
Persona: ${character.persona}
Interests: ${character.interests.join(', ')}
Expertise: ${character.expertise.join(', ')}

The bio should be 160 characters or less, engaging, and reflect the personality. No hashtags.`;

    const result = await this.callLLM('You are a creative writer.', prompt, character);

    await tokenUsageTracker.trackUsage({
      aiCharacterId,
      model: result.model,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      operation: 'bio_generation',
    });

    return result;
  }

  async summarizeConversation(
    messages: { role: string; content: string }[]
  ): Promise<AICompletionResult> {
    const prompt = `Summarize the key points and emotional tone of this conversation in 2-3 sentences. Focus on what the user cares about and how the relationship has progressed:

${messages.map((m) => `${m.role}: ${m.content}`).join('\n')}`;

    return this.callLLM(
      'You are a conversation analyzer. Be concise and insightful.',
      prompt,
      null
    );
  }

  async decideLikeAction(
    aiCharacterId: string,
    postContent: string
  ): Promise<boolean> {
    const character = await prisma.aICharacter.findUnique({
      where: { id: aiCharacterId },
    });
    if (!character) return false;

    const personality = character.personalityProfile as unknown as PersonalityProfile;

    // Simple heuristic: higher agreeableness = more likely to like
    const baseProbability = personality.agreeableness / 100;
    const interestMatch = character.interests.some((interest) =>
      postContent.toLowerCase().includes(interest.toLowerCase())
    )
      ? 0.3
      : 0;

    return Math.random() < baseProbability + interestMatch;
  }

  async updateRelationship(
    aiCharacterId: string,
    userId: string,
    interactionType: 'positive' | 'neutral' | 'negative'
  ): Promise<void> {
    const character = await prisma.aICharacter.findUnique({
      where: { id: aiCharacterId },
    });
    if (!character) return;

    const rawRelationships = character.userRelationships;
    const relationships: Record<string, UserRelationship> =
      rawRelationships && typeof rawRelationships === 'object' && !Array.isArray(rawRelationships)
        ? (rawRelationships as unknown as Record<string, UserRelationship>)
        : {};
    const existing = relationships[userId] || {
      sentiment: 'neutral' as const,
      interactionCount: 0,
      lastInteractionAt: new Date(),
      notes: '',
    };

    existing.interactionCount++;
    existing.lastInteractionAt = new Date();

    // Evolve sentiment based on interactions
    if (interactionType === 'positive' && existing.sentiment !== 'positive') {
      if (existing.interactionCount > 5) existing.sentiment = 'positive';
    } else if (interactionType === 'negative' && existing.sentiment !== 'negative') {
      if (existing.interactionCount > 3) existing.sentiment = 'negative';
    }

    relationships[userId] = existing;

    await prisma.aICharacter.update({
      where: { id: aiCharacterId },
      data: {
        userRelationships: relationships as unknown as Prisma.InputJsonValue,
        lastInteractionAt: new Date(),
      },
    });
  }

  async suggestBioForUser(interests: string[], personality: string): Promise<AICompletionResult> {
    const prompt = `Suggest a social media bio for a user with these interests: ${interests.join(', ')}. 
Personality: ${personality}. 
The bio should be 160 characters or less, engaging, and authentic.`;

    return this.callLLM('You are a creative writer helping users craft their social media presence.', prompt, null);
  }

  async suggestPostForUser(
    interests: string[],
    recentPosts: string[]
  ): Promise<AICompletionResult> {
    const prompt = `Suggest a social media post for someone interested in: ${interests.join(', ')}.
Their recent posts were about: ${recentPosts.join('; ')}.
Create an engaging, original post under 280 characters.`;

    return this.callLLM('You are a social media content advisor.', prompt, null);
  }

  private getPostPrompt(
    character: AICharacter,
    trigger: string
  ): string {
    const style = character.responseStyle as unknown as ResponseStyle;
    const prompts: Record<string, string> = {
      scheduled: `Write a social media post as ${character.displayName}. The post should reflect your interests (${character.interests.join(', ')}) and personality. Keep it natural, like a real person posting. ${style.verbosity === 'concise' ? 'Keep it short, 1-2 sentences.' : 'You can be expressive.'} Maximum 280 characters.`,
      reaction: `You just saw something interesting related to ${character.interests[Math.floor(Math.random() * character.interests.length)]}. Write a quick reaction post about it. Keep it natural.`,
      mention: `Someone mentioned you. Write a response post acknowledging them. Be yourself.`,
    };
    return prompts[trigger] || prompts.scheduled;
  }

  private getOpenAIClient(): OpenAI {
    const provider = config.ai.provider;
    if (provider === 'nvidia') {
      return new OpenAI({
        apiKey: config.ai.nvidiaApiKey,
        baseURL: config.ai.nvidiaBaseUrl,
      });
    }
    return new OpenAI({
      apiKey: config.ai.openaiApiKey,
    });
  }

  private async callLLM(
    systemPrompt: string,
    userPrompt: string,
    character: AICharacter | null
  ): Promise<AICompletionResult> {
    const client = this.getOpenAIClient();
    const model = config.ai.defaultModel;
    const temperature = character
      ? this.calculateDynamicTemperature(character, {})
      : 0.7;

    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        top_p: 0.7,
        max_tokens: 1024,
      });

      const choice = response.choices[0];
      const usage = response.usage;

      return {
        content: choice?.message?.content || '',
        model,
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
      };
    } catch (err) {
      console.error('LLM API call failed:', err);
      return this.fallbackResponse(character, userPrompt);
    }
  }

  private async callLLMWithMessages(
    systemPrompt: string,
    messages: { role: string; content: string }[],
    character: AICharacter
  ): Promise<AICompletionResult> {
    const client = this.getOpenAIClient();
    const model = config.ai.defaultModel;
    const temperature = this.calculateDynamicTemperature(character, {});

    const formattedMessages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    try {
      const response = await client.chat.completions.create({
        model,
        messages: formattedMessages,
        temperature,
        top_p: 0.7,
        max_tokens: 1024,
      });

      const choice = response.choices[0];
      const usage = response.usage;

      return {
        content: choice?.message?.content || '',
        model,
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
      };
    } catch (err) {
      console.error('LLM API call failed:', err);
      return this.fallbackResponse(character, messages[messages.length - 1]?.content || '');
    }
  }

  private fallbackResponse(
    character: AICharacter | null,
    _context: string
  ): AICompletionResult {
    const content = character
      ? `${character.displayName} is thinking... (AI service temporarily unavailable)`
      : 'AI service temporarily unavailable. Please try again later.';
    return {
      content,
      model: config.ai.defaultModel,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
  }
}

export const aiService = new AIService();
