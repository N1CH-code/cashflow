import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { AddFundsDto } from './dto/add-funds.dto';
import { differenceInDays, addDays, format } from 'date-fns';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateGoalDto) {
    const goal = await this.prisma.goal.create({
      data: {
        userId,
        name: dto.name,
        targetAmount: dto.targetAmount,
        icon: dto.icon ?? 'target',
        color: dto.color ?? '#8B5CF6',
        deadline: dto.deadline ? new Date(dto.deadline) : null,
      },
    });

    return this.enrichGoal(goal);
  }

  async findAll(userId: string) {
    const goals = await this.prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return goals.map((g) => this.enrichGoal(g));
  }

  async findOne(userId: string, id: string) {
    const goal = await this.prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      throw new NotFoundException('Goal not found');
    }

    return this.enrichGoal(goal);
  }

  async update(userId: string, id: string, dto: UpdateGoalDto) {
    await this.findOne(userId, id);

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.targetAmount !== undefined) updateData.targetAmount = dto.targetAmount;
    if (dto.icon !== undefined) updateData.icon = dto.icon;
    if (dto.color !== undefined) updateData.color = dto.color;
    if (dto.deadline !== undefined) updateData.deadline = dto.deadline ? new Date(dto.deadline) : null;

    const goal = await this.prisma.goal.update({
      where: { id },
      data: updateData,
    });

    return this.enrichGoal(goal);
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);
    await this.prisma.goal.delete({ where: { id } });
    return { id };
  }

  async addFunds(userId: string, id: string, dto: AddFundsDto) {
    const goal = await this.findOne(userId, id);

    if (goal.status === 'COMPLETED' || goal.status === 'CANCELLED') {
      throw new BadRequestException(`Cannot add funds to a ${goal.status.toLowerCase()} goal`);
    }

    const newSaved = goal.savedAmount + dto.amount;

    if (newSaved > goal.targetAmount) {
      throw new BadRequestException('Added funds would exceed the target amount');
    }

    const isCompleted = Math.abs(newSaved - goal.targetAmount) < 0.001;

    const updated = await this.prisma.goal.update({
      where: { id },
      data: {
        savedAmount: newSaved,
        ...(isCompleted
          ? { status: 'COMPLETED' as any, completedAt: new Date() }
          : {}),
      },
    });

    return this.enrichGoal(updated);
  }

  async getSuggestions(userId: string) {
    const goals = await this.prisma.goal.findMany({
      where: { userId, status: 'ACTIVE' },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { monthlyIncome: true },
    });

    const monthlyIncome = user?.monthlyIncome ?? 0;

    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const expenses = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: threeMonthsAgo },
      },
      _avg: { amount: true },
      _count: true,
    });

    const averageMonthlyExpense = expenses._avg.amount
      ? (expenses._avg.amount * (expenses._count / 3))
      : 0;

    const disposable = Math.max(0, monthlyIncome - averageMonthlyExpense);
    const suggestedMonthly = disposable * 0.3;

    const suggestions = goals.map((goal) => {
      const remaining = goal.targetAmount - goal.savedAmount;
      const monthsToGoal = suggestedMonthly > 0
        ? Math.ceil(remaining / suggestedMonthly)
        : null;

      return {
        goalId: goal.id,
        goalName: goal.name,
        remaining,
        suggestedMonthlySave: Math.round(suggestedMonthly * 100) / 100,
        monthsToComplete: monthsToGoal,
        message: suggestedMonthly > 0
          ? `Saving $${Math.round(suggestedMonthly)}/month, you could reach "${goal.name}" in about ${monthsToGoal} months`
          : `Increase your income or reduce expenses to start saving toward "${goal.name}"`,
      };
    });

    return {
      monthlyIncome,
      averageMonthlyExpense: Math.round(averageMonthlyExpense * 100) / 100,
      disposableIncome: Math.round(disposable * 100) / 100,
      suggestedMonthlySavePercent: '30% of disposable income',
      suggestions,
    };
  }

  private enrichGoal(goal: any) {
    const target = goal.targetAmount;
    const saved = goal.savedAmount;
    const progress = target > 0 ? Math.min(100, Math.round((saved / target) * 10000) / 100) : 0;

    const now = new Date();
    let daysRemaining: number | null = null;
    let projectedDate: string | null = null;

    if (goal.deadline) {
      daysRemaining = Math.max(0, differenceInDays(new Date(goal.deadline), now));
    }

    const daysSinceCreation = differenceInDays(now, new Date(goal.createdAt));
    if (saved > 0 && daysSinceCreation > 0 && saved < target) {
      const savingsPerDay = saved / daysSinceCreation;
      const remaining = target - saved;
      const daysToProjection = Math.ceil(remaining / savingsPerDay);
      projectedDate = format(addDays(now, daysToProjection), 'yyyy-MM-dd');
    }

    const monthlyInterestRate = 0;
    const avgMonthlySave = daysSinceCreation > 0
      ? Math.round((saved / daysSinceCreation) * 30 * 100) / 100
      : 0;

    return {
      ...goal,
      progress,
      daysRemaining,
      projectedDate,
      avgMonthlySave,
    };
  }
}
