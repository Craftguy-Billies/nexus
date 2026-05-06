export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  interests: string[];
  isAdmin: boolean;
  isVerified: boolean;
  firebaseUid: string | null;
  onboardingStep?: number;
  onboardingInterests?: string[];
  onboardingCompletedAt?: string | null;
  createdAt: string;
  _count?: {
    posts: number;
    followers: number;
    following: number;
  };
}

export interface AICharacter {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  coverImage: string | null;
  persona: string;
  backstory: string;
  personalityProfile: PersonalityProfile;
  responseStyle: ResponseStyle;
  interests: string[];
  expertise: string[];
  isActive: boolean;
  isPublic: boolean;
  universeId: string | null;
  universe: Universe | null;
  followerCount: number;
  followingCount: number;
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  createdAt: string;
  _count?: {
    posts: number;
    followers: number;
    following: number;
    likes: number;
  };
}

export interface PersonalityProfile {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  humor: number;
  formality: number;
}

export interface ResponseStyle {
  tone: string;
  verbosity: 'concise' | 'moderate' | 'detailed';
  emojiUsage: 'none' | 'minimal' | 'frequent';
  temperature: number;
}

export interface Post {
  id: string;
  content: string;
  mediaUrls: string[];
  hashtags: string[];
  authorId: string | null;
  aiCharacterId: string | null;
  author: User | null;
  aiCharacter: AICharacter | null;
  isAIGenerated: boolean;
  createdAt: string;
  _count?: {
    comments: number;
    likes: number;
  };
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string | null;
  aiCharacterId: string | null;
  parentId: string | null;
  author: User | null;
  aiCharacter: AICharacter | null;
  isAIGenerated: boolean;
  createdAt: string;
  replies?: Comment[];
  _count?: {
    likes: number;
    replies: number;
  };
}

export interface Conversation {
  id: string;
  userId: string;
  aiCharacterId: string;
  aiCharacter: AICharacter;
  lastMessageAt: string;
  lastMessage?: DirectMessage;
  unreadCount: number;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  content: string;
  senderType: 'human' | 'user' | 'ai';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, string>;
  isRead: boolean;
  createdAt: string;
}

export interface Universe {
  id: string;
  name: string;
  description: string;
  coverUrl: string | null;
  lore: string;
  rules: string[];
  isPublic: boolean;
  createdAt: string;
  _count?: {
    characters: number;
    posts: number;
  };
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  coverUrl: string | null;
  sceneSetting: string;
  universeId: string | null;
  maxParticipants: number;
  energyCost: number;
  isActive: boolean;
  characters: AICharacter[];
  _count?: {
    participants: number;
  };
}

export interface EnergyStatus {
  currentEnergy: number;
  maxEnergy: number;
  tier: 'free' | 'premium' | 'pro';
  dailyRefresh: number;
  nextRefreshAt: string;
  streak: number;
  adsWatchedToday: number;
  maxAdsPerDay: number;
}

export interface SubscriptionStatus {
  tier: 'free' | 'premium' | 'pro';
  isActive: boolean;
  expiresAt: string | null;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  /** True when this is the first time the user has authenticated (no DB profile yet). */
  isNewUser?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
}
