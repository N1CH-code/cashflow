import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionType, TransactionSource } from '@prisma/client';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { endOfDay, startOfDay, parseISO } from 'date-fns';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransactionDto) {
    const date = dto.date ? parseISO(dto.date) : new Date();
    const source = dto.source ?? TransactionSource.MANUAL;

    let categoryId: string | null | undefined = dto.categoryId;

    if (!categoryId && dto.description) {
      categoryId = await this.detectCategory(dto.description);
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        type: dto.type,
        amount: dto.amount,
        currency: dto.currency,
        categoryId: categoryId ?? null,
        description: dto.description ?? null,
        note: dto.note ?? null,
        date,
        source,
      },
      include: {
        category: true,
      },
    });

    await this.updateUserDailyLimit(userId, dto.type, dto.amount);
    await this.updateBudgetSpent(userId, dto.type, dto.amount, categoryId ?? null, date);

    return transaction;
  }

  async findAll(userId: string, query: QueryTransactionDto) {
    const { page = 1, limit = 20, startDate, endDate, categoryId, type, search } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startOfDay(parseISO(startDate));
      if (endDate) where.date.lte = endOfDay(parseISO(endDate));
    }

    if (categoryId) where.categoryId = categoryId;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { note: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: { category: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const existing = await this.findOne(userId, id);

    const oldType = existing.type;
    const oldAmount = existing.amount;
    const oldCategoryId = existing.categoryId;

    const date = dto.date ? parseISO(dto.date) : existing.date;

    const updateData: any = {};
    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.amount !== undefined) updateData.amount = dto.amount;
    if (dto.currency !== undefined) updateData.currency = dto.currency;
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.note !== undefined) updateData.note = dto.note;
    if (dto.date !== undefined) updateData.date = date;
    if (dto.source !== undefined) updateData.source = dto.source;

    if (updateData.description && !updateData.categoryId && !dto.categoryId) {
      const detected = await this.detectCategory(updateData.description);
      if (detected) updateData.categoryId = detected;
    }

    const transaction = await this.prisma.transaction.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    await this.revertDailyLimit(userId, oldType, oldAmount);
    await this.updateUserDailyLimit(userId, transaction.type, transaction.amount);

    await this.revertBudgetSpent(userId, oldType, oldAmount, oldCategoryId, existing.date);
    await this.updateBudgetSpent(userId, transaction.type, transaction.amount, transaction.categoryId, transaction.date);

    return transaction;
  }

  async remove(userId: string, id: string) {
    const existing = await this.findOne(userId, id);

    await this.prisma.transaction.delete({ where: { id } });

    await this.revertDailyLimit(userId, existing.type, existing.amount);
    await this.revertBudgetSpent(userId, existing.type, existing.amount, existing.categoryId, existing.date);

    return { id };
  }

  async getStats(userId: string, startDate?: string, endDate?: string) {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.gte = startOfDay(parseISO(startDate));
      if (endDate) dateFilter.date.lte = endOfDay(parseISO(endDate));
    }

    const transactions = await this.prisma.transaction.findMany({
      where: { userId, ...dateFilter },
      include: { category: true },
      orderBy: { date: 'asc' },
    });

    const totalIncome = transactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    const byCategory: Record<string, { category: string; income: number; expense: number; count: number }> = {};
    for (const t of transactions) {
      const key = t.categoryId || '__uncategorized__';
      if (!byCategory[key]) {
        byCategory[key] = {
          category: t.category?.name ?? 'Uncategorized',
          income: 0,
          expense: 0,
          count: 0,
        };
      }
      if (t.type === TransactionType.INCOME) byCategory[key].income += t.amount;
      else byCategory[key].expense += t.amount;
      byCategory[key].count++;
    }

    const byDay: Record<string, { date: string; income: number; expense: number; count: number }> = {};
    for (const t of transactions) {
      const dayKey = t.date.toISOString().slice(0, 10);
      if (!byDay[dayKey]) {
        byDay[dayKey] = { date: dayKey, income: 0, expense: 0, count: 0 };
      }
      if (t.type === TransactionType.INCOME) byDay[dayKey].income += t.amount;
      else byDay[dayKey].expense += t.amount;
      byDay[dayKey].count++;
    }

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      totalTransactions: transactions.length,
      byCategory: Object.values(byCategory),
      byDay: Object.values(byDay),
    };
  }

  private async detectCategory(description: string): Promise<string | null> {
    const categories = await this.prisma.category.findMany({
      where: { keywords: { not: null } },
      select: { id: true, keywords: true },
    });

    const lower = description.toLowerCase();

    for (const cat of categories) {
      if (!cat.keywords) continue;
      const keywords: string[] = Array.isArray(cat.keywords)
        ? cat.keywords
        : (cat.keywords as string).split(',').map((k: string) => k.trim().toLowerCase());

      for (const keyword of keywords) {
        if (keyword && lower.includes(keyword)) {
          return cat.id;
        }
      }
    }

    return null;
  }

  private async updateUserDailyLimit(userId: string, type: TransactionType, amount: number) {
    if (type !== TransactionType.EXPENSE) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayExpenses = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        date: { gte: today, lt: tomorrow },
      },
      _sum: { amount: true },
    });

    const totalSpentToday = (todayExpenses._sum.amount ?? 0) + amount;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { dailyLimit: true },
    });

    if (user?.dailyLimit && totalSpentToday > user.dailyLimit) {
      // daily limit exceeded — could emit an event or log
    }
  }

  private async revertDailyLimit(userId: string, type: TransactionType, amount: number) {
    // no persistent state to revert; daily limit is calculated live
  }

  private async updateBudgetSpent(
    userId: string,
    type: TransactionType,
    amount: number,
    categoryId: string | null,
    date: Date,
  ) {
    if (type !== TransactionType.EXPENSE || !categoryId) return;

    const now = new Date(date);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        categoryId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    for (const budget of budgets) {
      const spent = await this.prisma.transaction.aggregate({
        where: {
          userId,
          type: TransactionType.EXPENSE,
          categoryId,
          date: {
            gte: budget.startDate,
            lte: budget.endDate,
          },
        },
        _sum: { amount: true },
      });

      await this.prisma.budget.update({
        where: { id: budget.id },
        data: { spent: spent._sum.amount ?? 0 },
      });
    }
  }

  private async revertBudgetSpent(
    userId: string,
    type: TransactionType,
    amount: number,
    categoryId: string | null,
    date: Date,
  ) {
    if (type !== TransactionType.EXPENSE || !categoryId) return;

    const now = new Date(date);
    const budgets = await this.prisma.budget.findMany({
      where: {
        userId,
        categoryId,
        startDate: { lte: now },
        endDate: { gte: now },
      },
    });

    for (const budget of budgets) {
      const spent = await this.prisma.transaction.aggregate({
        where: {
          userId,
          type: TransactionType.EXPENSE,
          categoryId,
          date: {
            gte: budget.startDate,
            lte: budget.endDate,
          },
        },
        _sum: { amount: true },
      });

      await this.prisma.budget.update({
        where: { id: budget.id },
        data: { spent: spent._sum.amount ?? 0 },
      });
    }
  }
}
