import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

const QUIZ_ANSWERS = [1, 2, 0, 1, 3, 2, 0, 1, 3, 2];

@Injectable()
export class FinancialIQService {
  constructor(private readonly prisma: PrismaService) {}

  async getIQ(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { financialIQ: true },
    });

    return {
      score: user?.financialIQ ?? 0,
      maxScore: 1000,
      level: this.getLevel(user?.financialIQ ?? 0),
    };
  }

  async submitQuiz(userId: string, dto: SubmitQuizDto) {
    const correct = dto.answers.reduce(
      (count, answer, idx) => count + (answer === QUIZ_ANSWERS[idx] ? 1 : 0),
      0,
    );

    const quizScore = Math.round((correct / 10) * 400);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { financialIQ: true },
    });

    const currentIQ = user?.financialIQ ?? 0;
    const behavioralIQ = currentIQ > quizScore ? currentIQ - quizScore : 0;

    const newTotal = quizScore + behavioralIQ;
    const finalScore = Math.min(1000, newTotal);

    await this.prisma.user.update({
      where: { id: userId },
      data: { financialIQ: finalScore },
    });

    return {
      quizScore,
      correctAnswers: correct,
      totalQuestions: 10,
      behavioralScore: behavioralIQ,
      totalScore: finalScore,
    };
  }

  async assessBehavior(userId: string) {
    const now = new Date();

    const threeMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 3,
      1,
    );

    const [transactions, budgets, goals, user] = await Promise.all([
      this.prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: threeMonthsAgo },
        },
        orderBy: { date: 'asc' },
      }),
      this.prisma.budget.findMany({
        where: { userId },
      }),
      this.prisma.goal.findMany({
        where: { userId },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { monthlyIncome: true, financialIQ: true },
      }),
    ]);

    const totalIncome = transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((s, t) => s + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((s, t) => s + t.amount, 0);

    const savingRate =
      totalIncome > 0
        ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100)
        : 0;

    const savingRateScore = Math.min(200, Math.round((savingRate / 30) * 200));

    const monthlyIncome = user?.monthlyIncome ?? 0;

    const expensesByMonth: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type !== 'EXPENSE') continue;
      const key = `${t.date.getFullYear()}-${t.date.getMonth()}`;
      expensesByMonth[key] = (expensesByMonth[key] ?? 0) + t.amount;
    }

    const expenseValues = Object.values(expensesByMonth);
    const avgExpense =
      expenseValues.length > 0
        ? expenseValues.reduce((s, v) => s + v, 0) / expenseValues.length
        : 0;
    const consistencyScore =
      expenseValues.length > 1
        ? Math.round(
            (1 -
              expenseValues.reduce(
                (sum, v) => sum + Math.abs(v - avgExpense),
                0,
              ) /
                (avgExpense * expenseValues.length || 1)) *
              150,
          )
        : 50;

    const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
    const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
    const budgetAdherence =
      totalBudget > 0
        ? Math.round((1 - Math.max(0, totalSpent - totalBudget) / totalBudget) * 150)
        : 0;

    const totalLoans = await this.prisma.loan.aggregate({
      where: { userId, isActive: true },
      _sum: { remainingAmount: true },
    });

    const totalDebt = totalLoans._sum.remainingAmount ?? 0;
    const debtRatio =
      monthlyIncome > 0 ? totalDebt / monthlyIncome : 0;
    const debtScore = Math.max(
      0,
      Math.round(150 - debtRatio * 15),
    );

    const completedGoals = goals.filter(
      (g) => g.status === 'COMPLETED',
    ).length;

    const goalScore =
      goals.length > 0
        ? Math.round((completedGoals / goals.length) * 100)
        : 0;

    const behavioralScore = Math.min(
      600,
      savingRateScore + consistencyScore + budgetAdherence + debtScore + goalScore,
    );

    const currentIQ = user?.financialIQ ?? 0;
    const quizPart = currentIQ > 400 ? 400 : currentIQ;
    const totalScore = Math.min(
      1000,
      quizPart + behavioralScore,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: { financialIQ: totalScore },
    });

    return {
      totalScore,
      breakdown: {
        savingRate: { score: savingRateScore, max: 200, rate: savingRate },
        consistency: { score: consistencyScore, max: 150 },
        budgetAdherence: { score: budgetAdherence, max: 150 },
        debtManagement: { score: debtScore, max: 150, debtRatio },
        goalProgress: { score: goalScore, max: 100 },
      },
      level: this.getLevel(totalScore),
    };
  }

  private getLevel(score: number): string {
    if (score >= 900) return 'Genius';
    if (score >= 700) return 'Expert';
    if (score >= 500) return 'Intermediate';
    if (score >= 300) return 'Beginner';
    return 'Novice';
  }
}
