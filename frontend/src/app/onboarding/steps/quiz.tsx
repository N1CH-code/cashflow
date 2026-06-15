'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

const questions = [
  {
    question: 'What do you do when you receive your salary?',
    answers: [
      { text: 'Immediately plan how to spend it all', value: 1 },
      { text: 'Set aside savings first, then spend the rest', value: 4 },
      { text: 'Pay bills, then see what\'s left', value: 3 },
      { text: 'Invest a portion, save some, spend wisely', value: 5 },
    ],
  },
  {
    question: 'How often do you check your bank account balance?',
    answers: [
      { text: 'Once a month when bills are due', value: 1 },
      { text: 'Once a week', value: 3 },
      { text: 'Every day', value: 4 },
      { text: 'Several times a day', value: 5 },
    ],
  },
  {
    question: 'When you see something you want but didn\'t plan to buy:',
    answers: [
      { text: 'Buy it immediately, YOLO!', value: 1 },
      { text: 'Wait a few days to think about it', value: 3 },
      { text: 'Check if I can afford it first', value: 4 },
      { text: 'Never buy unplanned items', value: 5 },
    ],
  },
  {
    question: 'What\'s your approach to saving money?',
    answers: [
      { text: 'Save whatever is left at month end', value: 2 },
      { text: 'Save a fixed amount every month', value: 4 },
      { text: 'I don\'t save regularly', value: 1 },
      { text: 'I save aggressively and invest', value: 5 },
    ],
  },
  {
    question: 'How do you feel about investing?',
    answers: [
      { text: 'Too risky, I avoid it', value: 2 },
      { text: 'I invest in safe options only', value: 3 },
      { text: 'I invest with moderate risk', value: 4 },
      { text: 'I actively invest and embrace calculated risks', value: 5 },
    ],
  },
  {
    question: 'When an unexpected expense comes up:',
    answers: [
      { text: 'It\'s a crisis, I have no funds', value: 1 },
      { text: 'I use my credit card and pay later', value: 2 },
      { text: 'I have an emergency fund for this', value: 4 },
      { text: 'I have multiple funds for different situations', value: 5 },
    ],
  },
  {
    question: 'How many bank accounts do you have?',
    answers: [
      { text: 'Just one checking account', value: 2 },
      { text: 'A checking and a savings', value: 3 },
      { text: 'Multiple accounts for different purposes', value: 4 },
      { text: 'I use a whole financial ecosystem', value: 5 },
    ],
  },
  {
    question: 'Do you track your expenses?',
    answers: [
      { text: 'Never, I just spend freely', value: 1 },
      { text: 'I check occasionally', value: 2 },
      { text: 'I use an app to track everything', value: 4 },
      { text: 'I categorize and analyze every expense', value: 5 },
    ],
  },
  {
    question: 'What would you do with an unexpected $1000?',
    answers: [
      { text: 'Go on a shopping spree', value: 1 },
      { text: 'Pay some bills with it', value: 3 },
      { text: 'Save half, spend half', value: 4 },
      { text: 'Invest it all', value: 5 },
    ],
  },
  {
    question: 'How long could you survive without income?',
    answers: [
      { text: 'Less than a week', value: 1 },
      { text: 'About a month', value: 2 },
      { text: 'A few months', value: 4 },
      { text: 'Over 6 months', value: 5 },
    ],
  },
];

interface StepQuizProps {
  onSubmit: (answers: number[]) => void;
  submitting: boolean;
}

export function StepQuiz({ onSubmit, submitting }: StepQuizProps) {
  const { t } = useTranslation();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

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
        Question {currentQ + 1} of {questions.length}
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
