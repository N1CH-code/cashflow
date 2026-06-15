'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Settings, LogOut, ChevronRight, Gift, Trophy,
  Bell, Sparkles, Zap, Share2, Crown, Target, Users, Calculator, BookOpen, Landmark,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';
import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/glass-card';
import { LevelBadge } from '@/components/shared/LevelBadge';
import { FinancialTypeCard } from '@/components/shared/FinancialTypeCard';
import { Badge } from '@/components/ui/badge';
import { ShimmerCard } from '@/components/ui/shimmer';
import { cn, formatCompactCurrency, getLevelTitle, getLevelXp } from '@/lib/utils';
import { useAppStore } from '@/stores/app.store';
import { useTelegram } from '@/components/layout/TelegramProvider';
import { api } from '@/lib/api';
import type { GamificationProfile, IQBreakdown } from '@/types';

export default function ProfilePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, logout } = useAppStore();
  const { hapticFeedback } = useTelegram();
  const [gamification, setGamification] = useState<GamificationProfile | null>(null);
  const [iq, setIq] = useState<IQBreakdown | null>(null);
  const [stats, setStats] = useState({ transactions: 0, streak: 0, goalsCompleted: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const [g, iqData] = await Promise.all([
        api.getGamificationProfile(),
        api.getFinancialIQ().catch(() => null),
      ]);
      setGamification(g);
      setIq(iqData);
      if (g) {
        setStats({ transactions: (g as any).totalTransactions || 0, streak: g.streak || 0, goalsCompleted: (g as any).goalsCompleted || 0 });
      }
    } catch {}
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  const currentXp = gamification?.xp || 0;
  const currentLevel = gamification?.level || user?.level || 1;
  const xpToNext = getLevelXp(currentLevel + 1);
  const xpProgress = (currentXp / xpToNext) * 100;

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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pt-4">
        <GlassCard className="p-5 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent-ruby to-accent-crimson text-3xl font-bold text-white shadow-2xl">
            {user?.firstName?.[0] || 'U'}
          </div>
          <h2 className="mt-3 text-lg font-bold text-white">{user?.firstName} {user?.lastName}</h2>
          <p className="text-xs text-white/40">@{user?.telegramUsername}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <Badge variant="premium" className="cursor-pointer" onClick={() => router.push('/subscribe')}>
              <Crown size={12} />
              {t(`common.${(user?.plan || 'free').toLowerCase()}`)}
            </Badge>
            <Badge variant="info">
              <Trophy size={12} />
              {t('profile.lvl')} {currentLevel}
            </Badge>
          </div>
        </GlassCard>

        {gamification && (
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-2">
              <LevelBadge level={currentLevel} showTitle size="sm" />
              <span className="text-xs text-white/30">{currentXp} / {xpToNext} XP</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-gradient-to-r from-accent-ruby to-accent-crimson transition-all duration-700" style={{ width: `${Math.min(xpProgress, 100)}%` }} />
            </div>
          </GlassCard>
        )}

        {user?.financialType && (
          <FinancialTypeCard type={user.financialType} />
        )}

        {iq && (
          <GlassCard className="p-5" hover onClick={() => router.push('/iq')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/40 uppercase">{t('profile.financialIq')}</p>
                <p className={cn('text-2xl font-bold mt-1', iq.total >= 80 ? 'text-accent-green' : iq.total >= 60 ? 'text-accent-orange' : 'text-accent-red')}>{iq.total}</p>
              </div>
              <ChevronRight size={18} className="text-white/30" />
            </div>
          </GlassCard>
        )}

        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-white/70 mb-3">{t('profile.statistics')}</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-white">{stats.transactions}</p>
              <p className="text-[10px] text-white/40">{t('profile.transactions')}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">{stats.streak}</p>
              <p className="text-[10px] text-white/40">{t('profile.dayStreak')}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">{stats.goalsCompleted}</p>
              <p className="text-[10px] text-white/40">{t('profile.goalsDone')}</p>
            </div>
          </div>
        </GlassCard>

        <button
          onClick={() => router.push('/settings')}
          className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-dark-card/80 p-4 backdrop-blur-xl transition-colors hover:bg-white/5"
        >
          <div className="flex items-center gap-3">
            <Settings size={18} className="text-white/40" />
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{t('profile.settings')}</p>
              <p className="text-xs text-white/40">{t('settings.salaryDate')}, {t('settings.dailyLimit')} & more</p>
            </div>
          </div>
          <ChevronRight size={18} className="text-white/30" />
        </button>

        <div className="space-y-2">
          <button
            onClick={() => router.push('/subscribe')}
            className="flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-accent-ruby/10 to-accent-crimson/10 border border-accent-ruby/20 p-4 transition-colors hover:from-accent-ruby/20"
          >
            <div className="flex items-center gap-3">
              <Crown size={18} className="text-accent-rose" />
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{t('profile.upgradePlan')}</p>
                <p className="text-xs text-white/40">{t('profile.unlockPremium')}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/30" />
          </button>

          <button
            onClick={() => router.push('/referral')}
            className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-dark-card/80 p-4 backdrop-blur-xl transition-colors hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <Gift size={18} className="text-accent-orange" />
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{t('profile.inviteFriends')}</p>
                <p className="text-xs text-white/40">{t('profile.getRewards')}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/30" />
          </button>

          <button
            onClick={() => router.push('/achievements')}
            className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-dark-card/80 p-4 backdrop-blur-xl transition-colors hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <Trophy size={18} className="text-accent-orange" />
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{t('profile.achievements')}</p>
                <p className="text-xs text-white/40">{t('profile.trackMilestones')}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/30" />
          </button>

            <button
            onClick={() => router.push('/stories')}
            className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-dark-card/80 p-4 backdrop-blur-xl transition-colors hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <Share2 size={18} className="text-accent-blue" />
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{t('profile.shareProgress')}</p>
                <p className="text-xs text-white/40">{t('profile.shareTelegram')}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/30" />
          </button>

          <button
            onClick={() => router.push('/challenges')}
            className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-dark-card/80 p-4 backdrop-blur-xl transition-colors hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <Target size={18} className="text-accent-rose" />
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{t('challenges.title')}</p>
                <p className="text-xs text-white/40">{t('challenges.subtitle')}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/30" />
          </button>

          <button
            onClick={() => router.push('/family')}
            className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-dark-card/80 p-4 backdrop-blur-xl transition-colors hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <Users size={18} className="text-green-400" />
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{t('family.title')}</p>
                <p className="text-xs text-white/40">{t('family.subtitle')}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/30" />
          </button>

          <button
            onClick={() => router.push('/calculator')}
            className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-dark-card/80 p-4 backdrop-blur-xl transition-colors hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <Calculator size={18} className="text-yellow-400" />
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{t('calculator.title')}</p>
                <p className="text-xs text-white/40">{t('calculator.subtitle')}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/30" />
          </button>

          <button
            onClick={() => router.push('/loans')}
            className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-dark-card/80 p-4 backdrop-blur-xl transition-colors hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <Landmark size={18} className="text-accent-rose" />
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{t('loans.title')}</p>
                <p className="text-xs text-white/40">{t('loans.subtitle')}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/30" />
          </button>

          <button
            onClick={() => router.push('/education')}
            className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-dark-card/80 p-4 backdrop-blur-xl transition-colors hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <BookOpen size={18} className="text-accent-blue" />
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{t('education.title')}</p>
                <p className="text-xs text-white/40">{t('education.subtitle')}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/30" />
          </button>
        </div>

        <Button variant="danger" size="lg" className="w-full" onClick={handleLogout}>
          <LogOut size={16} />
          {t('profile.logOut')}
        </Button>

        <div className="h-6" />
      </motion.div>
    </PageContainer>
  );
}
