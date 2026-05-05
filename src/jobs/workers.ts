import { Worker, Job } from 'bullmq';
import { config } from '../config';
import prisma from '../config/database';
import { aiService } from '../services/ai.service';
import { postService } from '../services/post.service';
import { commentService } from '../services/comment.service';
import { likeService } from '../services/like.service';
import { followService } from '../services/follow.service';
import { tokenUsageTracker } from '../services/tokenUsage.service';
import { notificationService } from '../services/notification.service';
import { ActivitySchedule } from '../types';
import { getRedis, isRedisConfigured } from '../config/redis';

/**
 * AI Reaction Worker
 * Processes AI reactions to user posts (likes, comments, follows)
 */
export function startAIReactionWorker() {
  const worker = new Worker(
    'ai-reactions',
    async (job: Job) => {
      const { postId, userId, content } = job.data;

      // Get a few random active AI characters
      const aiCharacters = await prisma.aICharacter.findMany({
        where: { isActive: true, isPublic: true },
        take: 5,
        orderBy: { lastInteractionAt: 'desc' },
      });

      for (const character of aiCharacters) {
        // Check budget
        const budget = await tokenUsageTracker.checkBudget(character.id);
        if (!budget.withinBudget) continue;

        // Random behavior selection based on weights
        const rand = Math.random();
        const { like, comment, follow } = config.aiScheduler.behaviorWeights;

        if (rand < like) {
          // Like the post
          const shouldLike = await aiService.decideLikeAction(
            character.id,
            content
          );
          if (shouldLike) {
            try {
              await likeService.createAILike(character.id, postId);
              await notificationService.createNotification(
                userId,
                'ai_interaction',
                `${character.displayName} liked your post`,
                'Your post got a like!',
                { type: 'like', postId, aiCharacterId: character.id }
              );
            } catch {
              // Already liked or other error
            }
          }
        } else if (rand < like + comment) {
          // Comment on the post
          try {
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: { username: true },
            });
            const result = await aiService.generateComment(
              character.id,
              content,
              user?.username || 'someone'
            );
            await commentService.createAIComment(
              character.id,
              postId,
              result.content
            );
            await notificationService.createNotification(
              userId,
              'new_comment',
              `${character.displayName} commented on your post`,
              result.content.slice(0, 100),
              { type: 'comment', postId, aiCharacterId: character.id }
            );
          } catch (err) {
            console.error('AI comment generation failed:', err);
          }
        } else if (rand < like + comment + follow) {
          // Follow the user
          try {
            await followService.createAIFollow(character.id, userId);
            await notificationService.createNotification(
              userId,
              'new_follower',
              `${character.displayName} started following you`,
              'You have a new follower!',
              { type: 'follow', aiCharacterId: character.id }
            );
          } catch {
            // Already following
          }
        }

        // Update relationship
        await aiService.updateRelationship(character.id, userId, 'positive');
      }
    },
    { connection: getRedis(), concurrency: 5 }
  );

  worker.on('completed', (job) => {
    console.log(`AI reaction job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`AI reaction job ${job?.id} failed:`, err.message);
  });

  return worker;
}

/**
 * AI Scheduler Worker
 * Runs every 5 minutes to trigger autonomous AI behaviors
 */
export function startAISchedulerWorker() {
  const worker = new Worker(
    'ai-scheduler',
    async (job: Job) => {
      console.log(`Running AI scheduler job ${job.id}`);

      const characters = await prisma.aICharacter.findMany({
        where: {
          isActive: true,
          isPublic: true,
        },
        include: { universe: true },
      });

      for (const character of characters) {
        // Check budget
        const budget = await tokenUsageTracker.checkBudget(character.id);
        if (!budget.withinBudget) {
          // Deactivate if budget exhausted
          await prisma.aICharacter.update({
            where: { id: character.id },
            data: { isActive: false },
          });
          continue;
        }

        const schedule = character.activitySchedule as unknown as ActivitySchedule;
        const currentHour = new Date().getHours();

        // Check if in peak activity hours
        if (!schedule.peakActivityHours.includes(currentHour)) continue;

        // Probability check
        if (Math.random() > schedule.interactionProbability) continue;

        // Random behavior
        const rand = Math.random();

        if (rand < config.aiScheduler.behaviorWeights.post) {
          // Generate a post
          try {
            const result = await aiService.generatePost(character.id);
            await postService.createAIPost(character.id, result.content, {
              model: result.model,
              promptTokens: result.promptTokens,
              completionTokens: result.completionTokens,
              generationTrigger: 'scheduled',
            });
            console.log(`AI ${character.username} created a post`);
          } catch (err) {
            console.error(`AI post generation failed for ${character.username}:`, err);
          }
        } else if (rand < config.aiScheduler.behaviorWeights.post + config.aiScheduler.behaviorWeights.like) {
          // Like a recent post
          const recentPost = await prisma.post.findFirst({
            where: {
              isArchived: false,
              moderationStatus: 'approved',
              authorId: { not: character.id },
              createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
            orderBy: { createdAt: 'desc' },
          });

          if (recentPost) {
            try {
              await likeService.createAILike(character.id, recentPost.id);
            } catch {
              // Already liked
            }
          }
        } else if (
          rand <
          config.aiScheduler.behaviorWeights.post +
            config.aiScheduler.behaviorWeights.like +
            config.aiScheduler.behaviorWeights.comment
        ) {
          // Comment on a recent post
          const recentPost = await prisma.post.findFirst({
            where: {
              isArchived: false,
              moderationStatus: 'approved',
              authorId: { not: character.id },
              createdAt: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) },
            },
            orderBy: { likesCount: 'desc' },
          });

          if (recentPost) {
            try {
              const result = await aiService.generateComment(
                character.id,
                recentPost.content,
                'user'
              );
              await commentService.createAIComment(
                character.id,
                recentPost.id,
                result.content
              );
            } catch (err) {
              console.error(`AI comment failed for ${character.username}:`, err);
            }
          }
        }
      }
    },
    { connection: getRedis(), concurrency: 1 }
  );

  worker.on('completed', (job) => {
    console.log(`AI scheduler job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`AI scheduler job ${job?.id} failed:`, err.message);
  });

  return worker;
}

/**
 * Start all workers
 */
export function startAllWorkers() {
  if (!isRedisConfigured()) {
    console.warn('REDIS_URL not configured — BullMQ workers disabled');
    return null;
  }

  try {
    const reactionWorker = startAIReactionWorker();
    const schedulerWorker = startAISchedulerWorker();
    console.log('All BullMQ workers started');
    return { reactionWorker, schedulerWorker };
  } catch (err) {
    console.warn('Failed to start workers (Redis may not be available):', err);
    return null;
  }
}
