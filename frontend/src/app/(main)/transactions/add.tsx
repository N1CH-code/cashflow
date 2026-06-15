'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Sparkles,
  Zap, Brain, Camera,
} from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { useAppStore } from '@/stores/app.store';
import type { TransactionType, Category, Currency } from '@/types';

const quickAmounts = [5, 10, 20, 50, 100];

const defaultCategories: { icon: string; name: string; color: string }[] = [
  { icon: 'utensils-crossed', name: 'Food', color: '#F59E0B' },
  { icon: 'car', name: 'Transport', color: '#3B82F6' },
  { icon: 'shopping-cart', name: 'Shopping', color: '#EC4899' },
  { icon: 'coffee', name: 'Coffee', color: '#8B5CF6' },
  { icon: 'plane', name: 'Travel', color: '#06B6D4' },
  { icon: 'popcorn', name: 'Entertainment', color: '#22C55E' },
  { icon: 'heart-pulse', name: 'Health', color: '#EF4444' },
  { icon: 'laptop', name: 'Tech', color: '#6366F1' },
  { icon: 'book-open', name: 'Education', color: '#F97316' },
  { icon: 'shirt', name: 'Clothing', color: '#A855F7' },
  { icon: 'package', name: 'Bills', color: '#14B8A6' },
  { icon: 'repeat', name: 'Subscription', color: '#6B7280' },
  { icon: 'file-text', name: 'Documents', color: '#F59E0B' },
  { icon: 'more-horizontal', name: 'Other', color: '#9CA3AF' },
];

interface AddTransactionSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const currencies: { value: Currency; symbol: string }[] = [
  { value: 'EUR', symbol: '\u20AC' },
  { value: 'USD', symbol: '\u0024' },
  { value: 'RUB', symbol: '\u20BD' },
];

