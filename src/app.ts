import express, { Request } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import jwt from 'jsonwebtoken';

import { config } from './config';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';
import { AuthPayload } from './types';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import postRoutes from './routes/post.routes';
import feedRoutes from './routes/feed.routes';
import followRoutes from './routes/follow.routes';
import aiRoutes from './routes/ai.routes';
import dmRoutes from './routes/dm.routes';
import energyRoutes from './routes/energy.routes';
import subscriptionRoutes from './routes/subscription.routes';
import notificationRoutes from './routes/notification.routes';
import mediaRoutes from './routes/media.routes';
import universeRoutes from './routes/universe.routes';
import scenarioRoutes from './routes/scenario.routes';
import adminRoutes from './routes/admin.routes';

// Socket.io
import { setupSocketIO } from './socket';

export async function createApp() {
  const app = express();
  const httpServer = http.createServer(app);

  // Middleware
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(morgan('dev'));
  app.use(generalLimiter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      service: 'nexus-ai-backend',
      config: {
        env: config.env,
        aiProvider: config.ai.provider,
        aiModel: config.ai.defaultModel,
      },
      dependencies: {
        databaseConfigured: Boolean(config.database.url),
        redisConfigured: Boolean(config.redis.url),
        firebaseConfigured: Boolean(config.firebase.serviceAccountBase64),
      },
    });
  });

  // REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/posts', postRoutes);
  app.use('/api/feed', feedRoutes);
  app.use('/api/follow', followRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/dm', dmRoutes);
  app.use('/api/energy', energyRoutes);
  app.use('/api/subscriptions', subscriptionRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/universes', universeRoutes);
  app.use('/api/scenarios', scenarioRoutes);
  app.use('/api/admin', adminRoutes);

  // GraphQL Setup
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await apolloServer.start();

  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: async ({ req }: { req: Request }) => {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.split(' ')[1];
          try {
            const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
            return { user: decoded };
          } catch {
            return {};
          }
        }
        return {};
      },
    })
  );

  // Socket.io
  const io = setupSocketIO(httpServer);

  // Error handler (must be last)
  app.use(errorHandler);

  return { app, httpServer, io, apolloServer };
}
