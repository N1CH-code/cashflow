import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BudgetModule } from './modules/budget/budget.module';
import { GoalsModule } from './modules/goals/goals.module';
import { LoansModule } from './modules/loans/loans.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { ReferralsModule } from './modules/referrals/referrals.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { AiModule } from './modules/ai/ai.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { FinancialIQModule } from './modules/financial-iq/financial-iq.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { ChallengesModule } from './modules/challenges/challenges.module';
import { FamilyModule } from './modules/family/family.module';
import { EducationModule } from './modules/education/education.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    TransactionsModule,
    CategoriesModule,
    BudgetModule,
    GoalsModule,
    LoansModule,
    SubscriptionsModule,
    ReferralsModule,
    AchievementsModule,
    AiModule,
    NotificationsModule,
    AnalyticsModule,
    FinancialIQModule,
    GamificationModule,
    ChallengesModule,
    FamilyModule,
    EducationModule,
    OnboardingModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
