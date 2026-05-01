import prisma from '../config/database';
import { config } from '../config';
import { NotFoundError, ValidationError } from '../utils/errors';
import { SubscriptionTier } from '@prisma/client';

export class SubscriptionService {
  async getSubscription(userId: string) {
    const sub = await prisma.userSubscription.findUnique({
      where: { userId },
    });
    if (!sub) throw new NotFoundError('Subscription not found');
    return sub;
  }

  async updateSubscription(
    userId: string,
    tier: SubscriptionTier,
    revenueCatData?: {
      customerId: string;
      entitlementId: string;
      expiresAt: Date;
      willRenew: boolean;
    }
  ) {
    const features =
      config.subscription.tiers[tier as keyof typeof config.subscription.tiers];

    const sub = await prisma.userSubscription.upsert({
      where: { userId },
      update: {
        tier,
        status: 'active',
        revenueCatCustomerId: revenueCatData?.customerId,
        revenueCatEntitlementId: revenueCatData?.entitlementId,
        expiresAt: revenueCatData?.expiresAt,
        willRenew: revenueCatData?.willRenew ?? false,
        features,
      },
      create: {
        userId,
        tier,
        status: 'active',
        revenueCatCustomerId: revenueCatData?.customerId,
        revenueCatEntitlementId: revenueCatData?.entitlementId,
        expiresAt: revenueCatData?.expiresAt,
        willRenew: revenueCatData?.willRenew ?? false,
        features,
      },
    });

    // Update user flags
    await prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: tier !== 'free',
        subscriptionTier: tier,
      },
    });

    return sub;
  }

  async cancelSubscription(userId: string) {
    const sub = await prisma.userSubscription.findUnique({
      where: { userId },
    });
    if (!sub) throw new NotFoundError('Subscription not found');

    await prisma.userSubscription.update({
      where: { userId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        willRenew: false,
      },
    });

    // Don't immediately downgrade - let it expire
    return { message: 'Subscription cancelled. Access continues until expiry.' };
  }

  async handleRevenueCatWebhook(event: {
    type: string;
    app_user_id: string;
    product_id: string;
    expiration_at_ms?: number;
  }) {
    const userId = event.app_user_id;

    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL': {
        const tier = this.productIdToTier(event.product_id);
        await this.updateSubscription(userId, tier, {
          customerId: userId,
          entitlementId: event.product_id,
          expiresAt: event.expiration_at_ms
            ? new Date(event.expiration_at_ms)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          willRenew: true,
        });
        break;
      }

      case 'CANCELLATION':
        await this.cancelSubscription(userId);
        break;

      case 'EXPIRATION':
        await this.updateSubscription(userId, 'free');
        break;

      case 'BILLING_ISSUE':
        await prisma.userSubscription.updateMany({
          where: { userId },
          data: { status: 'grace_period' },
        });
        break;

      default:
        console.log(`Unhandled RevenueCat event: ${event.type}`);
    }
  }

  async checkFeature(
    userId: string,
    feature: keyof typeof config.subscription.tiers.free
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });
    if (!user) throw new NotFoundError('User not found');

    const tierKey = user.subscriptionTier as keyof typeof config.subscription.tiers;
    const tierFeatures = config.subscription.tiers[tierKey];
    const value = tierFeatures[feature];

    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    return false;
  }

  async getAICharacterLimit(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });
    if (!user) throw new NotFoundError('User not found');

    const tierKey = user.subscriptionTier as keyof typeof config.subscription.tiers;
    return config.subscription.tiers[tierKey].maxAICharacters;
  }

  private productIdToTier(productId: string): SubscriptionTier {
    if (productId.includes('pro')) return 'pro';
    if (productId.includes('premium')) return 'premium';
    return 'free';
  }
}

export const subscriptionService = new SubscriptionService();
