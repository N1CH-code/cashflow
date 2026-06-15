'use client';

import { Sparkles, AlertTriangle, Lightbulb } from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface AICardProps {
  tip: string;
  type: 'tip' | 'warning' | 'insight';
  className?: string;
}

export function AICard({ tip, type, className }: AICardProps) {
  const { t } = useTranslation();
  const typeConfig = {
    tip: {
      icon: Sparkles,
      gradient: 'from-accent-ruby/20 to-transparent',
      iconColor: 'text-accent-rose',
      label: t('aiCard.tip'),
    },
    warning: {
      icon: AlertTriangle,
      gradient: 'from-accent-orange/20 to-transparent',
      iconColor: 'text-accent-orange',
      label: t('aiCard.warning'),
    },
    insight: {
      icon: Lightbulb,
      gradient: 'from-accent-blue/20 to-transparent',
      iconColor: 'text-accent-blue',
      label: t('aiCard.insight'),
    },
  };
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <GlassCard
      className={cn(
        'relative overflow-hidden p-5',
        className,
      )}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-r opacity-50', config.gradient)} />
      <div className="relative z-10 flex gap-3">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10',
          )}
        >
          <Icon size={20} className={config.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <span className={cn('text-xs font-semibold uppercase tracking-wider', config.iconColor)}>
            {config.label}
          </span>
          <p className="mt-1 text-sm text-white/80 leading-relaxed">{tip}</p>
        </div>
      </div>
    </GlassCard>
  );
}
