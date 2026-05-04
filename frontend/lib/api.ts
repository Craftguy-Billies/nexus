import type {
  AuthResponse,
  Post,
  Comment,
  AICharacter,
  User,
  Conversation,
  DirectMessage,
  Notification,
  EnergyStatus,
  SubscriptionStatus,
  Universe,
  Scenario,
  PaginatedResponse,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nexus_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Auth ──────────────────────────────────────────────────

export const auth = {
  register(data: { email: string; password: string; username: string; displayName: string }) {
    return request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  },
  login(data: { email: string; password: string }) {
    return request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) });
  },
  registerFirebase(data: { firebaseIdToken: string; username: string; displayName: string }) {
    return request<AuthResponse>('/auth/register/firebase', { method: 'POST', body: JSON.stringify(data) });
  },
  loginFirebase(firebaseIdToken: string) {
    return request<AuthResponse>('/auth/login/firebase', { method: 'POST', body: JSON.stringify({ firebaseIdToken }) });
  },
  me() {
    return request<User>('/auth/me');
  },
};

// ─── Feed ──────────────────────────────────────────────────

export const feed = {
  get(tab: 'mixed' | 'following' | 'ai' | 'trending' = 'mixed', cursor?: string) {
    const routeMap: Record<string, string> = {
      mixed: '/feed/home',
      following: '/feed/following',
      ai: '/feed/home',
      trending: '/feed/discover',
    };
    const params = new URLSearchParams();
    if (cursor) params.set('cursor', cursor);
    const qs = params.toString() ? `?${params}` : '';
    return request<PaginatedResponse<Post>>(`${routeMap[tab] || '/feed/home'}${qs}`);
  },
};

// ─── Posts ──────────────────────────────────────────────────

export const posts = {
  get(id: string) {
    return request<Post>(`/posts/${id}`);
  },
  create(data: { content: string; mediaUrls?: string[]; hashtags?: string[] }) {
    return request<Post>('/posts', { method: 'POST', body: JSON.stringify(data) });
  },
  getComments(postId: string) {
    return request<PaginatedResponse<Comment>>(`/posts/${postId}/comments`);
  },
  addComment(postId: string, content: string) {
    return request<Comment>(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) });
  },
  like(postId: string) {
    return request<void>(`/posts/${postId}/like`, { method: 'POST' });
  },
  unlike(postId: string) {
    return request<void>(`/posts/${postId}/like`, { method: 'DELETE' });
  },
};

// ─── Users ─────────────────────────────────────────────────

export const users = {
  get(id: string) {
    return request<User>(`/users/${id}`);
  },
  update(data: Partial<{ displayName: string; bio: string; avatarUrl: string }>) {
    return request<User>('/users/profile', { method: 'PUT', body: JSON.stringify(data) });
  },
  search(q: string) {
    return request<{ items: User[] }>(`/users/search?q=${encodeURIComponent(q)}`);
  },
};

// ─── Follows ───────────────────────────────────────────────

export const follows = {
  follow(userId: string, followingType: string = 'human') {
    return request<void>(`/follow/${userId}`, { method: 'POST', body: JSON.stringify({ followingType }) });
  },
  unfollow(userId: string) {
    return request<void>(`/follow/${userId}`, { method: 'DELETE' });
  },
  check(targetId: string) {
    return request<{ isFollowing: boolean }>(`/follow/check/${targetId}`);
  },
  followers(userId: string) {
    return request<PaginatedResponse<User>>(`/users/${userId}/followers`);
  },
  following(userId: string) {
    return request<PaginatedResponse<User>>(`/users/${userId}/following`);
  },
};

// ─── AI Characters ─────────────────────────────────────────

export const aiCharacters = {
  list(params?: { universeId?: string; limit?: number; cursor?: string }) {
    const q = new URLSearchParams();
    if (params?.universeId) q.set('universeId', params.universeId);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.cursor) q.set('cursor', params.cursor);
    return request<PaginatedResponse<AICharacter>>(`/ai/characters?${q}`);
  },
  get(id: string) {
    return request<AICharacter>(`/ai/characters/${id}`);
  },
  search(q: string) {
    return request<{ items: AICharacter[] }>(`/ai/characters/search?q=${encodeURIComponent(q)}`);
  },
  create(data: {
    username: string;
    displayName: string;
    persona: string;
    backstory: string;
    personalityProfile: Record<string, number>;
    responseStyle: Record<string, string | number>;
    interests: string[];
    expertise: string[];
  }) {
    return request<AICharacter>('/ai/characters', { method: 'POST', body: JSON.stringify(data) });
  },
};

// ─── DMs ───────────────────────────────────────────────────

export const dm = {
  conversations() {
    return request<Conversation[]>('/dm/conversations');
  },
  messages(aiCharacterId: string, cursor?: string) {
    const params = cursor ? `?cursor=${cursor}` : '';
    return request<PaginatedResponse<DirectMessage>>(`/dm/messages/${aiCharacterId}${params}`);
  },
  send(aiCharacterId: string, content: string) {
    return request<DirectMessage>(`/dm/send/${aiCharacterId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },
};

// ─── Notifications ─────────────────────────────────────────

export const notifications = {
  list() {
    return request<PaginatedResponse<Notification>>('/notifications');
  },
  markRead(id: string) {
    return request<void>(`/notifications/${id}/read`, { method: 'PUT' });
  },
  markAllRead() {
    return request<void>('/notifications/read-all', { method: 'PUT' });
  },
};

// ─── Energy ────────────────────────────────────────────────

export const energy = {
  status() {
    return request<EnergyStatus>('/energy/balance');
  },
  watchAd() {
    return request<EnergyStatus>('/energy/claim-ad-reward', { method: 'POST' });
  },
  redeemGems(amount: number) {
    return request<EnergyStatus>('/energy/claim-streak', { method: 'POST' });
  },
};

// ─── Subscriptions ─────────────────────────────────────────

export const subscriptions = {
  status() {
    return request<SubscriptionStatus>('/subscriptions');
  },
};

// ─── Universes ─────────────────────────────────────────────

export const universes = {
  list() {
    return request<PaginatedResponse<Universe>>('/universes');
  },
  get(id: string) {
    return request<Universe>(`/universes/${id}`);
  },
};

// ─── Scenarios ─────────────────────────────────────────────

export const scenarios = {
  list() {
    return request<PaginatedResponse<Scenario>>('/scenarios');
  },
  get(id: string) {
    return request<Scenario>(`/scenarios/${id}`);
  },
  join(id: string) {
    return request<void>(`/scenarios/${id}/join`, { method: 'POST' });
  },
};

// ─── AI/Vision ─────────────────────────────────────────────

export const vision = {
  analyze(imageUrl: string) {
    return request<{ description: string; objects: string[]; scene: string; mood: string; tags: string[] }>(
      '/ai/vision/analyze', { method: 'POST', body: JSON.stringify({ imageUrl }) }
    );
  },
  suggestTags(imageUrl: string) {
    return request<{ tags: string[] }>('/ai/vision/suggest-tags', { method: 'POST', body: JSON.stringify({ imageUrl }) });
  },
};

// ─── AI Misc ───────────────────────────────────────────────

export const ai = {
  suggestBio(interests: string[], personality?: string) {
    return request<{ content: string }>('/ai/suggest-bio', {
      method: 'POST',
      body: JSON.stringify({ interests, personality }),
    });
  },
  generatePost(aiCharacterId: string, trigger?: string) {
    return request<{ content: string }>('/ai/generate-post', {
      method: 'POST',
      body: JSON.stringify({ aiCharacterId, trigger }),
    });
  },
};
