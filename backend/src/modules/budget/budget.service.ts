import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateBudgetDto) {
    const startDate = new Date(dto.year, dto.month - 1, 1);
    const endDate = new Date(dto.year, dto.month, 0, 23, 59, 59, 999);
    const budget = await this.prisma.budget.create({
      data: {
        userId,
        categoryId: dto.categoryId ?? null,
        amount: dto.amount,
        period: dto.period ?? 'monthly',
        month: dto.month,
        year: dto.year,
        startDate,
        endDate,
      },
      include: { category: true },
    });

    await this.recalculateSpent(budget.id, userId, dto.categoryId);

    return budget;
  }

  async findAll(userId: string, month?: number, year?: number) {
    const now = new Date();
    const filterMonth = month ?? now.getMonth() + 1;
    const filterYear = year ?? now.getFullYear();

    const budgets = await this.prisma.budget.findMany({
      where: { userId, month: filterMonth, year: filterYear },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    return budgets;
  }

  async findOne(userId: string, id: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, userId },
      include: { category: true },
    });

    if (!budget) {
      throw new NotFoundException('Budget entry not found');
    }

    return budget;
  }

  async update(userId: string, id: string, dto: UpdateBudgetDto) {
    const existing = await this.findOne(userId, id);

    const updateData: any = {};
    if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
    if (dto.amount !== undefined) updateData.amount = dto.amount;
    if (dto.period !== undefined) updateData.period = dto.period;
    if (dto.month !== undefined) updateData.month = dto.month;
    if (dto.year !== undefined) updateData.year = dto.year;

    const budget = await this.prisma.budget.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    const categoryId = dto.categoryId ?? existing.categoryId;
    await this.recalculateSpent(budget.id, userId, categoryId);

    return budget;
  }

  async remove(userId: string, id: string) {
    const existing = await this.findOne(userId, id);
    await this.prisma.budget.delete({ where: { id } });
    return { id };
  }

  async getOverview(userId: string) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { monthlyIncome: true, salaryDate: true },
    });

    const budgets = await this.prisma.budget.findMany({
      where: { userId, month: currentMonth, year: currentYear },
      include: { category: true },
    });

    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);

    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const dayOfMonth = now.getDate();
    const daysLeft = daysInMonth - dayOfMonth;

    const remaining = totalBudget - totalSpent;
    const dailyLimit = daysLeft > 0 ? remaining / daysLeft : 0;

    const salaryDate = user?.salaryDate ?? 1;
    let daysUntilSalary = salaryDate - dayOfMonth;
    if (daysUntilSalary <= 0) {
      daysUntilSalary = new Date(currentYear, currentMonth, 0).getDate() - dayOfMonth + salaryDate;
    }

    const overspendCategories = budgets
      .filter((b) => b.spent > b.amount)
      .map((b) => ({
        categoryId: b.categoryId,
        category: b.category?.name ?? 'Uncategorized',
        budget: b.amount,
        spent: b.spent,
        overspent: b.spent - b.amount,
      }));

    return {
      monthlyIncome: user?.monthlyIncome ?? 0,
      totalBudget,
      totalSpent,
      remaining: Math.max(remaining, 0),
      dailyLimit: Math.round(dailyLimit * 100) / 100,
      daysUntilSalary,
      overspendWarning: overspendCategories.length > 0,
      overspendCategories,
    };
  }

  private async recalculateSpent(budgetId: string, userId: string, categoryId?: string | null) {
    if (!categoryId) return;

    const budget = await this.prisma.budget.findUnique({ where: { id: budgetId } });
    if (!budget) return;

    const monthStart = new Date(budget.year, budget.month - 1, 1);
    const monthEnd = new Date(budget.year, budget.month, 0, 23, 59, 59, 999);

    const result = await this.prisma.transaction.aggregate({
      where: {
        userId,
        categoryId,
        type: 'EXPENSE',
        date: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    });

    await this.prisma.budget.update({
      where: { id: budgetId },
      data: { spent: result._sum.amount ?? 0 },
    });
  }
}
