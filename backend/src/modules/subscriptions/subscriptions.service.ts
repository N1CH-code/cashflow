import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import {
  SubscriptionPlan,
  SubscriptionStatus,
} from '@prisma/client';

export interface PlanDefinition {
  id: SubscriptionPlan;
  name: string;
  price: number | null;
  priceLabel: string;
  features: string[];
}

const PLANS: PlanDefinition[] = [
  {
    id: 'FREE',
    name: 'Free',
    price: null,
    priceLabel: 'Free',
    features: [
      '50 transactions per month',
      'Basic analytics',
      'Financial IQ',
      'Financial type',
      'Savings goals',
    ],
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: 4.99,
    priceLabel: '€4.99 / month',
    features: [
      'Unlimited transactions',
      'AI analytics',
      'Budget prediction',
      'Loans',
      'AI consultant',
      'Subscriptions',
      'PDF reports',
      'Data export',
    ],
  },
  {
    id: 'MAX',
    name: 'Max',
    price: 9.99,
    priceLabel: '€9.99 / month',
    features: [
      'All Pro features',
      'Family budget',
      'Multiple wallets',
      'Shared goals',
      'Advanced AI',
      'Priority support',
    ],
  },
];

const PLAN_ORDER: Record<SubscriptionPlan, number> = {
  FREE: 0,
  PRO: 1,
  MAX: 2,
};

export interface FeatureFlags {
  unlimitedTransactions: boolean;
  aiAnalytics: boolean;
  budgetPrediction: boolean;
  loans: boolean;
  aiConsultant: boolean;
  subscriptions: boolean;
  pdfReports: boolean;
  dataExport: boolean;
  familyBudget: boolean;
  multipleWallets: boolean;
  sharedGoals: boolean;
  advancedAI: boolean;
  prioritySupport: boolean;
}

function getFeaturesForPlan(plan: SubscriptionPlan): FeatureFlags {
  const level = PLAN_ORDER[plan];

  return {
    unlimitedTransactions: level >= PLAN_ORDER.PRO,
    aiAnalytics: level >= PLAN_ORDER.PRO,
    budgetPrediction: level >= PLAN_ORDER.PRO,
    loans: level >= PLAN_ORDER.PRO,
    aiConsultant: level >= PLAN_ORDER.PRO,
    subscriptions: level >= PLAN_ORDER.PRO,
    pdfReports: level >= PLAN_ORDER.PRO,
    dataExport: level >= PLAN_ORDER.PRO,
    familyBudget: level >= PLAN_ORDER.MAX,
    multipleWallets: level >= PLAN_ORDER.MAX,
    sharedGoals: level >= PLAN_ORDER.MAX,
    advancedAI: level >= PLAN_ORDER.MAX,
    prioritySupport: level >= PLAN_ORDER.MAX,
  };
}

function isTrialExpired(user: {
  trialStart: Date;
  trialEnd: Date | null;
}): boolean {
  if (user.trialEnd) {
    return new Date() > user.trialEnd;
  }
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  const end = new Date(user.trialStart.getTime() + sevenDays);
  return new Date() > end;
}

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  getPlans(): PlanDefinition[] {
    return PLANS;
  }

  async getMySubscription(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        trialStart: true,
        trialEnd: true,
        subscriptionEnd: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const subscription = await this.prisma.userSubscription.findUnique({
      where: { userId },
    });

    const trialEnd = user.trialEnd ?? new Date(
      user.trialStart.getTime() + 7 * 24 * 60 * 60 * 1000,
    );

    const trialExpired = new Date() > trialEnd;
    const daysLeftInTrial = trialExpired
      ? 0
      : Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    let status: string;
    if (user.plan === 'FREE' && !trialExpired) {
      status = 'TRIAL';
    } else if (subscription?.status === 'CANCELLED') {
      status = 'CANCELLED';
    } else if (user.plan !== 'FREE' && subscription) {
      status = subscription.status.toLowerCase();
    } else {
      status = 'ACTIVE';
    }

    return {
      plan: user.plan,
      status,
      trialEnd,
      daysLeftInTrial,
      subscriptionEnd: subscription?.endDate ?? user.subscriptionEnd ?? null,
      autoRenew: subscription?.autoRenew ?? false,
      features: getFeaturesForPlan(user.plan),
    };
  }

  async upgradePlan(userId: string, plan: SubscriptionPlan) {
    if (plan === 'FREE') {
      throw new BadRequestException('Cannot downgrade to FREE');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, trialStart: true, trialEnd: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentLevel = PLAN_ORDER[user.plan];
    const targetLevel = PLAN_ORDER[plan];

    if (targetLevel <= currentLevel) {
      throw new BadRequestException(
        `You are already on the ${user.plan} plan or higher`,
      );
    }

    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { plan },
      });

      await tx.userSubscription.upsert({
        where: { userId },
        create: {
          userId,
          plan,
          status: 'ACTIVE',
          startDate: now,
          endDate: nextMonth,
          autoRenew: true,
        },
        update: {
          plan,
          status: 'ACTIVE',
          startDate: now,
          endDate: nextMonth,
          autoRenew: true,
        },
      });
    });

    return {
      plan,
      status: 'ACTIVE',
      startDate: now,
      endDate: nextMonth,
      autoRenew: true,
      features: getFeaturesForPlan(plan),
    };
  }

  async cancel(userId: string) {
    const subscription = await this.prisma.userSubscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    if (subscription.status === 'CANCELLED') {
      throw new BadRequestException('Subscription is already cancelled');
    }

    const updated = await this.prisma.userSubscription.update({
      where: { userId },
      data: { autoRenew: false, status: 'CANCELLED' },
    });

    return {
      plan: updated.plan,
      status: 'CANCELLED',
      autoRenew: false,
      endDate: updated.endDate,
      message:
        'Auto-renewal cancelled. Your access continues until the end of the billing period.',
    };
  }

  async reactivate(userId: string) {
    const subscription = await this.prisma.userSubscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('No subscription found');
    }

    if (subscription.status !== 'CANCELLED') {
      throw new BadRequestException('Subscription is not cancelled');
    }

    const updated = await this.prisma.userSubscription.update({
      where: { userId },
      data: { autoRenew: true, status: 'ACTIVE' },
    });

    return {
      plan: updated.plan,
      status: 'ACTIVE',
      autoRenew: true,
      message: 'Subscription has been reactivated.',
    };
  }

  async getFeatures(userId: string): Promise<FeatureFlags> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, trialStart: true, trialEnd: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const effectivePlan =
      user.plan === 'FREE' && !isTrialExpired(user) ? 'PRO' : user.plan;

    return getFeaturesForPlan(effectivePlan as SubscriptionPlan);
  }

  async checkTransactionLimit(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    if (!user) return false;
    if (user.plan !== 'FREE') return true;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const count = await this.prisma.transaction.count({
      where: {
        userId,
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    });

    return count < 50;
  }

  getPlanLevel(plan: SubscriptionPlan): number {
    return PLAN_ORDER[plan] ?? 0;
  }
}
