'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAppStore } from '@/stores/app.store';
import { useTranslation } from '@/lib/i18n';
import { StepWelcome } from './steps/welcome';
import { StepCurrency } from './steps/currency';
import { StepIncome } from './steps/income';
import { StepQuiz } from './steps/quiz';
import { StepResult } from './steps/result';

const TOTAL_STEPS = 5;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

export default function OnboardingPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [currency, setCurrency] = useState<string>('');
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [salaryDate, setSalaryDate] = useState<number>(1);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{ type: string; score: number; description: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { updateUser } = useAppStore();

  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const handleWelcomeContinue = async () => {
    try {
      await api.completeOnboardingStep(1);
    } catch (e) { console.error('[onboarding] step 1 failed', e); }
    goNext();
  };

  const handleCurrencySelect = async (cur: string) => {
    setCurrency(cur);
    try {
      await api.completeOnboardingStep(2, { currency: cur });
      await api.setCurrency(cur);
    } catch (e) { console.error('[onboarding] step 2 failed', e); }
    goNext();
  };

  const handleIncomeSubmit = async (income: number, sDate: number) => {
    setMonthlyIncome(income);
    setSalaryDate(sDate);
    try {
      await api.completeOnboardingStep(3, { monthlyIncome: income, salaryDate: sDate });
      await api.setIncome(income, sDate);
    } catch (e) { console.error('[onboarding] step 3 failed', e); }
    goNext();
  };

  const handleQuizSubmit = async (answers: number[]) => {
    setQuizAnswers(answers);
    setSubmitting(true);
    try {
      await api.completeOnboardingStep(4, { answers });
      const quizResult = await api.submitQuiz(answers);
      setResult(quizResult);
      await api.completeOnboarding();
      updateUser({ onboardingComplete: true });
      goNext();
    } catch (e) { console.error('[onboarding] step 4 failed', e); }
    setSubmitting(false);
  };

  const handleFinish = () => {
    window.location.href = '/';
  };

  const renderStep = () => {
    switch (step) {
      case 0: return <StepWelcome onNext={handleWelcomeContinue} />;
      case 1: return <StepCurrency onSelect={handleCurrencySelect} selected={currency} />;
      case 2: return <StepIncome onSubmit={handleIncomeSubmit} initialIncome={monthlyIncome} initialDate={salaryDate} />;
      case 3: return <StepQuiz onSubmit={handleQuizSubmit} submitting={submitting} />;
      case 4: return result ? <StepResult result={result} onFinish={handleFinish} /> : null;
      default: return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-dark-bg px-4">
      <div className="flex-1 pt-6">
        <div className="mb-6 flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-gradient-to-r from-accent-ruby to-accent-crimson' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <p className="mb-6 text-center text-xs font-medium text-white/30">
          {t('onboarding.stepIndicator', 'Step {current} of {total}').replace('{current}', String(step + 1)).replace('{total}', String(TOTAL_STEPS))}
        </p>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between pb-10 pt-4">
        {step > 0 && step < 4 ? (
          <Button variant="ghost" onClick={goBack} className="flex items-center gap-1">
            <ArrowLeft size={16} />
            {t('onboarding.back')}
          </Button>
        ) : step < 4 ? (
          <div />
        ) : null}
      </div>
    </div>
  );
}
