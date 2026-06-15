import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CompleteStepDto } from './dto/complete-step.dto';
import { Currency, FinancialType } from '@prisma/client';

const VALID_CURRENCIES: string[] = Object.values(Currency);

const TYPE_QUIZ_WEIGHTS: Array<Record<string, Record<string, number>>> = [
  {
    0: { SAVER: 3, INVESTOR: 1, IMPULSIVE: 0, RATIONALIST: 2, ADVENTURER: 1 },
    1: { SAVER: 1, INVESTOR: 3, IMPULSIVE: 0, RATIONALIST: 2, ADVENTURER: 2 },
    2: { SAVER: 0, INVESTOR: 0, IMPULSIVE: 3, RATIONALIST: 1, ADVENTURER: 2 },
    3: { SAVER: 2, INVESTOR: 2, IMPULSIVE: 0, RATIONALIST: 3, ADVENTURER: 1 },
  },
  {
    0: { SAVER: 3, INVESTOR: 1, IMPULSIVE: 1, RATIONALIST: 2, ADVENTURER: 0 },
    1: { SAVER: 0, INVESTOR: 2, IMPULSIVE: 2, RATIONALIST: 1, ADVENTURER: 3 },
    2: { SAVER: 2, INVESTOR: 0, IMPULSIVE: 0, RATIONALIST: 3, ADVENTURER: 1 },
    3: { SAVER: 1, INVESTOR: 3, IMPULSIVE: 1, RATIONALIST: 0, ADVENTURER: 2 },
  },
  {
    0: { SAVER: 0, INVESTOR: 1, IMPULSIVE: 3, RATIONALIST: 2, ADVENTURER: 1 },
    1: { SAVER: 1, INVESTOR: 1, IMPULSIVE: 0, RATIONALIST: 2, ADVENTURER: 3 },
    2: { SAVER: 3, INVESTOR: 0, IMPULSIVE: 1, RATIONALIST: 2, ADVENTURER: 0 },
    3: { SAVER: 2, INVESTOR: 2, IMPULSIVE: 0, RATIONALIST: 1, ADVENTURER: 2 },
  },
  {
    0: { SAVER: 2, INVESTOR: 2, IMPULSIVE: 0, RATIONALIST: 3, ADVENTURER: 1 },
    1: { SAVER: 3, INVESTOR: 1, IMPULSIVE: 1, RATIONALIST: 2, ADVENTURER: 0 },
    2: { SAVER: 0, INVESTOR: 3, IMPULSIVE: 0, RATIONALIST: 1, ADVENTURER: 3 },
    3: { SAVER: 1, INVESTOR: 0, IMPULSIVE: 3, RATIONALIST: 2, ADVENTURER: 1 },
  },
  {
    0: { SAVER: 3, INVESTOR: 0, IMPULSIVE: 0, RATIONALIST: 2, ADVENTURER: 1 },
    1: { SAVER: 1, INVESTOR: 2, IMPULSIVE: 2, RATIONALIST: 3, ADVENTURER: 0 },
    2: { SAVER: 0, INVESTOR: 3, IMPULSIVE: 1, RATIONALIST: 1, ADVENTURER: 2 },
    3: { SAVER: 2, INVESTOR: 1, IMPULSIVE: 0, RATIONALIST: 0, ADVENTURER: 3 },
  },
  {
    0: { SAVER: 1, INVESTOR: 0, IMPULSIVE: 3, RATIONALIST: 2, ADVENTURER: 1 },
    1: { SAVER: 2, INVESTOR: 3, IMPULSIVE: 0, RATIONALIST: 1, ADVENTURER: 2 },
    2: { SAVER: 3, INVESTOR: 1, IMPULSIVE: 1, RATIONALIST: 0, ADVENTURER: 2 },
    3: { SAVER: 0, INVESTOR: 2, IMPULSIVE: 2, RATIONALIST: 3, ADVENTURER: 0 },
  },
  {
    0: { SAVER: 2, INVESTOR: 1, IMPULSIVE: 1, RATIONALIST: 3, ADVENTURER: 0 },
    1: { SAVER: 0, INVESTOR: 3, IMPULSIVE: 0, RATIONALIST: 2, ADVENTURER: 2 },
    2: { SAVER: 1, INVESTOR: 0, IMPULSIVE: 3, RATIONALIST: 1, ADVENTURER: 2 },
    3: { SAVER: 3, INVESTOR: 2, IMPULSIVE: 0, RATIONALIST: 0, ADVENTURER: 1 },
  },
  {
    0: { SAVER: 1, INVESTOR: 3, IMPULSIVE: 1, RATIONALIST: 0, ADVENTURER: 2 },
    1: { SAVER: 3, INVESTOR: 1, IMPULSIVE: 0, RATIONALIST: 2, ADVENTURER: 1 },
    2: { SAVER: 0, INVESTOR: 0, IMPULSIVE: 3, RATIONALIST: 1, ADVENTURER: 3 },
    3: { SAVER: 2, INVESTOR: 2, IMPULSIVE: 2, RATIONALIST: 3, ADVENTURER: 0 },
  },
  {
    0: { SAVER: 2, INVESTOR: 0, IMPULSIVE: 2, RATIONALIST: 3, ADVENTURER: 1 },
    1: { SAVER: 0, INVESTOR: 2, IMPULSIVE: 1, RATIONALIST: 1, ADVENTURER: 3 },
    2: { SAVER: 3, INVESTOR: 1, IMPULSIVE: 0, RATIONALIST: 2, ADVENTURER: 0 },
    3: { SAVER: 1, INVESTOR: 3, IMPULSIVE: 3, RATIONALIST: 0, ADVENTURER: 2 },
  },
  {
    0: { SAVER: 1, INVESTOR: 1, IMPULSIVE: 0, RATIONALIST: 2, ADVENTURER: 3 },
    1: { SAVER: 2, INVESTOR: 2, IMPULSIVE: 1, RATIONALIST: 3, ADVENTURER: 0 },
    2: { SAVER: 0, INVESTOR: 3, IMPULSIVE: 2, RATIONALIST: 1, ADVENTURER: 1 },
    3: { SAVER: 3, INVESTOR: 0, IMPULSIVE: 3, RATIONALIST: 0, ADVENTURER: 2 },
  },
];

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        onboardingComplete: true,
        onboardingStep: true,
        currency: true,
        monthlyIncome: true,
        salaryDate: true,
        financialType: true,
      },
    });

    if (!user) {
      return {
        completed: false,
        currentStep: 0,
        totalSteps: 6,
        steps: this.buildSteps(null),
      };
    }

    return {
      completed: user.onboardingComplete,
      currentStep: user.onboardingStep,
      totalSteps: 6,
      steps: this.buildSteps(user),
    };
  }

  async completeStep(userId: string, dto: CompleteStepDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingStep: true, onboardingComplete: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.onboardingComplete) {
      throw new BadRequestException('Onboarding is already complete');
    }

    if (dto.step !== user.onboardingStep + 1) {
      throw new BadRequestException(
        `Step ${dto.step} is not the next step. Expected step ${user.onboardingStep + 1}`,
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingStep: dto.step },
    });

    return {
      step: dto.step,
      completed: false,
      message: `Step ${dto.step} completed`,
    };
  }

  async setCurrency(userId: string, currency: string) {
    if (!VALID_CURRENCIES.includes(currency)) {
      throw new BadRequestException(
        `Invalid currency. Valid: ${VALID_CURRENCIES.join(', ')}`,
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { currency: currency as Currency },
    });

    return { currency };
  }

  async setIncome(
    userId: string,
    monthlyIncome: number,
    salaryDate: number,
  ) {
    if (monthlyIncome <= 0) {
      throw new BadRequestException('Monthly income must be positive');
    }

    if (salaryDate < 1 || salaryDate > 31) {
      throw new BadRequestException('Salary date must be between 1 and 31');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { monthlyIncome, salaryDate },
    });

    return { monthlyIncome, salaryDate };
  }

  async submitFinancialTypeQuiz(userId: string, answers: number[]) {
    if (!Array.isArray(answers) || answers.length !== 10) {
      throw new BadRequestException('Quiz requires exactly 10 answers (0-3)');
    }

    for (const answer of answers) {
      if (typeof answer !== 'number' || answer < 0 || answer > 3) {
        throw new BadRequestException('Each answer must be a number between 0 and 3');
      }
    }

    const scores: Record<string, number> = {
      SAVER: 0,
      INVESTOR: 0,
      IMPULSIVE: 0,
      RATIONALIST: 0,
      ADVENTURER: 0,
    };

    for (let i = 0; i < answers.length; i++) {
      const answerIdx = answers[i];
      const weightMap = TYPE_QUIZ_WEIGHTS[i][answerIdx];

      if (weightMap) {
        for (const [type, points] of Object.entries(weightMap)) {
          scores[type] += points;
        }
      }
    }

    let maxScore = 0;
    let determinedType = 'SAVER';

    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        determinedType = type;
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { financialType: determinedType as FinancialType },
    });

    return {
      financialType: determinedType,
      scores,
    };
  }

  async completeOnboarding(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        currency: true,
        monthlyIncome: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const missing: string[] = [];
    if (!user.currency) missing.push('currency');
    if (!user.monthlyIncome || user.monthlyIncome <= 0) {
      missing.push('monthlyIncome');
    }

    if (missing.length > 0) {
      throw new BadRequestException(
        `Cannot complete onboarding. Missing: ${missing.join(', ')}`,
      );
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        onboardingComplete: true,
        onboardingStep: 6,
      },
    });

    return {
      success: true,
      message: 'Onboarding complete! Welcome to CashFlow.',
    };
  }

  private buildSteps(user: any) {
    return [
      {
        step: 1,
        name: 'Welcome',
        completed: user ? user.onboardingStep >= 1 : false,
      },
      {
        step: 2,
        name: 'Currency',
        completed: user ? !!user.currency : false,
      },
      {
        step: 3,
        name: 'Income Setup',
        completed: user ? !!user.monthlyIncome : false,
      },
      {
        step: 4,
        name: 'Financial Type Quiz',
        completed: user ? !!user.financialType : false,
      },
      {
        step: 5,
        name: 'Preferences',
        completed: user ? user.onboardingStep >= 5 : false,
      },
      {
        step: 6,
        name: 'Complete',
        completed: user ? user.onboardingComplete : false,
      },
    ];
  }
}
