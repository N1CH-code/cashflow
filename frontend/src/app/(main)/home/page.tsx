'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { api } from '@/lib/api';
import { BudgetCard } from '@/components/shared/BudgetCard';
import { SalaryCard } from '@/components/shared/SalaryCard';
import { DailyLimitCard } from '@/components/shared/DailyLimitCard';
import { AICard } from '@/components/shared/AICard';
import { TransactionItem } from '@/components/shared/TransactionItem';
import { GoalCard } from '@/components/shared/GoalCard';
import { ShimmerCard } from '@/components/ui/shimmer';
import { GlassCard } from '@/components/ui/glass-card';
import { useTranslation } from '@/lib/i18n';

export default function HomePage() {
  const { t } = useTranslation();
  const { user, dashboard, setDashboard, preferredCurrency } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (dashboard === null) {
      fetchDashboard();
    }
  }, []);

  const fetchDashboard = async () => {
    try {
      const raw: any = await api.getDashboard();
      const bo = raw.budgetOverview ?? {};
      const dl = raw.dailyLimitInfo ?? {};
      setDashboard({
        budget: {
          totalIncome: bo.totalIncome ?? 0,
          totalBudget: bo.totalBudget ?? 0,
          totalSpent: bo.totalSpent ?? 0,
          remaining: bo.remaining ?? 0,
          dailyLimit: dl.limit ?? 0,
          daysUntilSalary: bo.daysUntilSalary ?? 0,
          categories: bo.categories ?? [],
        },
        daysUntilSalary: bo.daysUntilSalary ?? 0,
        dailyLimit: {
          limit: dl.limit ?? 0,
          spent: dl.spent ?? 0,
          remaining: dl.remaining ?? 0,
        },
        aiTip: raw.aiTip ?? null,
        recentTransactions: raw.recentTransactions ?? [],
        activeGoals: raw.activeGoals ?? [],
        prediction: raw.prediction ?? null,
      });
    } catch (e) { console.error('[HomePage] fetchDashboard failed', e); }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  }, []);

  if (!dashboard) {
    return (
      <div className="space-y-4 pt-4">
        {[1, 2, 3, 4].map((i) => <ShimmerCard key={i} />)}
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/40">{t('dashboard.welcomeBack')}</p>
          <h1 className="text-xl font-bold text-white">{user?.firstName || t('dashboard.user')}</h1>
        </div>
        <button
          onClick={handleRefresh}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 transition-colors hover:bg-white/10"
        >
          <RefreshCw size={18} className={`text-white/60 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <BudgetCard
        balance={dashboard.budget.totalIncome - dashboard.budget.totalSpent}
        income={dashboard.budget.totalIncome}
        expenses={dashboard.budget.totalSpent}
        remaining={dashboard.budget.remaining}
        currency={preferredCurrency || user?.currency}
      />

      <div className="grid grid-cols-2 gap-3">
        <SalaryCard
          daysUntilSalary={dashboard.daysUntilSalary}
          salaryDate={user?.salaryDate || 1}
        />
        <DailyLimitCard
          limit={dashboard.dailyLimit.limit}
          spent={dashboard.dailyLimit.spent}
          remaining={dashboard.dailyLimit.remaining}
          currency={preferredCurrency || user?.currency}
        />
      </div>

      {dashboard.aiTip && (
        <AICard
          tip={dashboard.aiTip.tip}
          type={dashboard.aiTip.type}
        />
      )}

      {dashboard.recentTransactions && dashboard.recentTransactions.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-white/70 uppercase tracking-wider">
            {t('dashboard.recentTransactions')}
          </h2>
          <GlassCard className="divide-y divide-white/[0.04] p-0">
            {dashboard.recentTransactions.slice(0, 5).map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} currency={preferredCurrency || user?.currency} />
            ))}
          </GlassCard>
        </div>
      )}

      {dashboard.activeGoals && dashboard.activeGoals.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-white/70 uppercase tracking-wider">
            {t('dashboard.activeGoals')}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {dashboard.activeGoals.map((goal) => (
              <div key={goal.id} className="min-w-[260px]">
                <GoalCard goal={goal} currency={preferredCurrency || user?.currency} />
              </div>
            ))}
          </div>
        </div>
      )}

      {dashboard.prediction && dashboard.prediction.willRunOut && (
        <div className="rounded-2xl border border-accent-orange/20 bg-accent-orange/10 p-4">
          <p className="text-sm text-accent-orange">
            ⚠ {t('dashboard.predictionWarning')} {new Date(dashboard.prediction.runOutDate!).toLocaleDateString()}
          </p>
        </div>
      )}

      <div className="h-6" />
    </motion.div>
  );
}
