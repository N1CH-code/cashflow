'use client';

import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

const currencies = [
  { code: 'EUR', symbol: '€', nameKey: 'currencies.eur' },
  { code: 'USD', symbol: '$', nameKey: 'currencies.usd' },
  { code: 'GBP', symbol: '£', nameKey: 'currencies.gbp' },
  { code: 'RUB', symbol: '₽', nameKey: 'currencies.rub' },
  { code: 'UAH', symbol: '₴', nameKey: 'currencies.uah' },
  { code: 'PLN', symbol: 'zł', nameKey: 'currencies.pln' },
  { code: 'CHF', symbol: 'Fr', nameKey: 'currencies.chf' },
];

interface StepCurrencyProps {
  onSelect: (currency: string) => void;
  selected: string;
}

export function StepCurrency({ onSelect, selected }: StepCurrencyProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-blue to-accent-cyan shadow-xl"
      >
        <DollarSign size={30} className="text-white" />
      </motion.div>

      <h1 className="text-center text-2xl font-bold text-white">{t('onboarding.currency.title')}</h1>
      <p className="mt-2 text-center text-sm text-white/50">
        {t('onboarding.currency.subtitle')}
      </p>

      <div className="mt-8 grid w-full grid-cols-2 gap-3">
        {currencies.map((cur, i) => (
          <motion.button
            key={cur.code}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            onClick={() => onSelect(cur.code)}
            className={cn(
              'flex items-center gap-3 rounded-2xl border p-4 transition-all duration-200',
              selected === cur.code
                ? 'border-accent-crimson bg-accent-ruby/10 shadow-lg shadow-accent-ruby/10'
                : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10',
            )}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-lg font-bold text-white">
              {cur.symbol}
            </span>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{cur.code}</p>
              <p className="text-xs text-white/40">{t(cur.nameKey)}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
