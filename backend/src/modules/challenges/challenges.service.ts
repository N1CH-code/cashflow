import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ChallengesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamification: GamificationService,
    private readonly notifications: NotificationsService,
  ) {}

  async findAll(userId: string) {
    const [available, userChallenges] = await Promise.all([
      this.prisma.challenge.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
      }),
      this.prisma.userChallenge.findMany({
        where: { userId },
        include: { challenge: true },
      }),
    ]);

    const joinedIds = new Set(userChallenges.map((uc) => uc.challengeId));

    return {
      available: available.filter((c) => !joinedIds.has(c.id)),
      active: userChallenges
        .filter((uc) => !uc.completed)
        .map((uc) => ({
          ...uc.challenge,
          progress: uc.progress,
          startedAt: uc.startedAt,
        })),
      completed: userChallenges
        .filter((uc) => uc.completed)
        .map((uc) => ({
          ...uc.challenge,
          progress: 100,
          completedAt: uc.completedAt,
        })),
    };
  }

  async getActive(userId: string) {
    const userChallenges = await this.prisma.userChallenge.findMany({
      where: { userId, completed: false },
      include: { challenge: true },
    });

    return userChallenges.map((uc) => ({
      ...uc.challenge,
      progress: uc.progress,
      startedAt: uc.startedAt,
    }));
  }

  async joinChallenge(userId: string, challengeId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');

    const existing = await this.prisma.userChallenge.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });
    if (existing) throw new ConflictException('Already joined this challenge');

    const userChallenge = await this.prisma.userChallenge.create({
      data: { userId, challengeId },
    });

    return userChallenge;
  }

  async updateProgress(userId: string) {
    const activeChallenges = await this.prisma.userChallenge.findMany({
      where: { userId, completed: false },
      include: { challenge: true },
    });

    for (const uc of activeChallenges) {
      let progress = 0;
      const goal = uc.challenge.goal as Record<string, any>;

      switch (uc.challenge.type) {
        case 'SAVING_GOAL': {
          const totalIncome = await this.calculateTotalIncome(userId, goal);
          progress = Math.min(100, (totalIncome / (goal.amount || 1)) * 100);
          break;
        }
        case 'TRANSACTION_COUNT': {
          const count = await this.countTransactions(userId, goal);
          progress = Math.min(100, (count / (goal.transactions || 1)) * 100);
          break;
        }
        case 'STREAK': {
          const user = await this.prisma.user.findUnique({ where: { id: userId } });
          progress = Math.min(100, ((user?.streak || 0) / (goal.days || 1)) * 100);
          break;
        }
        default:
          progress = uc.progress;
      }

      if (progress >= 100 && !uc.completed) {
        await this.prisma.userChallenge.update({
          where: { id: uc.id },
          data: { progress: 100, completed: true, completedAt: new Date() },
        });
        await this.gamification.addXp(userId, uc.challenge.xpReward);
        await this.notifications.createNotification(
          userId,
          'ACHIEVEMENT_UNLOCKED',
          `Challenge Completed: ${uc.challenge.title}`,
          `You completed "${uc.challenge.title}" and earned ${uc.challenge.xpReward} XP!`,
          { challengeId: uc.challengeId, xpReward: uc.challenge.xpReward },
        );
      } else if (progress !== uc.progress) {
        await this.prisma.userChallenge.update({
          where: { id: uc.id },
          data: { progress },
        });
      }
    }
  }

  private async calculateTotalIncome(userId: string, goal: any): Promise<number> {
    const daysBack = goal.days || 30;
    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    const result = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: 'INCOME',
        date: { gte: since },
      },
      _sum: { amount: true },
    });
    return result._sum.amount || 0;
  }

  private async countTransactions(userId: string, goal: any): Promise<number> {
    const daysBack = goal.days || 7;
    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    return this.prisma.transaction.count({
      where: {
        userId,
        date: { gte: since },
      },
    });
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async autoCheckProgress() {
    const activeUserChallenges = await this.prisma.userChallenge.findMany({
      where: { completed: false },
      include: { challenge: true },
    });

    for (const uc of activeUserChallenges) {
      let progress = 0;
      const goal = uc.challenge.goal as Record<string, any>;

      switch (uc.challenge.type) {
        case 'SAVING_GOAL': {
          const totalIncome = await this.calculateTotalIncome(uc.userId, goal);
          progress = Math.min(100, (totalIncome / (goal.amount || 1)) * 100);
          break;
        }
        case 'TRANSACTION_COUNT': {
          const count = await this.countTransactions(uc.userId, goal);
          progress = Math.min(100, (count / (goal.transactions || 1)) * 100);
          break;
        }
        case 'STREAK': {
          const user = await this.prisma.user.findUnique({ where: { id: uc.userId } });
          progress = Math.min(100, ((user?.streak || 0) / (goal.days || 1)) * 100);
          break;
        }
      }

      if (progress >= 100 && !uc.completed) {
        await this.prisma.userChallenge.update({
          where: { id: uc.id },
          data: { progress: 100, completed: true, completedAt: new Date() },
        });
        await this.gamification.addXp(uc.userId, uc.challenge.xpReward);
        await this.notifications.createNotification(
          uc.userId,
          'ACHIEVEMENT_UNLOCKED',
          `Challenge Completed: ${uc.challenge.title}`,
          `You completed "${uc.challenge.title}" and earned ${uc.challenge.xpReward} XP!`,
          { challengeId: uc.challengeId, xpReward: uc.challenge.xpReward },
        );
      } else if (progress !== uc.progress) {
        await this.prisma.userChallenge.update({
          where: { id: uc.id },
          data: { progress },
        });
      }
    }
  }

  async seedChallenges() {
    const existing = await this.prisma.challenge.count();
    if (existing > 0) return { seeded: false, message: 'Challenges already exist' };

    const challenges = [
      {
        title: 'Track 7 Days',
        titleRu: '7 дней учёта',
        description: 'Record every transaction for 7 consecutive days',
        descriptionRu: 'Записывай каждую транзакцию 7 дней подряд',
        icon: 'calendar-check',
        type: 'TRANSACTION_COUNT',
        goal: { transactions: 21, days: 7 },
        xpReward: 100,
        sortOrder: 1,
      },
      {
        title: 'Save $100',
        titleRu: 'Накопи $100',
        description: 'Reach $100 in total income tracked',
        descriptionRu: 'Достигни $100 общего дохода',
        icon: 'piggy-bank',
        type: 'SAVING_GOAL',
        goal: { amount: 100, days: 30 },
        xpReward: 150,
        sortOrder: 2,
      },
      {
        title: '5-Day Streak',
        titleRu: '5 дней подряд',
        description: 'Log in and track expenses for 5 days in a row',
        descriptionRu: 'Записывай расходы 5 дней подряд',
        icon: 'flame',
        type: 'STREAK',
        goal: { days: 5 },
        xpReward: 75,
        sortOrder: 3,
      },
      {
        title: '50 Transactions',
        titleRu: '50 транзакций',
        description: 'Record 50 transactions total',
        descriptionRu: 'Запиши 50 транзакций всего',
        icon: 'list-checks',
        type: 'TRANSACTION_COUNT',
        goal: { transactions: 50 },
        xpReward: 200,
        sortOrder: 4,
      },
      {
        title: 'Save $500',
        titleRu: 'Накопи $500',
        description: 'Reach $500 in total income tracked',
        descriptionRu: 'Достигни $500 общего дохода',
        icon: 'banknote',
        type: 'SAVING_GOAL',
        goal: { amount: 500, days: 60 },
        xpReward: 300,
        sortOrder: 5,
      },
      {
        title: '30-Day Streak',
        titleRu: '30 дней подряд',
        description: 'Maintain daily activity for 30 days',
        descriptionRu: 'Сохраняй активность 30 дней подряд',
        icon: 'trophy',
        type: 'STREAK',
        goal: { days: 30 },
        xpReward: 500,
        sortOrder: 6,
      },
    ];

    for (const c of challenges) {
      await this.prisma.challenge.create({ data: c as any });
    }

    return { seeded: true, count: challenges.length };
  }
}
