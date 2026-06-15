'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { Share2, Brain, TrendingUp, Lightbulb } from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { FinancialTypeCard } from '@/components/shared/FinancialTypeCard';
import { ShimmerCard } from '@/components/ui/shimmer';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAppStore } from '@/stores/app.store';
import type { IQBreakdown } from '@/types';

const COLORS = ['#8B5CF6', '#EC4899', '#22C55E', '#F59E0B', '#3B82F6', '#06B6D4'];

export default function IQPage() {
  const { t } = useTranslation();
  const { user } = useAppStore();
  const [iq, setIq] = useState<IQBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIQ();
  }, []);

  const fetchIQ = async () => {
    setLoading(true);
    try {
      const data: any = await api.getFinancialIQ();
      const b = data.breakdown ?? {};
      const toPct = (s: number, m: number) => Math.round((s / (m || 1)) * 100);
      setIq({
        total: Math.round(((data.totalScore ?? 0) / 1000) * 100),
        quizScore: 0,
        savingRate: b.savingRate ? toPct(b.savingRate.score, b.savingRate.max) : 0,
        consistency: b.consistency ? toPct(b.consistency.score, b.consistency.max) : 0,
        budgetAdherence: b.budgetAdherence ? toPct(b.budgetAdherence.score, b.budgetAdherence.max) : 0,
        debtManagement: b.debtManagement ? toPct(b.debtManagement.score, b.debtManagement.max) : 0,
        goalProgress: b.goalProgress ? toPct(b.goalProgress.score, b.goalProgress.max) : 0,
      });
    } catch (e) { console.error('Failed to fetch IQ:', e); }
    setLoading(false);
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

  if (!iq) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center pt-20">
          <Brain size={48} className="text-white/20" />
          <p className="mt-4 text-sm text-white/30">{t('iq.empty')}</p>
        </div>
      </PageContainer>
    );
  }

  const radarData = [
    { category: t('iq.savingRate'), value: iq.savingRate },
    { category: t('iq.consistency'), value: iq.consistency },
    { category: t('iq.budget'), value: iq.budgetAdherence },
    { category: t('iq.debtMgmt'), value: iq.debtManagement },
    { category: t('iq.goals'), value: iq.goalProgress },
  ];

  const barData = [
    { name: t('iq.savingRate'), value: iq.savingRate },
    { name: t('iq.consistency'), value: iq.consistency },
    { name: t('iq.budget'), value: iq.budgetAdherence },
    { name: t('iq.debtMgmt'), value: iq.debtManagement },
    { name: t('iq.goals'), value: iq.goalProgress },
  ];

  const tips: Record<string, string> = {
    savingRate: t('iq.tips.rule50_30_20'),
    consistency: t('iq.tips.autoTransfer'),
    budgetAdherence: t('iq.tips.weeklyReview'),
    debtManagement: t('iq.tips.debtConsolidation'),
    goalProgress: t('iq.tips.breakGoals'),
  };

  return (
    <PageContainer>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pt-4">
        <h1 className="text-xl font-bold text-white">{t('iq.title')}</h1>

        <GlassCard className="p-6 text-center">
          <p className="text-xs font-medium text-white/40 uppercase tracking-wider">{t('iq.yourScore')}</p>
          <AnimatedNumber
            value={iq.total}
            decimals={0}
            suffix=" / 100"
            className="mt-2 text-5xl font-extrabold bg-gradient-to-r from-accent-ruby to-accent-crimson bg-clip-text text-transparent"
          />
          <p className={cn(
            'mt-2 text-sm font-medium',
            iq.total >= 80 ? 'text-accent-green' : iq.total >= 60 ? 'text-accent-orange' : 'text-accent-red',
          )}>
            {iq.total >= 80 ? t('iq.excellent') : iq.total >= 60 ? t('iq.good') : iq.total >= 40 ? t('iq.fair') : t('iq.needsImprovement')}
          </p>
        </GlassCard>

        {user?.financialType && (
          <FinancialTypeCard type={user.financialType} />
        )}

        <GlassCard className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-white/70">{t('iq.scoreBreakdown')}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#ffffff15" />
                <PolarAngleAxis dataKey="category" tick={{ fill: '#ffffff60', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="mb-4 text-sm font-semibold text-white/70">{t('iq.categoryScores')}</h3>
          <div className="space-y-3">
            {barData.map((item, i) => (
              <div key={item.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-white/60">{item.name}</span>
                  <span className="text-xs font-medium text-white">{item.value}/100</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${item.value}%`, backgroundColor: COLORS[i % COLORS.length] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={16} className="text-accent-orange" />
            <h3 className="text-sm font-semibold text-white/70">{t('iq.tipsToImprove')}</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(tips).map(([key, tip]) => (
              <div key={key} className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-white/70">{tip}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={() => {
            // share IQ card
            const webApp = (window as any).Telegram?.WebApp;
            if (webApp) {
              webApp.showPopup({
                title: t('iq.shareTitle'),
                message: `${t('iq.shareMessage')} ${iq.total}${t('iq.shareOutOf')}`,
                buttons: [{ type: 'close' }],
              });
            }
          }}
        >
          <Share2 size={16} />
          {t('iq.shareCard')}
        </Button>

        <div className="h-6" />
      </motion.div>
    </PageContainer>
  );
}


