'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassCard } from '@/components/ui/glass-card';
import { PageContainer } from '@/components/layout/PageContainer';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/lib/i18n';
import { formatCurrency } from '@/lib/utils';
import { useAppStore } from '@/stores/app.store';

interface YearData {
  year: number;
  amount: number;
  contribution: number;
  interest: number;
}

export default function CalculatorPage() {
  const { t } = useTranslation();
  const { preferredCurrency } = useAppStore();
  const [initial, setInitial] = useState('1000');
  const [monthly, setMonthly] = useState('100');
  const [rate, setRate] = useState('7');
  const [years, setYears] = useState('10');
  const [result, setResult] = useState<{
    futureValue: number;
    totalContributions: number;
    totalInterest: number;
    yearData: YearData[];
  } | null>(null);

  const calculate = () => {
    const P = parseFloat(initial) || 0;
    const M = parseFloat(monthly) || 0;
    const r = (parseFloat(rate) || 0) / 100 / 12;
    const n = (parseInt(years) || 1) * 12;

    const yearData: YearData[] = [];
    let balance = P;

    for (let y = 1; y <= parseInt(years) || 1; y++) {
      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + r) + M;
      }
      yearData.push({
        year: y,
        amount: Math.round(balance * 100) / 100,
        contribution: Math.round((P + M * y * 12) * 100) / 100,
        interest: Math.round((balance - P - M * y * 12) * 100) / 100,
      });
    }

    const final = yearData[yearData.length - 1];
    setResult({
      futureValue: final.amount,
      totalContributions: final.contribution,
      totalInterest: final.interest,
      yearData,
    });
  };

  return (
    <PageContainer>
      <div className="space-y-4 pt-4">
        <div>
          <h1 className="text-xl font-bold text-white">{t('calculator.title')}</h1>
          <p className="text-xs text-white/40">{t('calculator.subtitle')}</p>
        </div>

        <GlassCard className="space-y-3 p-4">
          <Input
            label={t('calculator.initialAmount')}
            type="number"
            value={initial}
            onChange={(e) => setInitial(e.target.value)}
            prefix="$"
          />
          <Input
            label={t('calculator.monthlyContribution')}
            type="number"
            value={monthly}
            onChange={(e) => setMonthly(e.target.value)}
            prefix="$"
          />
          <Input
            label={t('calculator.interestRate')}
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            suffix="%"
          />
          <Input
            label={t('calculator.years')}
            type="number"
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />

          <Button onClick={calculate} size="lg" className="w-full">
            <TrendingUp size={16} />
            {t('calculator.calculate')}
          </Button>
        </GlassCard>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="grid grid-cols-3 gap-3">
              <GlassCard className="p-3 text-center">
                <TrendingUp size={18} className="mx-auto text-green-400" />
                <p className="mt-1 text-[10px] text-white/40">{t('calculator.futureValue')}</p>
                <AnimatedNumber
                  value={result.futureValue}
                  formatter={(v) => formatCurrency(v, preferredCurrency || 'USD')}
                  className="mt-1 text-sm font-bold text-white"
                />
              </GlassCard>
              <GlassCard className="p-3 text-center">
                <DollarSign size={18} className="mx-auto text-blue-400" />
                <p className="mt-1 text-[10px] text-white/40">{t('calculator.totalContributions')}</p>
                <AnimatedNumber
                  value={result.totalContributions}
                  formatter={(v) => formatCurrency(v, preferredCurrency || 'USD')}
                  className="mt-1 text-sm font-bold text-white"
                />
              </GlassCard>
              <GlassCard className="p-3 text-center">
                <PieChart size={18} className="mx-auto text-yellow-400" />
                <p className="mt-1 text-[10px] text-white/40">{t('calculator.totalInterest')}</p>
                <AnimatedNumber
                  value={result.totalInterest}
                  formatter={(v) => formatCurrency(v, preferredCurrency || 'USD')}
                  className="mt-1 text-sm font-bold text-white"
                />
              </GlassCard>
            </div>

            <GlassCard className="p-4">
              <p className="mb-3 text-xs font-semibold text-white/60 uppercase">{t('calculator.year')}-by-{t('calculator.year')}</p>
              <div className="space-y-2">
                {result.yearData.map((yd) => {
                  const maxAmount = result.yearData[result.yearData.length - 1].amount;
                  return (
                    <div key={yd.year} className="flex items-center gap-3">
                      <span className="w-8 text-[10px] font-medium text-white/50">Y{yd.year}</span>
                      <div className="flex-1">
                        <div className="flex h-5 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="rounded-l-full bg-gradient-to-r from-accent-ruby to-accent-blue transition-all"
                            style={{ width: `${(yd.amount / maxAmount) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-20 text-right text-[10px] font-medium text-white/70">
                        {formatCurrency(yd.amount, preferredCurrency || 'USD')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>
    </PageContainer>
  );
}
