'use client';

import { cn, getFinancialTypeEmoji, getFinancialTypeLabel } from '@/lib/utils';
import { GlassCard } from '@/components/ui/glass-card';
import { useTranslation } from '@/lib/i18n';

interface FinancialTypeCardProps {
  type: string;
  description?: string;
  className?: string;
}

export function FinancialTypeCard({
  type,
  description,
  className,
}: FinancialTypeCardProps) {
  const { t } = useTranslation();
  const labels: Record<string, string> = {
    SAVER: t('financialTypes.saverLabel'),
    INVESTOR: t('financialTypes.investorLabel'),
    IMPULSIVE: t('financialTypes.impulsiveLabel'),
    RATIONALIST: t('financialTypes.rationalistLabel'),
    ADVENTURER: t('financialTypes.adventurerLabel'),
  };
  const descriptions: Record<string, string> = {
    SAVER: t('financialTypes.saver'),
    INVESTOR: t('financialTypes.investor'),
    IMPULSIVE: t('financialTypes.impulsive'),
    RATIONALIST: t('financialTypes.rationalist'),
    ADVENTURER: t('financialTypes.adventurer'),
  };
  const emoji = getFinancialTypeEmoji(type);
  const label = labels[type] || getFinancialTypeLabel(type);
  const desc = description || descriptions[type] || '';

  return (
    <GlassCard
      className={cn(
        'flex items-center gap-4 p-5',
        className,
      )}
      hover
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-2xl">
        {emoji}
      </span>
      <div className="flex-1 min-w-0">
        <h4 className="text-base font-semibold text-white">{label}</h4>
        <p className="mt-0.5 text-xs text-white/50">{desc}</p>
      </div>
    </GlassCard>
  );
}
