'use client';

import { TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { cn, formatCurrency } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface BudgetCardProps {
  balance: number;
  income: number;
  expenses: number;
  remaining: number;
  currency?: string;
  className?: string;
}

export function BudgetCard({
  balance,
  income,
  expenses,
  remaining,
  currency = 'EUR',
  className,
}: BudgetCardProps) {
  const { t } = useTranslation();
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <Wallet size={16} className="text-white/40" />
          <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
            {t('budgetCard.balance')}
          </span>
        </div>

        <AnimatedNumber
          value={balance}
          formatter={(v) => formatCurrency(v, currency)}
          className="text-3xl font-bold text-white mb-4"
        />

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-accent-green/10 p-3">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp size={12} className="text-accent-green" />
              <span className="text-[10px] font-medium text-accent-green uppercase">{t('budgetCard.income')}</span>
            </div>
            <AnimatedNumber
              value={income}
              formatter={(v) => formatCurrency(v, currency)}
              className="text-sm font-semibold text-accent-green"
              duration={0.5}
            />
          </div>

          <div className="rounded-xl bg-accent-red/10 p-3">
            <div className="flex items-center gap-1 mb-1">
              <TrendingDown size={12} className="text-accent-red" />
              <span className="text-[10px] font-medium text-accent-red uppercase">{t('budgetCard.expenses')}</span>
            </div>
            <AnimatedNumber
              value={expenses}
              formatter={(v) => formatCurrency(v, currency)}
              className="text-sm font-semibold text-accent-red"
              duration={0.5}
            />
          </div>

          <div className="rounded-xl bg-white/5 p-3">
            <div className="flex items-center gap-1 mb-1">
              <Wallet size={12} className={remaining >= 0 ? 'text-accent-green' : 'text-accent-red'} />
              <span className="text-[10px] font-medium text-white/40 uppercase">{t('budgetCard.left')}</span>
            </div>
            <AnimatedNumber
              value={remaining}
              formatter={(v) => formatCurrency(v, currency)}
              className={cn(
                'text-sm font-semibold',
                remaining >= 0 ? 'text-accent-green' : 'text-accent-red',
              )}
              duration={0.5}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
