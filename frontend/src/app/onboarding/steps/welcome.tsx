'use client';

import { motion } from 'framer-motion';
import { Sparkles, Brain, PiggyBank, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { useTranslation } from '@/lib/i18n';

interface StepWelcomeProps {
  onNext: () => void;
}

export function StepWelcome({ onNext }: StepWelcomeProps) {
  const { t } = useTranslation();
  const benefits = [
    { icon: PiggyBank, id: 'budget', color: 'from-accent-green/20 to-transparent', iconColor: 'text-accent-green' },
    { icon: Brain, id: 'ai', color: 'from-accent-ruby/20 to-transparent', iconColor: 'text-accent-rose' },
    { icon: TrendingUp, id: 'goals', color: 'from-accent-blue/20 to-transparent', iconColor: 'text-accent-blue' },
    { icon: Sparkles, id: 'credit', color: 'from-accent-orange/20 to-transparent', iconColor: 'text-accent-orange' },
  ];
  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-ruby to-accent-crimson shadow-2xl"
      >
        <Sparkles size={36} className="text-white" />
      </motion.div>

      <h1 className="text-center text-2xl font-bold text-white">
        {t('onboarding.welcome.title')}
      </h1>
      <p className="mt-2 text-center text-sm text-white/50">
        {t('onboarding.welcome.subtitle')}
      </p>

      <div className="mt-8 grid w-full grid-cols-2 gap-3">
        {benefits.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
          >
            <GlassCard className="relative overflow-hidden p-4" hover>
              <div className={`absolute inset-0 bg-gradient-to-r ${item.color} opacity-50`} />
              <div className="relative z-10">
                <item.icon size={20} className={item.iconColor} />
                <h3 className="mt-2 text-sm font-semibold text-white">{t(`onboarding.welcome.features.${item.id}.title`)}</h3>
                <p className="mt-0.5 text-xs text-white/40">{t(`onboarding.welcome.features.${item.id}.desc`)}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 w-full"
      >
        <Button onClick={onNext} size="lg" className="w-full">
          {t('onboarding.welcome.start')}
          <Sparkles size={16} />
        </Button>
      </motion.div>
    </div>
  );
}
