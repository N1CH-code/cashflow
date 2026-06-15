'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { getFinancialTypeEmoji, getFinancialTypeLabel } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface StepResultProps {
  result: { type: string; score: number; description: string };
  onFinish: () => void;
}

export function StepResult({ result, onFinish }: StepResultProps) {
  const { t } = useTranslation();
  const [showContent, setShowContent] = useState(false);
  const emoji = getFinancialTypeEmoji(result.type);
  const label = getFinancialTypeLabel(result.type);

  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center pb-8">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 150, damping: 12 }}
        className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-accent-ruby to-accent-crimson shadow-2xl"
      >
        <PartyPopper size={44} className="text-white" />
      </motion.div>

      <h1 className="text-center text-2xl font-bold text-white">{t('onboarding.result.title')}</h1>
      <p className="mt-1 text-center text-sm text-white/50">
        {t('onboarding.result.subtitle')}
      </p>

      {showContent && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 w-full space-y-5"
        >
          <GlassCard className="p-6 text-center">
            <span className="text-5xl">{emoji}</span>
            <h2 className="mt-3 text-xl font-bold text-white">{label}</h2>
            <p className="mt-2 text-sm text-white/60">{result.description}</p>
          </GlassCard>

          <GlassCard className="p-6 text-center">
            <p className="text-xs font-medium text-white/40 uppercase tracking-wider">
              {t('onboarding.result.financialScore')}
            </p>
            <AnimatedNumber
              value={result.score}
              decimals={0}
              suffix=" / 50"
              className="mt-2 text-4xl font-extrabold bg-gradient-to-r from-accent-ruby to-accent-crimson bg-clip-text text-transparent"
            />
            <p className="mt-2 text-sm text-white/50">
              {result.score >= 40 ? t('onboarding.result.excellent') :
               result.score >= 30 ? t('onboarding.result.great') :
               result.score >= 20 ? t('onboarding.result.good') :
               t('onboarding.result.needsWork')}
            </p>
          </GlassCard>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button onClick={onFinish} size="lg" className="w-full">
              <CheckCircle2 size={18} />
              {t('onboarding.result.start')}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
