import { userService } from '../services/user.service';
import { postService } from '../services/post.service';
import { commentService } from '../services/comment.service';
import { likeService } from '../services/like.service';
import { followService } from '../services/follow.service';
import { feedService } from '../services/feed.service';
import { aiCharacterService } from '../services/aiCharacter.service';
import { universeService } from '../services/universe.service';
import { authService } from '../services/auth.service';
import { UnauthorizedError } from '../utils/errors';

export interface Context {
  user?: { userId: string; firebaseUid: string };
}

function requireAuth(context: Context): string {
  if (!context.user) throw new UnauthorizedError();
  return context.user.userId;
}

export const resolvers = {
  DateTime: {
    __serialize(value: unknown): string | null {
      if (value instanceof Date) return value.toISOString();
      if (typeof value === 'string') return value;
      return null;
    },
  },

  JSON: {
    __serialize(value: unknown): unknown {
      return value;
    },
  },

  Query: {
    me: async (_: unknown, __: unknown, context: Context) => {
      const userId = requireAuth(context);
      return authService.getMe(userId);
    },

    getUser: async (_: unknown, { id }: { id: string }) => {
      return userService.getUserById(id);
    },

    getUserByUsername: async (_: unknown, { username }: { username: string }) => {
      return userService.getUserByUsername(username);
    },

    searchUsers: async (_: unknown, { query, limit }: { query: string; limit?: number }) => {
      return userService.searchUsers(query, limit);
    },

    getAICharacter: async (_: unknown, { id }: { id: string }) => {
      return aiCharacterService.getCharacter(id);
    },

    listAICharacters: async (
      _: unknown,
      args: { universeId?: string; isActive?: boolean; limit?: number; cursor?: string }
    ) => {
      return aiCharacterService.listCharacters({
        ...args,
        isPublic: true,
      });
    },

    searchAICharacters: async (_: unknown, { query, limit }: { query: string; limit?: number }) => {
      return aiCharacterService.searchCharacters(query, limit);
    },

    getPost: async (_: unknown, { id }: { id: string }, context: Context) => {
      return postService.getPost(id, context.user?.userId);
    },

    getFeed: async (
      _: unknown,
      { feedType, limit, cursor }: { feedType: string; limit?: number; cursor?: string },
      context: Context
    ) => {
      switch (feedType) {
        case 'home': {
          const userId = requireAuth(context);
          return feedService.getHomeFeed(userId, limit, cursor);
        }
        case 'following': {
          const userId = requireAuth(context);
          return feedService.getFollowingFeed(userId, limit, cursor);
        }
        case 'discover':
          return feedService.getDiscoverFeed(limit, cursor);
        default:
          return feedService.getDiscoverFeed(limit, cursor);
      }
    },

    getTrendingPosts: async (_: unknown, { limit, cursor }: { limit?: number; cursor?: string }) => {
      return postService.getTrendingPosts(limit, cursor);
    },

    getUserPosts: async (
      _: unknown,
      { userId, limit, cursor }: { userId: string; limit?: number; cursor?: string }
    ) => {
      return postService.getUserPosts(userId, limit, cursor);
    },

    getUniverse: async (_: unknown, { id }: { id: string }) => {
      return universeService.getUniverse(id);
    },

    listUniverses: async (_: unknown, { limit, cursor }: { limit?: number; cursor?: string }) => {
      const result = await universeService.listUniverses(limit, cursor);
      return result.items;
    },
  },

  Mutation: {
    createPost: async (
      _: unknown,
      { content, mediaUrls }: { content: string; mediaUrls?: string[] },
      context: Context
    ) => {
      const userId = requireAuth(context);
      return postService.createPost(userId, { content, mediaUrls });
    },

    updatePost: async (
      _: unknown,
      { id, content }: { id: string; content: string },
      context: Context
    ) => {
      const userId = requireAuth(context);
      return postService.updatePost(id, userId, { content });
    },

    deletePost: async (_: unknown, { id }: { id: string }, context: Context) => {
      const userId = requireAuth(context);
      await postService.deletePost(id, userId);
      return true;
    },

    likePost: async (_: unknown, { postId }: { postId: string }, context: Context) => {
      const userId = requireAuth(context);
      return likeService.likePost(userId, postId);
    },

    unlikePost: async (_: unknown, { postId }: { postId: string }, context: Context) => {
      const userId = requireAuth(context);
      await likeService.unlikePost(userId, postId);
      return true;
    },

    createComment: async (
      _: unknown,
      { postId, content, parentId }: { postId: string; content: string; parentId?: string },
      context: Context
    ) => {
      const userId = requireAuth(context);
      return commentService.createComment(userId, { postId, content, parentId });
    },

    deleteComment: async (_: unknown, { id }: { id: string }, context: Context) => {
      const userId = requireAuth(context);
      await commentService.deleteComment(id, userId);
      return true;
    },

    followUser: async (
      _: unknown,
      { userId: targetId, followingType }: { userId: string; followingType?: string },
      context: Context
    ) => {
      const userId = requireAuth(context);
      return followService.followUser(userId, targetId, (followingType as 'human' | 'ai') || 'human');
    },

    unfollowUser: async (_: unknown, { userId: targetId }: { userId: string }, context: Context) => {
      const userId = requireAuth(context);
      await followService.unfollowUser(userId, targetId);
      return true;
    },

    acceptFollowRequest: async (
      _: unknown,
      { followerId }: { followerId: string },
      context: Context
    ) => {
      const userId = requireAuth(context);
      await followService.acceptFollowRequest(userId, followerId);
      return true;
    },

    updateProfile: async (
      _: unknown,
      data: {
        displayName?: string;
        bio?: string;
        avatar?: string;
        coverImage?: string;
        isPrivate?: boolean;
      },
      context: Context
    ) => {
      const userId = requireAuth(context);
      return userService.updateProfile(userId, data);
    },
  },
};
