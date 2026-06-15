'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { Crown, Check, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { ShimmerCard } from '@/components/ui/shimmer';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAppStore } from '@/stores/app.store';
import type { Plan, SubscriptionInfo } from '@/types';

const featureCategories = [
  {
    name: 'Features',
    items: [
      { name: 'subscribe.comparison.basicBudget', free: true, pro: true, max: true },
      { name: 'subscribe.comparison.aiInsights', free: false, pro: true, max: true },
      { name: 'subscribe.comparison.unlimitedTx', free: false, pro: true, max: true },
      { name: 'subscribe.comparison.export', free: false, pro: true, max: true },
      { name: 'subscribe.comparison.prioritySupport', free: false, pro: false, max: true },
      { name: 'subscribe.comparison.unlimitedGoals', free: false, pro: false, max: true },
      { name: 'subscribe.comparison.advancedAnalytics', free: false, pro: false, max: true },
    ],
  },
];

export default function SubscribePage() {
  const { t } = useTranslation();
  const { user } = useAppStore();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const [plansData, subData] = await Promise.all([
        api.getPlans(),
        api.getMySubscription().catch(() => null),
      ]);
      setPlans(plansData);
      setSubscription(subData);
    } catch {}
    setLoading(false);
  };

  const handleUpgrade = async (planId: string) => {
    if (planId === 'FREE') return;
    setUpgrading(true);
    try {
      await api.upgradePlan(planId);
      await fetchPlans();
    } catch {}
    setUpgrading(false);
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

  const currentPlan = user?.plan || 'FREE';

  const defaultPlans: Plan[] = plans.length > 0 ? plans : [
    { id: 'FREE', name: 'Free', price: 0, priceLabel: t('subscribe.freePrice'), features: [t('subscribe.features.basic'), t('subscribe.features.fiveTx'), t('subscribe.features.oneGoal'), t('subscribe.features.standardSupport')] },
    { id: 'PRO', name: 'Pro', price: 4.99, priceLabel: t('subscribe.proPrice'), features: [t('subscribe.features.everythingFree'), t('subscribe.features.aiInsights'), t('subscribe.features.unlimitedTx'), t('subscribe.features.exportData'), t('subscribe.features.prioritySupport')], popular: true },
    { id: 'MAX', name: 'Max', price: 9.99, priceLabel: t('subscribe.maxPrice'), features: [t('subscribe.features.everythingPro'), t('subscribe.features.unlimitedGoals'), t('subscribe.features.advancedAnalytics'), t('subscribe.features.vipSupport'), t('subscribe.features.earlyFeatures')] },
  ];

  return (
    <PageContainer>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pt-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">{t('subscribe.title')}</h1>
          <p className="mt-1 text-sm text-white/50">{t('subscribe.subtitle')}</p>
        </div>

        {subscription?.trialEnd && (
          <GlassCard className="p-4 border-accent-ruby/30">
            <div className="flex items-center gap-3">
              <Sparkles size={20} className="text-accent-rose" />
              <div>
                <p className="text-sm font-semibold text-white">
                  {Math.ceil((new Date(subscription.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} {t('subscribe.trialRemaining')}
                </p>
                <p className="text-xs text-white/40">{t('subscribe.trialEnds')} {new Date(subscription.trialEnd).toLocaleDateString()}</p>
              </div>
            </div>
          </GlassCard>
        )}

        <div className="space-y-3">
          {defaultPlans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            return (
              <GlassCard
                key={plan.id}
                className={cn(
                  'relative overflow-hidden p-5',
                  plan.popular && 'border-accent-ruby/40',
                  isCurrent && 'border-accent-green/40',
                )}
              >
                {plan.popular && (
                  <div className="absolute right-0 top-0 rounded-bl-xl bg-gradient-to-r from-accent-ruby to-accent-crimson px-3 py-1">
                    <span className="text-[10px] font-bold text-white uppercase">{t('subscribe.popular')}</span>
                  </div>
                )}
                {isCurrent && (
                  <Badge variant="success" className="absolute right-3 top-3">
                    {t('subscribe.current')}
                  </Badge>
                )}

                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Crown size={18} className={plan.id === 'FREE' ? 'text-white/30' : 'text-accent-rose'} />
                      <h3 className="text-lg font-bold text-white">{t(plan.id === 'FREE' ? 'common.free' : plan.id === 'PRO' ? 'common.pro' : 'common.max')}</h3>
                    </div>
                    <p className="mt-1 text-2xl font-extrabold text-white">
                      {plan.price === 0 ? t('subscribe.freePrice') : `€${plan.price}`}
                      {plan.price > 0 && <span className="text-sm font-normal text-white/40">/mo</span>}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <Check size={14} className="text-accent-green" />
                      <span className="text-sm text-white/70">{f}</span>
                    </div>
                  ))}
                </div>

                {!isCurrent && (
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    size="lg"
                    className="mt-4 w-full"
                    variant={plan.popular ? 'primary' : 'secondary'}
                    loading={upgrading}
                  >
                    {plan.price === 0 ? t('subscribe.getStarted') : `${t('subscribe.upgradeTo')} ${t(plan.id === 'FREE' ? 'common.free' : plan.id === 'PRO' ? 'common.pro' : 'common.max')}`}
                  </Button>
                )}
              </GlassCard>
            );
          })}
        </div>

        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-white/70 mb-4">{t('subscribe.compareFeatures')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="py-2 pr-4 text-white/40 font-medium">{t('subscribe.feature')}</th>
                  <th className="py-2 px-2 text-center text-white/40 font-medium">{t('common.free')}</th>
                  <th className="py-2 px-2 text-center text-accent-rose font-medium">{t('common.pro')}</th>
                  <th className="py-2 px-2 text-center text-accent-orange font-medium">{t('common.max')}</th>
                </tr>
              </thead>
              <tbody>
                {featureCategories[0].items.map((item) => (
                  <tr key={item.name} className="border-b border-white/5">
                    <td className="py-2.5 pr-4 text-white/70">{t(item.name)}</td>
                    <td className="py-2.5 px-2 text-center">{item.free ? <Check size={14} className="mx-auto text-accent-green" /> : <span className="text-white/20">—</span>}</td>
                    <td className="py-2.5 px-2 text-center">{item.pro ? <Check size={14} className="mx-auto text-accent-rose" /> : <span className="text-white/20">—</span>}</td>
                    <td className="py-2.5 px-2 text-center">{item.max ? <Check size={14} className="mx-auto text-accent-orange" /> : <span className="text-white/20">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <div className="h-6" />
      </motion.div>
    </PageContainer>
  );
}
