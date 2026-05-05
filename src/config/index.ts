import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  database: {
    url: process.env.DATABASE_URL || '',
  },

  redis: {
    url: process.env.REDIS_URL || '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
    expiresIn: '30d',
    refreshExpiresIn: '90d',
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    serviceAccountBase64: process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 || '',
  },

  ai: {
    provider: (process.env.AI_PROVIDER || 'nvidia') as 'nvidia' | 'openai' | 'anthropic',
    nvidiaApiKey: process.env.NVIDIA_API_KEY || '',
    nvidiaBaseUrl: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    nvidiaModel: process.env.NVIDIA_MODEL || 'meta/llama-3.3-70b-instruct',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    defaultModel: process.env.AI_MODEL || 'meta/llama-3.3-70b-instruct',
    moderationModel: 'text-moderation-latest',
  },

  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3Bucket: process.env.AWS_S3_BUCKET || 'nexusai-media-dev',
    region: process.env.AWS_REGION || 'us-east-1',
    cdnBaseUrl: process.env.CDN_BASE_URL || 'http://localhost:3000/media',
  },

  revenueCat: {
    webhookSecret: process.env.REVENUECAT_WEBHOOK_SECRET || '',
  },

  flags: {
    allowStartWithoutDb: process.env.ALLOW_START_WITHOUT_DB === 'true',
  },

  energy: {
    free: { dailyAllowance: 15, maxBalance: 100 },
    premium: { dailyAllowance: 100, maxBalance: 500 },
    pro: { dailyAllowance: 9999, maxBalance: 9999 },
    costs: {
      dmMessage: 1,
      joinScenario: 3,
      unlockAiBackstory: 2,
      createAiCharacter: 10,
    },
    rewardedAdEnergy: 5,
    maxRewardedAdsPerDay: 3,
  },

  subscription: {
    tiers: {
      free: {
        dailyEnergyAllowance: 15,
        maxAICharacters: 0,
        multiplayerAccess: false,
        adFree: false,
        priorityAIResponse: false,
        customAIPersonality: false,
        advancedAnalytics: false,
      },
      premium: {
        dailyEnergyAllowance: 100,
        maxAICharacters: 3,
        multiplayerAccess: true,
        adFree: true,
        priorityAIResponse: false,
        customAIPersonality: true,
        advancedAnalytics: false,
      },
      pro: {
        dailyEnergyAllowance: 9999,
        maxAICharacters: 999,
        multiplayerAccess: true,
        adFree: true,
        priorityAIResponse: true,
        customAIPersonality: true,
        advancedAnalytics: true,
      },
    },
  },

  aiScheduler: {
    intervalMinutes: 5,
    behaviorWeights: {
      post: 0.4,
      like: 0.3,
      comment: 0.2,
      follow: 0.1,
    },
  },
} as const;
