'use client';

import { Gift } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface SalaryCardProps {
  daysUntilSalary: number;
  salaryDate: number;
  className?: string;
}

export function SalaryCard({ daysUntilSalary, salaryDate, className }: SalaryCardProps) {
  const { t } = useTranslation();
  const circumference = 2 * Math.PI * 36;
  const progress = Math.max(0, Math.min(1, (30 - daysUntilSalary) / 30));
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <GlassCard className={cn('p-5', className)}>
      <div className="flex items-center gap-4">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="4"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="url(#salary-gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-700"
            />
            <defs>
              <linearGradient id="salary-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-2xl font-bold text-white">{daysUntilSalary}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Gift size={14} className="text-accent-rose" />
            <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
              {t('salaryCard.untilSalary')}
            </span>
          </div>
          <p className="text-lg font-semibold text-white">
            {daysUntilSalary === 0
              ? t('salaryCard.salaryDay')
              : daysUntilSalary + ' ' + t('salaryCard.daysLeft')}
          </p>
          <p className="text-xs text-white/30">
            {t('salaryCard.every')} {salaryDate}th {t('salaryCard.ofMonth')}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
