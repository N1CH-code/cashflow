'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { Gift, Copy, Share2, Users, Trophy, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/glass-card';
import { ShimmerCard } from '@/components/ui/shimmer';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAppStore } from '@/stores/app.store';
import { useTelegram } from '@/components/layout/TelegramProvider';
import type { ReferralInfo } from '@/types';

export default function ReferralPage() {
  const { t } = useTranslation();
  const { user } = useAppStore();
  const { hapticFeedback } = useTelegram();
  const [referral, setReferral] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [leaderboard, setLeaderboard] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    setLoading(true);
    try {
      const data = await api.getReferrals();
      setReferral(data);
      setLeaderboard(data.leaderboard || []);
    } catch {}
    setLoading(false);
  };

  const handleCopy = () => {
    if (!referral?.code) return;
    navigator.clipboard.writeText(referral.code);
    setCopied(true);
    hapticFeedback.impact('light');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const webApp = (window as any).Telegram?.WebApp;
    const shareText = `Join CashFlow - AI Financial Assistant! Use my referral code: ${referral?.code || user?.referralCode}`;
    if (webApp) {
      webApp.switchInlineQuery(shareText);
    } else {
      navigator.clipboard.writeText(shareText);
      setCopied(true);
    }
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

  const code = referral?.code || user?.referralCode || 'CASHFLOW';

  return (
    <PageContainer>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pt-4">
        <h1 className="text-xl font-bold text-white">{t('referral.title')}</h1>

        <GlassCard className="p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-orange to-accent-pink shadow-xl">
            <Gift size={30} className="text-white" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-white">{t('referral.heading')}</h2>
          <p className="mt-1 text-sm text-white/50">
            {t('referral.subtitle')}
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <p className="mb-2 text-xs font-medium text-white/40 uppercase">{t('referral.code')}</p>
          <div
            onClick={handleCopy}
            className="flex cursor-pointer items-center justify-between rounded-2xl border border-accent-ruby/30 bg-accent-ruby/10 px-5 py-4 transition-colors hover:bg-accent-ruby/20"
          >
            <span className="text-2xl font-bold tracking-widest text-white">{code}</span>
            {copied ? (
              <Check size={20} className="text-accent-green" />
            ) : (
              <Copy size={20} className="text-accent-rose" />
            )}
          </div>
          <p className="mt-2 text-[10px] text-white/30 text-center">{t('referral.copy')}</p>
        </GlassCard>

        <Button onClick={handleShare} size="lg" className="w-full">
          <Share2 size={16} />
          {t('referral.share')}
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{referral?.count || 0}</p>
            <p className="text-xs text-white/40 mt-1">{t('referral.totalInvites')}</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl font-bold text-accent-orange">{referral?.rewards?.filter(r => r.claimed).length || 0}</p>
            <p className="text-xs text-white/40 mt-1">{t('referral.rewardsEarned')}</p>
          </GlassCard>
        </div>

        {leaderboard.length > 0 && (
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={16} className="text-accent-orange" />
              <h3 className="text-sm font-semibold text-white/70">{t('referral.stats')}</h3>
            </div>
            <div className="space-y-2">
              {leaderboard.map((entry, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                      i === 0 ? 'bg-accent-orange/20 text-accent-orange' :
                      i === 1 ? 'bg-white/10 text-white/60' :
                      i === 2 ? 'bg-accent-orange/10 text-accent-orange/80' :
                      'bg-white/5 text-white/40',
                    )}>
                      {i + 1}
                    </span>
                    <span className="text-sm text-white/80">{entry.name}</span>
                  </div>
                  <span className="text-xs font-medium text-white/50">{entry.count} {t('referral.invitesSuffix')}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-white/70 mb-3">{t('referral.howItWorks')}</h3>
          <div className="space-y-3">
            {[
              { step: '1', text: t('referral.step1') },
              { step: '2', text: t('referral.step2') },
              { step: '3', text: t('referral.step3') },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-ruby/20 text-xs font-bold text-accent-rose">
                  {item.step}
                </span>
                <p className="text-sm text-white/60">{item.text}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="h-6" />
      </motion.div>
    </PageContainer>
  );
}
