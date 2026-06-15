'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Target, Gift, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/glass-card';
import { Progress } from '@/components/ui/progress';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { ShimmerCard } from '@/components/ui/shimmer';
import { cn, formatCurrency, getCategoryIcon } from '@/lib/utils';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { useAppStore } from '@/stores/app.store';
import type { Goal } from '@/types';

const goalIcons = ['piggy-bank', 'plane', 'car', 'home', 'graduation-cap', 'heart', 'gift', 'laptop', 'camera', 'music'];

export default function GoalsPage() {
  const { t } = useTranslation();
  const { user, preferredCurrency } = useAppStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addTarget, setAddTarget] = useState('');
  const [addIcon, setAddIcon] = useState('piggy-bank');
  const [addDeadline, setAddDeadline] = useState('');
  const [adding, setAdding] = useState(false);
  const [fundingGoal, setFundingGoal] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState('');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const data = await api.getGoals();
      setGoals(data);
    } catch {}
    setLoading(false);
  };

  const handleAddGoal = async () => {
    if (!addName || !addTarget) return;
    setAdding(true);
    try {
      await api.createGoal({
        name: addName,
        targetAmount: parseFloat(addTarget),
        icon: addIcon,
        deadline: addDeadline || undefined,
      });
      await fetchGoals();
      setShowAdd(false);
      setAddName('');
      setAddTarget('');
      setAddIcon('piggy-bank');
      setAddDeadline('');
    } catch {}
    setAdding(false);
  };

  const handleAddFunds = async (goalId: string) => {
    if (!fundAmount) return;
    try {
      await api.addFundsToGoal(goalId, { amount: parseFloat(fundAmount) });
      await fetchGoals();
      setFundingGoal(null);
      setFundAmount('');
    } catch {}
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-4 pt-4">
          {[1, 2, 3].map((i) => <ShimmerCard key={i} />)}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">{t('goals.title')}</h1>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={16} />
            {t('goals.add')}
          </Button>
        </div>

        {goals.length === 0 ? (
          <div className="flex flex-col items-center pt-12">
            <Target size={48} className="text-white/20" />
            <p className="mt-4 text-sm text-white/30">{t('goals.empty')}</p>
            <p className="text-xs text-white/20">{t('goals.emptyHint')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <GlassCard key={goal.id} className="p-5" hover>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-2xl">
                    {getCategoryIcon(goal.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{goal.name}</h4>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <AnimatedNumber
                        value={goal.savedAmount}
                        formatter={(v) => formatCurrency(v, preferredCurrency || user?.currency)}
                        className="text-base font-bold text-white"
                      />
                      <span className="text-xs text-white/40">/ {formatCurrency(goal.targetAmount, preferredCurrency || user?.currency)}</span>
                    </div>
                    <Progress value={goal.progress} size="sm" className="mt-2" />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-white/30">{goal.progress.toFixed(0)}% {t('goalCard.complete')}</span>
                      {goal.daysRemaining !== undefined && (
                        <div className="flex items-center gap-1">
                          <Calendar size={10} className="text-white/30" />
                          <span className="text-[10px] text-white/30">{goal.daysRemaining}d left</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setFundingGoal(goal.id)}
                    className="shrink-0 rounded-xl bg-accent-ruby/15 px-3 py-2 text-xs font-medium text-accent-rose transition-colors hover:bg-accent-ruby/25"
                  >
                    {t('goals.fund')}
                  </button>
                </div>

                <AnimatePresence>
                  {fundingGoal === goal.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 flex items-center gap-2 overflow-hidden"
                    >
                      <Input
                        type="number"
                        placeholder="Amount"
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                        className="flex-1"
                      />
                      <Button size="sm" onClick={() => handleAddFunds(goal.id)} disabled={!fundAmount}>
                        Add
                      </Button>
                      <button onClick={() => setFundingGoal(null)} className="p-1">
                        <X size={16} className="text-white/40" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full max-w-lg rounded-t-3xl border border-white/10 bg-dark-card/95 backdrop-blur-2xl p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-4 flex h-1 w-10 rounded-full bg-white/20" />
              <h2 className="text-lg font-semibold text-white mb-4">{t('goals.newGoal')}</h2>

              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-medium text-white/50 uppercase">{t('goals.icon')}</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {goalIcons.map((ic) => (
                      <button
                        key={ic}
                        onClick={() => setAddIcon(ic)}
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg transition-all',
                          addIcon === ic ? 'bg-accent-ruby/20 border border-accent-ruby/30' : 'bg-white/5 hover:bg-white/10',
                        )}
                      >
                        {getCategoryIcon(ic)}
                      </button>
                    ))}
                  </div>
                </div>

                <Input label={t('goals.goalName')} placeholder={t('goals.namePlaceholder')} value={addName} onChange={(e) => setAddName(e.target.value)} />
                <Input label={t('goals.targetAmount')} type="number" placeholder={t('goals.amountPlaceholder')} value={addTarget} onChange={(e) => setAddTarget(e.target.value)} />
                <Input label={t('goals.deadline')} type="date" value={addDeadline} onChange={(e) => setAddDeadline(e.target.value)} />

                <Button onClick={handleAddGoal} size="lg" className="w-full" loading={adding} disabled={!addName || !addTarget}>
                  <Target size={16} />
                  {t('goals.createGoal')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
