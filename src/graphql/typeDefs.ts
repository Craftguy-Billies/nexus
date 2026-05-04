import gql from 'graphql-tag';

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  type User {
    id: ID!
    username: String!
    email: String!
    displayName: String!
    bio: String
    avatar: String
    coverImage: String
    followerCount: Int!
    followingCount: Int!
    postCount: Int!
    isPrivate: Boolean!
    isVerified: Boolean!
    isPremium: Boolean!
    subscriptionTier: SubscriptionTier!
    energyBalance: Int!
    gemsBalance: Int!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    posts(limit: Int, cursor: String): PostConnection
    subscription: UserSubscription
  }

  type AICharacter {
    id: ID!
    username: String!
    displayName: String!
    avatar: String!
    bio: String!
    persona: String!
    interests: [String!]!
    expertise: [String!]!
    universeId: ID
    universe: Universe
    personalityProfile: JSON!
    responseStyle: JSON!
    activitySchedule: JSON!
    followerCount: Int!
    followingCount: Int!
    totalPosts: Int!
    monthlyTokenBudget: Int!
    currentMonthTokens: Int!
    isActive: Boolean!
    isPublic: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    lastInteractionAt: DateTime
    posts(limit: Int, cursor: String): PostConnection
  }

  type Post {
    id: ID!
    content: String!
    mediaUrls: [String!]!
    authorId: ID!
    authorType: AuthorType!
    humanAuthor: User
    aiAuthor: AICharacter
    isAI: Boolean!
    isEdited: Boolean!
    isPinned: Boolean!
    likesCount: Int!
    commentsCount: Int!
    sharesCount: Int!
    viewsCount: Int!
    tags: [String!]!
    mentions: [String!]!
    moderationStatus: ModerationStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
    comments(limit: Int, cursor: String): CommentConnection
    isLikedByCurrentUser: Boolean
  }

  type Comment {
    id: ID!
    postId: ID!
    authorId: ID!
    authorType: AuthorType!
    isAI: Boolean!
    content: String!
    parentId: ID
    replies: [Comment!]
    likesCount: Int!
    isEdited: Boolean!
    createdAt: DateTime!
  }

  type Like {
    id: ID!
    postId: ID!
    authorId: ID!
    authorType: AuthorType!
    isAI: Boolean!
    createdAt: DateTime!
  }

  type Follow {
    id: ID!
    followerId: ID!
    followerType: AuthorType!
    followingId: ID!
    followingType: AuthorType!
    status: FollowStatus!
    createdAt: DateTime!
  }

  type Universe {
    id: ID!
    name: String!
    description: String!
    coverImage: String!
    lore: String!
    rules: [String!]!
    memberCount: Int!
    aiCharacterCount: Int!
    trendingScore: Float!
    isOfficial: Boolean!
    tags: [String!]!
    createdAt: DateTime!
    aiCharacters(limit: Int, cursor: String): AICharacterConnection
  }

  type UserSubscription {
    id: ID!
    userId: ID!
    tier: SubscriptionTier!
    status: SubscriptionStatus!
    startedAt: DateTime!
    expiresAt: DateTime
    willRenew: Boolean!
    features: JSON!
    createdAt: DateTime!
  }

  # Connection types for pagination
  type PostConnection {
    items: [Post!]!
    nextToken: String
    total: Int
  }

  type CommentConnection {
    items: [Comment!]!
    nextToken: String
  }

  type AICharacterConnection {
    items: [AICharacter!]!
    nextToken: String
  }

  # Enums
  enum AuthorType {
    human
    ai
  }

  enum SubscriptionTier {
    free
    premium
    pro
  }

  enum SubscriptionStatus {
    active
    cancelled
    expired
    grace_period
  }

  enum ModerationStatus {
    pending
    approved
    rejected
    flagged
  }

  enum FollowStatus {
    active
    pending
    blocked
  }

  enum FeedType {
    home
    discover
    following
  }

  # Queries
  type Query {
    getUser(id: ID!): User
    getUserByUsername(username: String!): User
    searchUsers(query: String!, limit: Int): [User!]!

    getAICharacter(id: ID!): AICharacter
    listAICharacters(
      universeId: ID
      isActive: Boolean
      limit: Int
      cursor: String
    ): AICharacterConnection!
    searchAICharacters(query: String!, limit: Int): [AICharacter!]!

    getPost(id: ID!): Post
    getFeed(
      feedType: FeedType!
      limit: Int
      cursor: String
    ): PostConnection!
    getTrendingPosts(limit: Int, cursor: String): PostConnection!
    getUserPosts(userId: ID!, limit: Int, cursor: String): PostConnection!

    getUniverse(id: ID!): Universe
    listUniverses(limit: Int, cursor: String): [Universe!]!

    me: User
  }

  # Mutations
  type Mutation {
    createPost(content: String!, mediaUrls: [String!]): Post!
    updatePost(id: ID!, content: String!): Post!
    deletePost(id: ID!): Boolean!

    likePost(postId: ID!): Like!
    unlikePost(postId: ID!): Boolean!

    createComment(postId: ID!, content: String!, parentId: ID): Comment!
    deleteComment(id: ID!): Boolean!

    followUser(userId: ID!, followingType: AuthorType): Follow!
    unfollowUser(userId: ID!): Boolean!
    acceptFollowRequest(followerId: ID!): Boolean!

    updateProfile(
      displayName: String
      bio: String
      avatar: String
      coverImage: String
      isPrivate: Boolean
    ): User!
  }
`;
