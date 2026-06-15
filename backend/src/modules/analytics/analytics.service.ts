import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(userId: string) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    const [monthlyTransactions, allTimeIncome, allTimeExpense, categories] =
      await Promise.all([
        this.prisma.transaction.findMany({
          where: {
            userId,
            date: { gte: monthStart, lte: monthEnd },
          },
          include: { category: true },
        }),
        this.prisma.transaction.aggregate({
          where: { userId, type: 'INCOME' },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: { userId, type: 'EXPENSE' },
          _sum: { amount: true },
        }),
        this.prisma.category.findMany({
          orderBy: { sortOrder: 'asc' },
        }),
      ]);

    const monthlyIncome = monthlyTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((s, t) => s + t.amount, 0);

    const monthlyExpense = monthlyTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((s, t) => s + t.amount, 0);

    const categoryTotals: Record<
      string,
      { categoryId: string; name: string; icon: string; color: string; amount: number; percentage: number }
    > = {};

    for (const cat of categories) {
      categoryTotals[cat.id] = {
        categoryId: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        amount: 0,
        percentage: 0,
      };
    }

    categoryTotals['__uncategorized__'] = {
      categoryId: '__uncategorized__',
      name: 'Uncategorized',
      icon: 'help-circle',
      color: '#6B7280',
      amount: 0,
      percentage: 0,
    };

    for (const t of monthlyTransactions) {
      if (t.type !== 'EXPENSE') continue;
      const key = t.categoryId ?? '__uncategorized__';
      if (!categoryTotals[key]) {
        categoryTotals[key] = {
          categoryId: key,
          name: t.category?.name ?? 'Uncategorized',
          icon: t.category?.icon ?? 'help-circle',
          color: t.category?.color ?? '#6B7280',
          amount: 0,
          percentage: 0,
        };
      }
      categoryTotals[key].amount += t.amount;
    }

    const topCategories = Object.values(categoryTotals)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((c) => ({
        ...c,
        percentage:
          monthlyExpense > 0
            ? Math.round((c.amount / monthlyExpense) * 100)
            : 0,
      }));

    const lastMonth = new Date(
      currentYear,
      currentMonth - 2,
      1,
    );
    const lastMonthStart = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth(),
      1,
    );
    const lastMonthEnd = new Date(
      lastMonth.getFullYear(),
      lastMonth.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const lastMonthExpense = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      _sum: { amount: true },
    });

    const previousExpense = lastMonthExpense._sum.amount ?? 0;
    const trend =
      previousExpense > 0
        ? Math.round(
            ((monthlyExpense - previousExpense) / previousExpense) * 100,
          )
        : 0;

    return {
      period: { month: currentMonth, year: currentYear },
      monthlyIncome: Math.round(monthlyIncome * 100) / 100,
      monthlyExpense: Math.round(monthlyExpense * 100) / 100,
      balance: Math.round((monthlyIncome - monthlyExpense) * 100) / 100,
      totalIncome: allTimeIncome._sum.amount ?? 0,
      totalExpense: allTimeExpense._sum.amount ?? 0,
      transactionCount: monthlyTransactions.length,
      topCategories,
      trend,
    };
  }

  async getMonthlyBreakdown(
    userId: string,
    month?: number,
    year?: number,
  ) {
    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();

    const monthStart = new Date(targetYear, targetMonth - 1, 1);
    const monthEnd = new Date(
      targetYear,
      targetMonth,
      0,
      23,
      59,
      59,
      999,
    );

    const [transactions, categories] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: monthStart, lte: monthEnd },
        },
        include: { category: true },
        orderBy: { date: 'asc' },
      }),
      this.prisma.category.findMany(),
    ]);

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const byCategory: Record<
      string,
      {
        categoryId: string;
        name: string;
        icon: string;
        color: string;
        income: number;
        expense: number;
        count: number;
        transactions: Array<{
          id: string;
          amount: number;
          description: string | null;
          date: Date;
          type: string;
        }>;
      }
    > = {};

    for (const t of transactions) {
      const key = t.categoryId ?? '__uncategorized__';
      if (!byCategory[key]) {
        const cat = t.categoryId ? categoryMap.get(t.categoryId) : null;
        byCategory[key] = {
          categoryId: t.categoryId ?? '',
          name: cat?.name ?? 'Uncategorized',
          icon: cat?.icon ?? 'help-circle',
          color: cat?.color ?? '#6B7280',
          income: 0,
          expense: 0,
          count: 0,
          transactions: [],
        };
      }
      if (t.type === 'INCOME') byCategory[key].income += t.amount;
      else byCategory[key].expense += t.amount;
      byCategory[key].count++;
      byCategory[key].transactions.push({
        id: t.id,
        amount: t.amount,
        description: t.description,
        date: t.date,
        type: t.type,
      });
    }

    const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
    const dailyBreakdown: Record<string, { date: string; income: number; expense: number }> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      dailyBreakdown[key] = { date: key, income: 0, expense: 0 };
    }

    for (const t of transactions) {
      const key = t.date.toISOString().slice(0, 10);
      if (dailyBreakdown[key]) {
        if (t.type === 'INCOME') dailyBreakdown[key].income += t.amount;
        else dailyBreakdown[key].expense += t.amount;
      }
    }

    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((s, t) => s + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((s, t) => s + t.amount, 0);

    return {
      month: targetMonth,
      year: targetYear,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpense: Math.round(totalExpense * 100) / 100,
      balance: Math.round((totalIncome - totalExpense) * 100) / 100,
      categories: Object.values(byCategory).map((c) => ({
        ...c,
        income: Math.round(c.income * 100) / 100,
        expense: Math.round(c.expense * 100) / 100,
      })),
      dailyBreakdown: Object.values(dailyBreakdown).map((d) => ({
        ...d,
        income: Math.round(d.income * 100) / 100,
        expense: Math.round(d.expense * 100) / 100,
      })),
    };
  }

  async getTrends(userId: string, months: number) {
    const now = new Date();
    const trends: Array<{
      month: number;
      year: number;
      income: number;
      expense: number;
    }> = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
        999,
      );

      const [income, expense] = await Promise.all([
        this.prisma.transaction.aggregate({
          where: {
            userId,
            type: 'INCOME',
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: {
            userId,
            type: 'EXPENSE',
            date: { gte: monthStart, lte: monthEnd },
          },
          _sum: { amount: true },
        }),
      ]);

      trends.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        income: Math.round((income._sum.amount ?? 0) * 100) / 100,
        expense: Math.round((expense._sum.amount ?? 0) * 100) / 100,
      });
    }

    const avgIncome =
      trends.reduce((s, t) => s + t.income, 0) / trends.length;
    const avgExpense =
      trends.reduce((s, t) => s + t.expense, 0) / trends.length;

    return {
      trends,
      averages: {
        monthlyIncome: Math.round(avgIncome * 100) / 100,
        monthlyExpense: Math.round(avgExpense * 100) / 100,
      },
    };
  }

  async getIncomeVsExpenses(userId: string, months: number) {
    const trends = await this.getTrends(userId, months);

    return {
      data: trends.trends.map((t) => ({
        month: t.month,
        year: t.year,
        income: t.income,
        expenses: t.expense,
        balance: Math.round((t.income - t.expense) * 100) / 100,
      })),
    };
  }

  async getCategoryComparison(
    userId: string,
    month?: number,
    year?: number,
  ) {
    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();

    const monthStart = new Date(targetYear, targetMonth - 1, 1);
    const monthEnd = new Date(
      targetYear,
      targetMonth,
      0,
      23,
      59,
      59,
      999,
    );

    const [transactions, categories] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: monthStart, lte: monthEnd },
          type: 'EXPENSE',
        },
        include: { category: true },
      }),
      this.prisma.category.findMany({
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const comparison: Record<
      string,
      {
        categoryId: string;
        name: string;
        icon: string;
        color: string;
        amount: number;
        percentage: number;
        transactionCount: number;
      }
    > = {};

    for (const cat of categories) {
      comparison[cat.id] = {
        categoryId: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        amount: 0,
        percentage: 0,
        transactionCount: 0,
      };
    }

    const totalExpense = transactions.reduce((s, t) => s + t.amount, 0);

    for (const t of transactions) {
      const key = t.categoryId ?? '__uncategorized__';
      if (!comparison[key]) {
        comparison[key] = {
          categoryId: t.categoryId ?? '',
          name: t.category?.name ?? 'Uncategorized',
          icon: t.category?.icon ?? 'help-circle',
          color: t.category?.color ?? '#6B7280',
          amount: 0,
          percentage: 0,
          transactionCount: 0,
        };
      }
      comparison[key].amount += t.amount;
      comparison[key].transactionCount++;
    }

    return {
      month: targetMonth,
      year: targetYear,
      totalExpense: Math.round(totalExpense * 100) / 100,
      categories: Object.values(comparison)
        .sort((a, b) => b.amount - a.amount)
        .map((c) => ({
          ...c,
          amount: Math.round(c.amount * 100) / 100,
          percentage:
            totalExpense > 0
              ? Math.round((c.amount / totalExpense) * 100)
              : 0,
        })),
    };
  }
}