export function AddTransactionSheet({ isOpen, onClose }: AddTransactionSheetProps) {
  const { t } = useTranslation();
  const preferredCurrency = useAppStore((s) => s.preferredCurrency);
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [currency, setCurrency] = useState<Currency>(preferredCurrency || 'EUR');
  const [aiMode, setAiMode] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAmountInput = (val: string) => {
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
      setAmount(val);
    }
  };

  const handleQuickAmount = (val: number) => {
    setAmount(String(val));
  };

  const handleAiAnalyze = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    try {
      const result = await api.analyzeText(aiText);
      if (result.amount) setAmount(String(result.amount));
      if (result.category) setSelectedCategory(result.category);
      if (result.description) setDescription(result.description);
      if (result.type) setType(result.type);
    } catch {}
    setAiLoading(false);
    setAiMode(false);
    setAiText('');
  };

  const handleSubmit = async () => {
    if (!amount || !selectedCategory) return;
    setSubmitting(true);
    try {
      const dateStr = date === 'today'
        ? new Date().toISOString()
        : date === 'yesterday'
          ? new Date(Date.now() - 86400000).toISOString()
          : new Date().toISOString();

      await api.createTransaction({
        type,
        amount: parseFloat(amount),
        categoryId: selectedCategory,
        currency,
        description: description || undefined,
        date: dateStr,
      });
      onClose();
      reset();
    } catch {}
    setSubmitting(false);
  };

  const reset = () => {
    setType('EXPENSE');
    setAmount('');
    setSelectedCategory(null);
    setDescription('');
    setDate('today');
    setCurrency('EUR');
    setAiMode(false);
    setAiText('');
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title={t('transactions.add.title')}>
      <div className="space-y-5">
        <div className="flex rounded-xl bg-dark-surface p-1">
          <button
            onClick={() => setType('EXPENSE')}
            className={cn(
              'flex-1 rounded-lg py-2 text-sm font-medium transition-all',
              type === 'EXPENSE'
                ? 'bg-accent-red/20 text-accent-red'
                : 'text-white/40 hover:text-white/70',
            )}
          >
            {t('transactions.add.expense')}
          </button>
          <button
            onClick={() => setType('INCOME')}
            className={cn(
              'flex-1 rounded-lg py-2 text-sm font-medium transition-all',
              type === 'INCOME'
                ? 'bg-accent-green/20 text-accent-green'
                : 'text-white/40 hover:text-white/70',
            )}
          >
            {t('transactions.add.income')}
          </button>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-white/50 uppercase">{t('transactions.add.quickAmounts')}</p>
          <div className="flex gap-2">
            {quickAmounts.map((q) => (
              <button
                key={q}
                onClick={() => handleQuickAmount(q)}
                className={cn(
                  'flex-1 rounded-xl py-2 text-sm font-medium transition-all',
                  amount === String(q)
                    ? 'bg-accent-ruby/20 text-accent-rose border border-accent-ruby/30'
                    : 'bg-white/5 text-white/50 hover:bg-white/10',
                )}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <Input
          label={t('transactions.add.amount')}
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => handleAmountInput(e.target.value)}
        />

        <div>
          <p className="mb-2 text-xs font-medium text-white/50 uppercase">{t('transactions.add.currency')}</p>
          <div className="flex gap-2">
            {currencies.map((c) => (
              <button
                key={c.value}
                onClick={() => setCurrency(c.value)}
                className={cn(
                  'flex-1 rounded-xl py-3 text-sm font-medium transition-all',
                  currency === c.value
                    ? 'bg-accent-ruby/20 text-accent-rose border border-accent-ruby/30'
                    : 'bg-white/5 text-white/50 hover:bg-white/10',
                )}
              >
                {c.symbol} {c.value}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-white/50 uppercase">{t('transactions.add.category')}</p>
          <div className="grid grid-cols-4 gap-2">
            {defaultCategories.map((cat) => {
              const catKey = cat.name.toLowerCase();
              const catName = t(`categories.${catKey}`, cat.name);
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl p-2 transition-all',
                    selectedCategory === cat.name
                      ? 'bg-accent-ruby/20 border border-accent-ruby/30'
                      : 'bg-white/5 border border-transparent hover:bg-white/10',
                  )}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: cat.color + '20' }}>
                    <span role="img" className="text-sm">{cat.icon}</span>
                  </span>
                  <span className="text-[10px] text-white/60 truncate w-full text-center">{catName}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Input
          label={t('transactions.add.description')}
          placeholder={t('transactions.add.descriptionPlaceholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div>
          <p className="mb-2 text-xs font-medium text-white/50 uppercase">{t('transactions.add.date')}</p>
          <div className="flex gap-2">
            {(['today', 'yesterday'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDate(d)}
                className={cn(
                  'flex-1 rounded-xl py-2 text-sm font-medium capitalize transition-all',
                  date === d
                    ? 'bg-accent-ruby/20 text-accent-rose border border-accent-ruby/30'
                    : 'bg-white/5 text-white/50 hover:bg-white/10',
                )}
              >
                {t(`transactions.add.${d}`)}
              </button>
            ))}
          </div>
        </div>

        {aiMode ? (
          <div className="space-y-3 rounded-2xl border border-accent-ruby/20 bg-accent-ruby/5 p-4">
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-accent-rose" />
              <span className="text-sm font-medium text-white">{t('transactions.add.naturalInput')}</span>
            </div>
            <Input
              placeholder={t('transactions.add.naturalPlaceholder')}
              value={aiText}
              onChange={(e) => setAiText(e.target.value)}
            />
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setAiMode(false)}>
                {t('transactions.add.cancel')}
              </Button>
              <Button
                size="sm"
                onClick={handleAiAnalyze}
                loading={aiLoading}
                disabled={!aiText.trim()}
              >
                <Sparkles size={14} />
                {t('transactions.add.analyze')}
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAiMode(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-accent-ruby/20 bg-accent-ruby/5 py-3 text-sm font-medium text-accent-rose transition-colors hover:bg-accent-ruby/10"
          >
            <Sparkles size={16} />
            {t('transactions.add.enterNaturally')}
          </button>
        )}

        <Button
          onClick={handleSubmit}
          size="lg"
          className="w-full"
          disabled={!amount || !selectedCategory}
          loading={submitting}
        >
          <ArrowRight size={18} />
          {type === 'INCOME' ? t('transactions.add.addIncome') : t('transactions.add.addExpense')}
        </Button>
      </div>
    </Sheet>
  );
}
