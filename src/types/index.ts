import { Request } from 'express';

export interface AuthPayload {
  userId: string;
  firebaseUid: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

/** Extract a single param string from Express v5 params (which may be string | string[]) */
export function param(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0];
  return value || '';
}

export interface PaginationParams {
  limit: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  nextToken: string | null;
  total?: number;
}

export interface PersonalityProfile {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  humor: number;
  formality: number;
  enthusiasm: number;
  curiosity: number;
}

export interface ResponseStyle {
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  maxTokens?: number;
  tone: 'friendly' | 'professional' | 'casual' | 'witty' | 'supportive' | 'mysterious';
  verbosity: 'concise' | 'moderate' | 'detailed';
  emojiUsage: 'none' | 'minimal' | 'frequent';
  questionFrequency: number;
}

export interface ActivitySchedule {
  timezone: string;
  peakActivityHours: number[];
  dailyPostTarget: number;
  interactionProbability: number;
}

export interface AIGenerationMeta {
  model: string;
  promptTokens: number;
  completionTokens: number;
  generationTrigger: 'scheduled' | 'reaction' | 'mention';
}

export interface SubscriptionFeatures {
  dailyEnergyAllowance: number;
  maxAICharacters: number;
  multiplayerAccess: boolean;
  adFree: boolean;
  priorityAIResponse: boolean;
  customAIPersonality: boolean;
  advancedAnalytics: boolean;
}

export interface PlotPoint {
  id: string;
  title: string;
  description: string;
  triggerCondition?: string;
  isCompleted: boolean;
}

export interface UserRelationship {
  sentiment: 'positive' | 'neutral' | 'negative';
  interactionCount: number;
  lastInteractionAt: Date;
  notes: string;
}

export interface TokenPricing {
  input: number;
  output: number;
}

export type TokenOperation =
  | 'post_generation'
  | 'comment_generation'
  | 'dm_response'
  | 'bio_generation'
  | 'content_moderation'
  | 'personality_generation'
  | 'context_compression'
  | 'like_decision';

export interface ModerationResult {
  flagged: boolean;
  approved: boolean;
  categories: string[];
  scores: Record<string, number>;
}

export interface AICompletionResult {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}
