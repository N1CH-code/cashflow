'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface StepQuizProps {
  onSubmit: (answers: number[]) => void;
  submitting: boolean;
}

export function StepQuiz({ onSubmit, submitting }: StepQuizProps) {
  const { t, locale } = useTranslation();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const questions = useMemo(() => [
    {
      question: t('onboarding.quiz.q1'),
      answers: [
        { text: t('onboarding.quiz.q1a1'), value: 1 },
        { text: t('onboarding.quiz.q1a2'), value: 4 },
        { text: t('onboarding.quiz.q1a3'), value: 3 },
        { text: t('onboarding.quiz.q1a4'), value: 5 },
      ],
    },
    {
      question: t('onboarding.quiz.q2'),
      answers: [
        { text: t('onboarding.quiz.q2a1'), value: 1 },
        { text: t('onboarding.quiz.q2a2'), value: 3 },
        { text: t('onboarding.quiz.q2a3'), value: 4 },
        { text: t('onboarding.quiz.q2a4'), value: 5 },
      ],
    },
    {
      question: t('onboarding.quiz.q3'),
      answers: [
        { text: t('onboarding.quiz.q3a1'), value: 1 },
        { text: t('onboarding.quiz.q3a2'), value: 3 },
        { text: t('onboarding.quiz.q3a3'), value: 4 },
        { text: t('onboarding.quiz.q3a4'), value: 5 },
      ],
    },
    {
      question: t('onboarding.quiz.q4'),
      answers: [
        { text: t('onboarding.quiz.q4a1'), value: 2 },
        { text: t('onboarding.quiz.q4a2'), value: 4 },
        { text: t('onboarding.quiz.q4a3'), value: 1 },
        { text: t('onboarding.quiz.q4a4'), value: 5 },
      ],
    },
    {
      question: t('onboarding.quiz.q5'),
      answers: [
        { text: t('onboarding.quiz.q5a1'), value: 2 },
        { text: t('onboarding.quiz.q5a2'), value: 3 },
        { text: t('onboarding.quiz.q5a3'), value: 4 },
        { text: t('onboarding.quiz.q5a4'), value: 5 },
      ],
    },
    {
      question: t('onboarding.quiz.q6'),
      answers: [
        { text: t('onboarding.quiz.q6a1'), value: 1 },
        { text: t('onboarding.quiz.q6a2'), value: 2 },
        { text: t('onboarding.quiz.q6a3'), value: 4 },
        { text: t('onboarding.quiz.q6a4'), value: 5 },
      ],
    },
    {
      question: t('onboarding.quiz.q7'),
      answers: [
        { text: t('onboarding.quiz.q7a1'), value: 2 },
        { text: t('onboarding.quiz.q7a2'), value: 3 },
        { text: t('onboarding.quiz.q7a3'), value: 4 },
        { text: t('onboarding.quiz.q7a4'), value: 5 },
      ],
    },
    {
      question: t('onboarding.quiz.q8'),
      answers: [
        { text: t('onboarding.quiz.q8a1'), value: 1 },
        { text: t('onboarding.quiz.q8a2'), value: 2 },
        { text: t('onboarding.quiz.q8a3'), value: 4 },
        { text: t('onboarding.quiz.q8a4'), value: 5 },
      ],
    },
    {
      question: t('onboarding.quiz.q9'),
      answers: [
        { text: t('onboarding.quiz.q9a1'), value: 1 },
        { text: t('onboarding.quiz.q9a2'), value: 3 },
        { text: t('onboarding.quiz.q9a3'), value: 4 },
        { text: t('onboarding.quiz.q9a4'), value: 5 },
      ],
    },
    {
      question: t('onboarding.quiz.q10'),
      answers: [
        { text: t('onboarding.quiz.q10a1'), value: 1 },
        { text: t('onboarding.quiz.q10a2'), value: 2 },
        { text: t('onboarding.quiz.q10a3'), value: 4 },
        { text: t('onboarding.quiz.q10a4'), value: 5 },
      ],
    },
  ], [locale]);

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      onSubmit(newAnswers);
    }
  };

  const q = questions[currentQ];

  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 flex items-center gap-1">
        {questions.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 w-6 rounded-full transition-all duration-300',
              i < answers.length ? 'bg-accent-ruby' : i === answers.length ? 'bg-accent-ruby/50' : 'bg-white/10',
            )}
          />
        ))}
      </div>

      <p className="mb-1 text-xs font-medium text-white/30">
        {t('onboarding.quiz.step', 'Question {current} of {total}').replace('{current}', String(currentQ + 1)).replace('{total}', String(questions.length))}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.2 }}
          className="w-full"
        >
          <h2 className="mt-4 text-center text-lg font-semibold text-white">
            {q.question}
          </h2>

          <div className="mt-6 flex flex-col gap-2">
            {q.answers.map((a, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(a.value)}
                disabled={submitting}
                className={cn(
                  'w-full rounded-2xl border p-4 text-left text-sm transition-all duration-200',
                  'border-white/5 bg-white/5 hover:border-accent-ruby/50 hover:bg-accent-ruby/5',
                  'disabled:opacity-50',
                )}
              >
                {a.text}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {submitting && (
        <div className="mt-6">
          <Button loading disabled>
            {t('onboarding.quiz.analyzing')}
          </Button>
        </div>
      )}
    </div>
  );
}
