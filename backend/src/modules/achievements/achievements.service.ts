import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { AchievementType } from '@prisma/client';

@Injectable()
export class AchievementsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllWithStatus(userId: string) {
    const [allAchievements, userAchievements] = await Promise.all([
      this.prisma.achievement.findMany({
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.userAchievement.findMany({
        where: { userId },
      }),
    ]);

    const unlockedMap = new Set(
      userAchievements.map((ua) => ua.achievement),
    );

    return allAchievements.map((a) => ({
      id: a.id,
      type: a.type,
      name: a.name,
      description: a.description,
      icon: a.icon,
      xpReward: a.xpReward,
      unlocked: unlockedMap.has(a.type),
      unlockedAt:
        userAchievements.find((ua) => ua.achievement === a.type)
          ?.unlockedAt ?? null,
    }));
  }

  async getUserAchievements(userId: string) {
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: {
        user: {
          select: { firstName: true, telegramUsername: true },
        },
      },
      orderBy: { unlockedAt: 'desc' },
    });

    const achievements = await this.prisma.achievement.findMany({
      where: {
        type: { in: userAchievements.map((ua) => ua.achievement) },
      },
    });

    const achievementMap = new Map(
      achievements.map((a) => [a.type, a]),
    );

    return userAchievements.map((ua) => {
      const def = achievementMap.get(ua.achievement);
      return {
        id: ua.id,
        type: ua.achievement,
        name: def?.name ?? ua.achievement,
        description: def?.description ?? '',
        icon: def?.icon ?? 'trophy',
        xpReward: def?.xpReward ?? 0,
        unlockedAt: ua.unlockedAt,
      };
    });
  }

  async checkAndUnlock(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        streak: true,
        xp: true,
        referralCount: true,
        createdAt: true,
      },
    });

    if (!user) return { unlocked: [] };

    const [transactionCount, savingsSum, goals, budgets, userAchievements] =
      await Promise.all([
        this.prisma.transaction.count({ where: { userId } }),
        this.prisma.transaction.aggregate({
          where: { userId, type: 'INCOME' },
          _sum: { amount: true },
        }),
        this.prisma.goal.findMany({
          where: { userId },
          select: { status: true },
        }),
        this.prisma.budget.findMany({
          where: { userId },
          select: { amount: true, spent: true },
        }),
        this.prisma.userAchievement.findMany({
          where: { userId },
          select: { achievement: true },
        }),
      ]);

    const unlockedSet = new Set(
      userAchievements.map((ua) => ua.achievement),
    );

    const totalIncome = savingsSum._sum.amount ?? 0;
    const completedGoals = goals.filter((g) => g.status === 'COMPLETED').length;
    const noOverrunMonth = budgets.every((b) => b.spent <= b.amount);

    const criteria: Array<{
      type: AchievementType;
      check: boolean;
    }> = [
      {
        type: 'STREAK_7',
        check: user.streak >= 7,
      },
      {
        type: 'STREAK_30',
        check: user.streak >= 30,
      },
      {
        type: 'FIRST_GOAL',
        check: completedGoals >= 1,
      },
      {
        type: 'SAVINGS_1000',
        check: totalIncome >= 1000,
      },
      {
        type: 'FIRST_SAVING',
        check: totalIncome > 0,
      },
      {
        type: 'NO_OVERRUN_MONTH',
        check: noOverrunMonth,
      },
      {
        type: 'BUDGET_MASTER',
        check: budgets.length >= 1,
      },
      {
        type: 'ANALYTICS_PRO',
        check: transactionCount >= 50,
      },
      {
        type: 'FINANCIAL_GURU',
        check: transactionCount >= 100,
      },
      {
        type: 'SHARING_SOCIAL',
        check: false,
      },
      {
        type: 'REFERRAL_5',
        check: user.referralCount >= 5,
      },
    ];

    const newUnlocks: Array<{
      type: AchievementType;
      xpReward: number;
    }> = [];

    for (const { type, check } of criteria) {
      if (check && !unlockedSet.has(type)) {
        const achievementDef = await this.prisma.achievement.findUnique({
          where: { type },
        });

        if (achievementDef) {
          await this.prisma.$transaction(async (tx) => {
            await tx.userAchievement.create({
              data: { userId, achievement: type },
            });

            await tx.user.update({
              where: { id: userId },
              data: { xp: { increment: achievementDef.xpReward } },
            });
          });

          newUnlocks.push({
            type,
            xpReward: achievementDef.xpReward,
          });
        }
      }
    }

    return {
      unlocked: newUnlocks.map((u) => ({
        type: u.type,
        xpReward: u.xpReward,
      })),
      totalNew: newUnlocks.length,
    };
  }
}
