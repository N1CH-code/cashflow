'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface StepIncomeProps {
  onSubmit: (income: number, salaryDate: number) => void;
  initialIncome: number;
  initialDate: number;
}

export function StepIncome({ onSubmit, initialIncome, initialDate }: StepIncomeProps) {
  const { t } = useTranslation();
  const [income, setIncome] = useState(initialIncome ? String(initialIncome) : '');
  const [salaryDate, setSalaryDate] = useState(initialDate);

  const handleSubmit = () => {
    const amount = parseFloat(income);
    if (amount > 0) {
      onSubmit(amount, salaryDate);
    }
  };

  const dates = Array.from({ length: 28 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-green to-accent-cyan shadow-xl"
      >
        <Wallet size={30} className="text-white" />
      </motion.div>

      <h1 className="text-center text-2xl font-bold text-white">{t('onboarding.income.title')}</h1>
      <p className="mt-2 text-center text-sm text-white/50">
        {t('onboarding.income.subtitle')}
      </p>

      <div className="mt-8 w-full">
        <Input
          label={t('onboarding.income.monthlyIncome')}
          type="number"
          placeholder="0.00"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
        />
      </div>

      <div className="mt-6 w-full">
        <div className="mb-2 flex items-center gap-2">
          <CalendarDays size={14} className="text-white/40" />
          <span className="text-sm font-medium text-white/70">{t('onboarding.income.salaryDay')}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {dates.map((d) => (
            <button
              key={d}
              onClick={() => setSalaryDate(d)}
              className={cn(
                'h-9 w-9 rounded-xl text-sm font-medium transition-all duration-200',
                salaryDate === d
                  ? 'bg-accent-ruby text-white shadow-lg shadow-accent-ruby/30'
                  : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white',
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 w-full"
      >
        <Button
          onClick={handleSubmit}
          size="lg"
          className="w-full"
          disabled={!income || parseFloat(income) <= 0}
        >
          {t('onboarding.income.continue')}
        </Button>
      </motion.div>
    </div>
  );
}
