'use client';

import type { Goal } from '@/types';
import { GlassCard } from '@/components/ui/glass-card';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { cn, formatCurrency, getCategoryIcon } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface GoalCardProps {
  goal: Goal;
  currency?: string;
  className?: string;
}

export function GoalCard({ goal, currency = 'EUR', className }: GoalCardProps) {
  const { t } = useTranslation();
  const progress = goal.progress;
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference * (1 - Math.min(progress / 100, 1));
  const emoji = getCategoryIcon(goal.icon) || '🎯';

  return (
    <GlassCard
      className={cn('p-5', className)}
      hover
    >
      <div className="flex items-center gap-4">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="4"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              fill="none"
              stroke="url(#goal-gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700"
            />
            <defs>
              <linearGradient id="goal-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E11D48" />
                <stop offset="100%" stopColor="#BE185D" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-xl">{emoji}</span>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white truncate">{goal.name}</h4>
          <div className="flex items-baseline gap-1 mt-1">
            <AnimatedNumber
              value={goal.savedAmount}
              formatter={(v) => formatCurrency(v, currency)}
              className="text-base font-bold text-white"
            />
            <span className="text-xs text-white/40">
              / {formatCurrency(goal.targetAmount, currency)}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-ruby to-accent-crimson transition-all duration-700"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          {goal.daysRemaining !== undefined && (
            <p className="mt-1 text-[10px] text-white/30">
              {goal.daysRemaining > 0
                ? goal.daysRemaining + ' ' + t('goalCard.daysRemaining')
                : t('goalCard.almostThere')}
            </p>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
