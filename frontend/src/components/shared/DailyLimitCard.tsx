'use client';

import { Sun } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Progress } from '@/components/ui/progress';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { cn, formatCurrency } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface DailyLimitCardProps {
  limit: number;
  spent: number;
  remaining: number;
  currency?: string;
  className?: string;
}

export function DailyLimitCard({
  limit,
  spent,
  remaining,
  currency = 'EUR',
  className,
}: DailyLimitCardProps) {
  const { t } = useTranslation();
  const pct = limit > 0 ? (spent / limit) * 100 : 0;
  const isOverspent = spent > limit;

  return (
    <GlassCard className={cn('p-5', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sun size={16} className="text-accent-orange" />
          <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
            {t('dailyLimitCard.dailyLimit')}
          </span>
        </div>
        <span className="text-xs text-white/30">{formatCurrency(limit, currency)}</span>
      </div>

      <Progress
        value={pct}
        color={isOverspent ? 'red' : pct > 80 ? 'orange' : 'green'}
        size="lg"
      />

      <div className="flex items-center justify-between mt-3">
        <AnimatedNumber
          value={spent}
          formatter={(v) => formatCurrency(v, currency)}
          className={cn(
            'text-lg font-semibold',
            isOverspent ? 'text-accent-red' : 'text-white',
          )}
        />
        <span
          className={cn(
            'text-sm',
            isOverspent ? 'text-accent-red' : remaining > 0 ? 'text-accent-green' : 'text-white/40',
          )}
        >
          {isOverspent
            ? `${formatCurrency(Math.abs(remaining), currency)} ${t('dailyLimitCard.over')}`
            : `${formatCurrency(remaining, currency)} ${t('dailyLimitCard.left')}`}
        </span>
      </div>
    </GlassCard>
  );
}
