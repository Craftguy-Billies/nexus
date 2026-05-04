import { v4 as uuidv4 } from 'uuid';

export function generateId(): string {
  return uuidv4();
}

export function extractHashtags(content: string): string[] {
  const regex = /#(\w+)/g;
  const matches = content.match(regex) || [];
  return [...new Set(matches.map((tag) => tag.slice(1).toLowerCase()))];
}

export function extractMentions(content: string): string[] {
  const regex = /@(\w+)/g;
  const matches = content.match(regex) || [];
  return [...new Set(matches.map((mention) => mention.slice(1).toLowerCase()))];
}

export function encodeCursor(date: Date): string {
  return Buffer.from(date.toISOString()).toString('base64');
}

export function decodeCursor(cursor: string): Date {
  return new Date(Buffer.from(cursor, 'base64').toString('utf-8'));
}

export function getYearMonth(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export function weightedRandom<T>(items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function calculateFreshnessScore(
  createdAt: Date,
  likesCount: number,
  commentsCount: number,
  sharesCount: number
): number {
  const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  const engagementScore = likesCount * 1 + commentsCount * 2 + sharesCount * 3;
  return engagementScore / Math.pow(ageHours + 2, 1.8);
}
