import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Currency } from '@prisma/client';

const VALID_CURRENCIES = Object.values(Currency);

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        settings: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { settings, ...userData } = user;

    return {
      ...userData,
      settings: settings ?? {
        aiEnabled: true,
        notificationsEnabled: true,
        darkMode: true,
        language: user.languageCode ?? 'en',
        weeklyReport: true,
      },
    };
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { aiEnabled, notificationsEnabled, darkMode, language, weeklyReport, ...userFields } = dto;

    if (userFields.currency && !VALID_CURRENCIES.includes(userFields.currency as Currency)) {
      throw new BadRequestException(
        `Invalid currency. Valid: ${VALID_CURRENCIES.join(', ')}`,
      );
    }

    const settingsFields = { aiEnabled, notificationsEnabled, darkMode, language, weeklyReport };
    const hasSettingsFields = Object.values(settingsFields).some((v) => v !== undefined);

    const updateData: any = {};
    for (const [key, value] of Object.entries(userFields)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    if (hasSettingsFields) {
      const existingSettings = await this.prisma.userSettings.findUnique({
        where: { userId },
      });

      if (existingSettings) {
        await this.prisma.userSettings.update({
          where: { userId },
          data: settingsFields as any,
        });
      } else {
        await this.prisma.userSettings.create({
          data: {
            userId,
            aiEnabled: settingsFields.aiEnabled ?? true,
            notificationsEnabled: settingsFields.notificationsEnabled ?? true,
            darkMode: settingsFields.darkMode ?? true,
            language: settingsFields.language ?? 'en',
            weeklyReport: settingsFields.weeklyReport ?? true,
          },
        });
      }
    }

    return this.getProfile(userId);
  }

  async getStats(userId: string) {
    const [user, transactions, goals, achievements] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          streak: true,
          createdAt: true,
        },
      }),
      this.prisma.transaction.aggregate({
        where: { userId },
        _count: true,
        _sum: { amount: true },
      }),
      this.prisma.goal.count({
        where: { userId, status: 'COMPLETED' },
      }),
      this.prisma.userAchievement.count({
        where: { userId },
      }),
    ]);

    const incomeAgg = await this.prisma.transaction.aggregate({
      where: { userId, type: 'INCOME' },
      _sum: { amount: true },
    });

    const expenseAgg = await this.prisma.transaction.aggregate({
      where: { userId, type: 'EXPENSE' },
      _sum: { amount: true },
    });

    return {
      totalTransactions: transactions._count,
      totalIncome: incomeAgg._sum.amount ?? 0,
      totalExpenses: expenseAgg._sum.amount ?? 0,
      balance: (incomeAgg._sum.amount ?? 0) - (expenseAgg._sum.amount ?? 0),
      currentStreak: user?.streak ?? 0,
      goalsCompleted: goals,
      achievementsCount: achievements,
      memberSince: user?.createdAt,
    };
  }

  async getDashboard(userId: string) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const dayOfMonth = now.getDate();

    const [user, recentTransactions, budgets, goals, incomeAgg, expenseAgg] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          monthlyIncome: true,
          salaryDate: true,
          dailyLimit: true,
          firstName: true,
        },
      }),
      this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 5,
        include: { category: true },
      }),
      this.prisma.budget.findMany({
        where: {
          userId,
          month: currentMonth,
          year: currentYear,
        },
        include: { category: true },
      }),
      this.prisma.goal.findMany({
        where: { userId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      this.prisma.transaction.aggregate({
        where: { userId, type: 'INCOME' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = incomeAgg._sum.amount ?? 0;
    const totalExpenses = expenseAgg._sum.amount ?? 0;
    const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
    const totalSpent = totalExpenses;
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const daysLeft = daysInMonth - dayOfMonth;
    const remaining = totalBudget - totalSpent;
    const dailyLimit = daysLeft > 0 ? Math.max(0, remaining / daysLeft) : 0;

    const salaryDate = user?.salaryDate ?? 1;
    let daysUntilSalary = salaryDate - dayOfMonth;
    if (daysUntilSalary <= 0) {
      daysUntilSalary = daysInMonth - dayOfMonth + salaryDate;
    }

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 86400000);

    const todayExpenses = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: todayStart, lt: todayEnd },
      },
      _sum: { amount: true },
    });

    const userDailyLimit = user?.dailyLimit ?? null;
    const todaySpent = todayExpenses._sum.amount ?? 0;
    const dailyLimitRemaining = userDailyLimit
      ? Math.max(0, userDailyLimit - todaySpent)
      : null;

    const enrichedGoals = goals.map((g) => {
      const progress =
        g.targetAmount > 0
          ? Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100))
          : 0;
      return { ...g, progress };
    });

    return {
      profile: {
        name: user?.firstName ?? 'User',
        monthlyIncome: user?.monthlyIncome ?? 0,
        salaryDate: user?.salaryDate ?? null,
      },
      budgetOverview: {
        totalIncome,
        totalBudget,
        totalSpent,
        remaining: Math.max(0, remaining),
        dailyLimit: Math.round(dailyLimit * 100) / 100,
        daysUntilSalary,
      },
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        category: t.category?.name ?? 'Uncategorized',
        categoryIcon: t.category?.icon ?? 'help-circle',
        categoryColor: t.category?.color ?? '#6B7280',
        date: t.date,
      })),
      dailyLimitInfo: {
        limit: userDailyLimit,
        spent: todaySpent,
        remaining: dailyLimitRemaining,
      },
      activeGoals: enrichedGoals,
    };
  }
}
