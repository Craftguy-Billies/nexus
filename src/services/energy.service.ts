import prisma from '../config/database';
import { config } from '../config';
import { InsufficientEnergyError, ValidationError } from '../utils/errors';
import { SubscriptionTier } from '@prisma/client';

export class EnergyService {
  async getBalance(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        energyBalance: true,
        energyLastRefreshedAt: true,
        gemsBalance: true,
        subscriptionTier: true,
      },
    });

    if (!user) throw new ValidationError('User not found');

    // Check if daily refresh is due
    const refreshedUser = await this.applyDailyRefresh(userId, user);

    return {
      energy: refreshedUser.energyBalance,
      gems: user.gemsBalance,
      tier: refreshedUser.subscriptionTier,
      lastRefreshed: refreshedUser.energyLastRefreshedAt,
    };
  }

  async consumeEnergy(
    userId: string,
    amount: number,
    reason: string
  ): Promise<{ success: boolean; remaining: number }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        energyBalance: true,
        subscriptionTier: true,
        energyLastRefreshedAt: true,
      },
    });

    if (!user) throw new ValidationError('User not found');

    // Pro users have unlimited energy
    if (user.subscriptionTier === 'pro') {
      return { success: true, remaining: 9999 };
    }

    // Apply daily refresh first
    const refreshed = await this.applyDailyRefresh(userId, user);

    if (refreshed.energyBalance < amount) {
      throw new InsufficientEnergyError(amount, refreshed.energyBalance);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { energyBalance: { decrement: amount } },
      select: { energyBalance: true },
    });

    // Also update inventory
    await prisma.userInventory.updateMany({
      where: { userId },
      data: { energyBalance: updated.energyBalance },
    });

    console.log(`Energy consumed: user=${userId}, amount=${amount}, reason=${reason}`);

    return { success: true, remaining: updated.energyBalance };
  }

  async addEnergy(
    userId: string,
    amount: number,
    source: string
  ): Promise<{ balance: number }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true },
    });

    if (!user) throw new ValidationError('User not found');

    const tiers = { free: config.energy.free, premium: config.energy.premium, pro: config.energy.pro };
    const tierConfig = tiers[user.subscriptionTier as keyof typeof tiers] || tiers.free;
    const maxBalance = tierConfig.maxBalance;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        energyBalance: { increment: amount },
      },
      select: { energyBalance: true },
    });

    // Cap at max
    if (updated.energyBalance > maxBalance) {
      await prisma.user.update({
        where: { id: userId },
        data: { energyBalance: maxBalance },
      });
      updated.energyBalance = maxBalance;
    }

    console.log(`Energy added: user=${userId}, amount=${amount}, source=${source}`);

    return { balance: updated.energyBalance };
  }

  async claimRewardedAd(userId: string): Promise<{ energyGranted: number; balance: number }> {
    // In production, verify ad completion with AppLovin MAX callback
    const energyGranted = config.energy.rewardedAdEnergy;
    const result = await this.addEnergy(userId, energyGranted, 'rewarded_ad');
    return { energyGranted, balance: result.balance };
  }

  async claimDailyStreak(userId: string): Promise<{
    streak: number;
    energyBonus: number;
    gemsBonus: number;
  }> {
    const inventory = await prisma.userInventory.findUnique({
      where: { userId },
    });

    if (!inventory) throw new ValidationError('Inventory not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastStreak = new Date(inventory.lastStreakDate);
    lastStreak.setHours(0, 0, 0, 0);

    const dayDiff = Math.floor(
      (today.getTime() - lastStreak.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayDiff === 0) {
      throw new ValidationError('Already claimed today');
    }

    const newStreak = dayDiff === 1 ? inventory.currentStreak + 1 : 1;
    const longestStreak = Math.max(newStreak, inventory.longestStreak);

    // Streak rewards
    let energyBonus = 5;
    let gemsBonus = 0;

    if (newStreak >= 7) {
      energyBonus = 50;
      gemsBonus = 10;
    } else if (newStreak >= 3) {
      energyBonus = 15;
      gemsBonus = 2;
    }

    await prisma.userInventory.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak,
        lastStreakDate: today,
      },
    });

    await this.addEnergy(userId, energyBonus, 'daily_streak');

    if (gemsBonus > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { gemsBalance: { increment: gemsBonus } },
      });
    }

    return { streak: newStreak, energyBonus, gemsBonus };
  }

  private async applyDailyRefresh(
    userId: string,
    user: {
      energyBalance: number;
      subscriptionTier: SubscriptionTier;
      energyLastRefreshedAt: Date;
    }
  ) {
    const now = new Date();
    const lastRefresh = new Date(user.energyLastRefreshedAt);
    const hoursSinceRefresh =
      (now.getTime() - lastRefresh.getTime()) / (1000 * 60 * 60);

    if (hoursSinceRefresh >= 24) {
      const tiers = { free: config.energy.free, premium: config.energy.premium, pro: config.energy.pro };
      const tierConfig = tiers[user.subscriptionTier as keyof typeof tiers] || tiers.free;
      const dailyAllowance = tierConfig.dailyAllowance;

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          energyBalance: Math.max(user.energyBalance, dailyAllowance),
          energyLastRefreshedAt: now,
        },
      });

      return { ...user, ...updated };
    }

    return user;
  }
}

export const energyService = new EnergyService();
