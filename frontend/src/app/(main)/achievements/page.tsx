'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, Star, Zap } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/glass-card';
import { Progress } from '@/components/ui/progress';
import { ShimmerCard } from '@/components/ui/shimmer';
import { LevelBadge } from '@/components/shared/LevelBadge';
import { cn, getLevelTitle, getLevelXp } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAppStore } from '@/stores/app.store';
import type { Achievement, GamificationProfile } from '@/types';

export default function AchievementsPage() {
  const { t } = useTranslation();
  const { user } = useAppStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [gamification, setGamification] = useState<GamificationProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ach, g] = await Promise.all([
        api.getMyAchievements(),
        api.getGamificationProfile(),
      ]);
      setAchievements(ach);
      setGamification(g);
    } catch {}
    setLoading(false);
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-4 pt-4">
          {[1, 2, 3, 4].map((i) => <ShimmerCard key={i} />)}
        </div>
      </PageContainer>
    );
  }

  const currentXp = gamification?.xp || user?.xp || 0;
  const currentLevel = gamification?.level || user?.level || 1;
  const xpToNext = getLevelXp(currentLevel + 1);
  const xpProgress = (currentXp / xpToNext) * 100;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <PageContainer>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pt-4">
        <h1 className="text-xl font-bold text-white">{t('achievements.title')}</h1>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-3">
            <LevelBadge level={currentLevel} showTitle />
            <div className="text-right">
              <p className="text-xs text-white/40">{t('achievements.xp')}</p>
              <p className="text-sm font-bold text-white">{currentXp} / {xpToNext}</p>
            </div>
          </div>
          <Progress value={xpProgress} size="md" color="purple" />
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1">
              <Trophy size={14} className="text-accent-orange" />
              <span className="text-xs text-white/50">{unlockedCount}/{achievements.length} {t('achievements.unlocked')}</span>
            </div>
            <span className="text-xs text-white/30">{getLevelTitle(currentLevel)}</span>
          </div>
        </GlassCard>

        <div className="grid grid-cols-2 gap-3">
          {achievements.map((ach, i) => (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <GlassCard
                className={cn(
                  'p-4 transition-all',
                  ach.unlocked ? '' : 'opacity-50',
                )}
              >
                <div className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-2xl mb-3',
                  ach.unlocked ? 'bg-accent-orange/20' : 'bg-white/5',
                )}>
                  {ach.unlocked ? (
                    <Trophy size={22} className="text-accent-orange" />
                  ) : (
                    <Lock size={18} className="text-white/30" />
                  )}
                </div>
                <h4 className="text-sm font-semibold text-white">{ach.name}</h4>
                <p className="mt-0.5 text-[10px] text-white/40 leading-tight">{ach.description}</p>
                <div className="mt-2 flex items-center gap-1">
                  <Star size={10} className="text-accent-rose" />
                  <span className="text-[10px] font-medium text-accent-rose">+{ach.xpReward} {t('achievements.reward')}</span>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <div className="h-6" />
      </motion.div>
    </PageContainer>
  );
}
