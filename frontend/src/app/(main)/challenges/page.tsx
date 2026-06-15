'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, PiggyBank, ListChecks, CalendarCheck, Banknote, Target, CheckCircle, Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Progress } from '@/components/ui/progress';
import { ShimmerCard } from '@/components/ui/shimmer';
import { PageContainer } from '@/components/layout/PageContainer';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { Challenge } from '@/types';

const iconMap: Record<string, any> = {
  trophy: Trophy,
  flame: Flame,
  'piggy-bank': PiggyBank,
  'list-checks': ListChecks,
  'calendar-check': CalendarCheck,
  banknote: Banknote,
  target: Target,
  'check-circle': CheckCircle,
};

export default function ChallengesPage() {
  const { t, locale } = useTranslation();
  const [data, setData] = useState<{ available: Challenge[]; active: Challenge[]; completed: Challenge[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'available' | 'completed'>('active');
  const [joining, setJoining] = useState<string | null>(null);

  useEffect(() => { fetchChallenges(); }, []);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const res = await api.getChallenges();
      setData(res);
    } catch {}
    setLoading(false);
  };

  const handleJoin = async (id: string) => {
    setJoining(id);
    try {
      await api.joinChallenge(id);
      await fetchChallenges();
    } catch {}
    setJoining(null);
  };

  const ChallengeCard = ({ challenge, showJoin }: { challenge: Challenge; showJoin?: boolean }) => {
    const Icon = iconMap[challenge.icon] || Trophy;
    const title = locale === 'ru' && challenge.titleRu ? challenge.titleRu : challenge.title;
    const desc = locale === 'ru' && challenge.descriptionRu ? challenge.descriptionRu : challenge.description;

    return (
      <GlassCard className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-ruby/15 text-accent-rose">
            <Icon size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              {showJoin && (
                <Button
                  size="sm"
                  onClick={() => handleJoin(challenge.id)}
                  loading={joining === challenge.id}
                  className="shrink-0"
                >
                  <Plus size={14} />
                  {t('challenges.join')}
                </Button>
              )}
            </div>
            <p className="mt-0.5 text-xs text-white/50 line-clamp-2">{desc}</p>
            {challenge.progress !== undefined && (
              <div className="mt-3">
                <Progress value={challenge.progress} size="sm" />
                <p className="mt-1 text-[10px] text-white/40">{challenge.progress.toFixed(0)}%</p>
              </div>
            )}
            <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-yellow-400">
              <Zap size={12} />
              +{challenge.xpReward} XP
            </div>
          </div>
        </div>
      </GlassCard>
    );
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

  const tabs = [
    { key: 'active', label: t('challenges.active'), count: data?.active?.length || 0 },
    { key: 'available', label: t('challenges.available'), count: data?.available?.length || 0 },
    { key: 'completed', label: t('challenges.completed'), count: data?.completed?.length || 0 },
  ] as const;

  return (
    <PageContainer>
      <div className="space-y-4 pt-4">
        <div>
          <h1 className="text-xl font-bold text-white">{t('challenges.title')}</h1>
          <p className="text-xs text-white/40">{t('challenges.subtitle')}</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all whitespace-nowrap',
                tab === key
                  ? 'bg-accent-ruby/20 text-accent-rose border border-accent-ruby/30'
                  : 'bg-white/5 text-white/50 hover:bg-white/10',
              )}
            >
              {label}
              <span className="text-[10px] opacity-60">{count}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {tab === 'active' && (
              data?.active?.length ? (
                data.active.map((c) => <ChallengeCard key={c.id} challenge={c} />)
              ) : (
                <div className="flex flex-col items-center pt-8">
                  <Trophy size={40} className="text-white/20" />
                  <p className="mt-3 text-sm text-white/30">{t('challenges.noActive')}</p>
                  <p className="text-xs text-white/20">{t('challenges.noActiveHint')}</p>
                </div>
              )
            )}

            {tab === 'available' && (
              data?.available?.length ? (
                data.available.map((c) => <ChallengeCard key={c.id} challenge={c} showJoin />)
              ) : (
                <div className="flex flex-col items-center pt-8">
                  <CheckCircle size={40} className="text-white/20" />
                  <p className="mt-3 text-sm text-white/30">{t('challenges.noAvailable')}</p>
                </div>
              )
            )}

            {tab === 'completed' && (
              data?.completed?.length ? (
                data.completed.map((c) => (
                  <div key={c.id} className="opacity-60">
                    <ChallengeCard challenge={c} />
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center pt-8">
                  <Trophy size={40} className="text-white/20" />
                  <p className="mt-3 text-sm text-white/30">{t('challenges.noCompleted')}</p>
                </div>
              )
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageContainer>
  );
}
