import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma.service';

export const LEVEL_DEFINITIONS = [
  { level: 1, title: 'Novice', xpRequired: 0 },
  { level: 2, title: 'Controller', xpRequired: 100 },
  { level: 3, title: 'Economist', xpRequired: 300 },
  { level: 4, title: 'Strategist', xpRequired: 600 },
  { level: 5, title: 'Investor', xpRequired: 1000 },
  { level: 6, title: 'Financial Master', xpRequired: 2000 },
  { level: 7, title: 'Wealth Guardian', xpRequired: 3500 },
  { level: 8, title: 'Money Sage', xpRequired: 5000 },
  { level: 9, title: 'Prosperity Legend', xpRequired: 7500 },
  { level: 10, title: 'CashFlow King', xpRequired: 10000 },
];

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        xp: true,
        level: true,
        streak: true,
        createdAt: true,
      },
    });

    if (!user) {
      return this.emptyProfile();
    }

    const currentLevelDef = LEVEL_DEFINITIONS.find(
      (l) => l.level === user.level,
    ) ?? LEVEL_DEFINITIONS[0];

    const nextLevelDef = LEVEL_DEFINITIONS.find(
      (l) => l.level === user.level + 1,
    );

    const currentXp = user.xp;
    const currentThreshold = currentLevelDef.xpRequired;
    const nextThreshold = nextLevelDef?.xpRequired ?? currentThreshold;

    const xpInLevel = currentXp - currentThreshold;
    const xpRequiredForNext = nextThreshold - currentThreshold;
    const progress =
      xpRequiredForNext > 0
        ? Math.min(100, Math.round((xpInLevel / xpRequiredForNext) * 100))
        : 100;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTransactions = await this.prisma.transaction.count({
      where: {
        userId,
        date: { gte: today },
      },
    });

    return {
      level: user.level,
      title: currentLevelDef.title,
      xp: user.xp,
      xpToNextLevel: nextLevelDef
        ? Math.max(0, nextThreshold - currentXp)
        : 0,
      progress,
      streak: user.streak,
      todayLogged: todayTransactions > 0,
      nextLevel: nextLevelDef
        ? { level: nextLevelDef.level, title: nextLevelDef.title }
        : null,
    };
  }

  getLevels() {
    return LEVEL_DEFINITIONS.map((l) => ({
      level: l.level,
      title: l.title,
      xpRequired: l.xpRequired,
    }));
  }

  async addXp(userId: string, amount: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true, level: true },
    });

    if (!user) return;

    const newXp = user.xp + amount;
    let newLevel = user.level;

    for (let i = LEVEL_DEFINITIONS.length - 1; i >= 0; i--) {
      if (newXp >= LEVEL_DEFINITIONS[i].xpRequired) {
        newLevel = LEVEL_DEFINITIONS[i].level;
        break;
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { xp: newXp, level: newLevel },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async autoUpdateStreaks() {
    const users = await this.prisma.user.findMany({ select: { id: true } });
    for (const user of users) {
      await this.updateStreak(user.id);
    }
  }

  async updateStreak(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true },
    });

    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastTransaction = await this.prisma.transaction.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    if (!lastTransaction) return;

    const lastDate = new Date(lastTransaction.date);
    lastDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) {
      return;
    }

    if (diffDays === 1) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { streak: { increment: 1 } },
      });
    } else {
      await this.prisma.user.update({
        where: { id: userId },
        data: { streak: 1 },
      });
    }
  }

  private emptyProfile() {
    return {
      level: 1,
      title: 'Novice',
      xp: 0,
      xpToNextLevel: 100,
      progress: 0,
      streak: 0,
      todayLogged: false,
      nextLevel: { level: 2, title: 'Controller' },
    };
  }
}
