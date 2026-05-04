import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { scenarioService } from '../services/scenario.service';
import { aiService } from '../services/ai.service';
import prisma from '../config/database';
import { AuthPayload } from '../types';

export function setupSocketIO(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      next(new Error('Authentication required'));
      return;
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload;
      (socket as Socket & { user: AuthPayload }).user = decoded;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as Socket & { user: AuthPayload }).user;
    console.log(`Socket connected: user=${user.userId}`);

    // Join user's personal room
    socket.join(`user:${user.userId}`);

    // === Scenario Events ===

    socket.on('scenario:join', async (data: { scenarioId: string }) => {
      try {
        await scenarioService.joinScenario(user.userId, data.scenarioId);
        socket.join(`scenario:${data.scenarioId}`);

        const userInfo = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { displayName: true, username: true },
        });

        io.to(`scenario:${data.scenarioId}`).emit('scenario:user-joined', {
          userId: user.userId,
          displayName: userInfo?.displayName,
          username: userInfo?.username,
        });
      } catch (err) {
        socket.emit('error', { message: (err as Error).message });
      }
    });

    socket.on('scenario:leave', async (data: { scenarioId: string }) => {
      try {
        await scenarioService.leaveScenario(user.userId, data.scenarioId);
        socket.leave(`scenario:${data.scenarioId}`);

        io.to(`scenario:${data.scenarioId}`).emit('scenario:user-left', {
          userId: user.userId,
        });
      } catch (err) {
        socket.emit('error', { message: (err as Error).message });
      }
    });

    socket.on(
      'scenario:action',
      async (data: { scenarioId: string; action: string; content: string }) => {
        try {
          const scenario = await scenarioService.getScenario(data.scenarioId);

          // Broadcast user's action
          io.to(`scenario:${data.scenarioId}`).emit(
            'scenario:action-broadcast',
            {
              userId: user.userId,
              action: data.action,
              content: data.content,
              timestamp: new Date(),
            }
          );

          // Generate AI responses from scenario characters
          for (const sc of scenario.characters) {
            const character = sc.aiCharacter;
            if (!character.isActive) continue;

            // Typing indicator
            io.to(`scenario:${data.scenarioId}`).emit('scenario:ai-typing', {
              aiCharacterId: character.id,
              displayName: character.displayName,
            });

            // Generate response (with delay for realism)
            setTimeout(async () => {
              try {
                const result = await aiService.generateDMReply(
                  character.id,
                  user.userId,
                  data.content,
                  [{ role: 'user', content: data.content }]
                );

                io.to(`scenario:${data.scenarioId}`).emit(
                  'scenario:ai-response',
                  {
                    aiCharacterId: character.id,
                    displayName: character.displayName,
                    content: result.content,
                    timestamp: new Date(),
                  }
                );
              } catch (err) {
                console.error(
                  `AI response failed in scenario for ${character.username}:`,
                  err
                );
              }
            }, Math.random() * 3000 + 1000); // 1-4 second delay
          }
        } catch (err) {
          socket.emit('error', { message: (err as Error).message });
        }
      }
    );

    // === Real-time notification channel ===
    socket.on('subscribe:notifications', () => {
      socket.join(`notifications:${user.userId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: user=${user.userId}`);
    });
  });

  return io;
}
