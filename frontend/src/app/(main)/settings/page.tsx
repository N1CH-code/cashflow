'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Sparkles, Calendar, DollarSign, Wallet, Coins, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/glass-card';
import { ShimmerCard } from '@/components/ui/shimmer';
import { cn, formatCurrency } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useAppStore } from '@/stores/app.store';
import { api } from '@/lib/api';

const CURRENCIES = [
  { value: 'EUR', label: '€ EUR' },
  { value: 'USD', label: '$ USD' },
  { value: 'RUB', label: '₽ RUB' },
  { value: 'UAH', label: '₴ UAH' },
  { value: 'GBP', label: '£ GBP' },
  { value: 'PLN', label: 'zł PLN' },
  { value: 'CHF', label: '₣ CHF' },
];

export default function SettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, preferredCurrency } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [salaryDate, setSalaryDate] = useState(user?.salaryDate?.toString() ?? '1');
  const [monthlyIncome, setMonthlyIncome] = useState(user?.monthlyIncome?.toString() ?? '');
  const [dailyLimit, setDailyLimit] = useState(user?.dailyLimit?.toString() ?? '');
  const [currency, setCurrency] = useState<string>(preferredCurrency || user?.currency || 'EUR');
  const [aiEnabled, setAiEnabled] = useState(user?.settings?.aiEnabled ?? true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.settings?.notificationsEnabled ?? true);
  const [weeklyReport, setWeeklyReport] = useState(user?.settings?.weeklyReport ?? true);
  const [darkMode, setDarkMode] = useState(user?.settings?.darkMode ?? true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.updateUser({
        salaryDate: parseInt(salaryDate) || 1,
        monthlyIncome: parseFloat(monthlyIncome) || 0,
        dailyLimit: dailyLimit ? parseFloat(dailyLimit) : null,
        currency,
        aiEnabled,
        notificationsEnabled,
        weeklyReport,
        darkMode,
      });
      const me = await api.getMe();
      useAppStore.getState().setUser(me);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pt-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} />
          {t('common.back')}
        </button>

        <h1 className="text-xl font-bold text-white">{t('settings.title')}</h1>

        <GlassCard className="p-5">
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={14} className="text-accent-ruby" />
                <label className="text-sm font-medium text-white/80">{t('settings.salaryDate')}</label>
              </div>
              <p className="text-xs text-white/40 mb-2">{t('settings.salaryDateDesc')}</p>
              <div className="flex gap-2 flex-wrap">
                {[1, 5, 10, 15, 20, 25].map((d) => (
                  <button
                    key={d}
                    onClick={() => setSalaryDate(d.toString())}
                    className={cn(
                      'h-10 w-10 rounded-lg text-sm font-medium transition-all',
                      salaryDate === d.toString()
                        ? 'bg-accent-ruby text-white shadow-lg'
                        : 'bg-white/5 text-white/60 hover:bg-white/10',
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={14} className="text-accent-ruby" />
                <label className="text-sm font-medium text-white/80">{t('settings.monthlyIncome')}</label>
              </div>
              <p className="text-xs text-white/40 mb-2">{t('settings.monthlyIncomeDesc')}</p>
              <Input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="0"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Wallet size={14} className="text-accent-ruby" />
                <label className="text-sm font-medium text-white/80">{t('settings.dailyLimit')}</label>
              </div>
              <p className="text-xs text-white/40 mb-2">{t('settings.dailyLimitDesc')}</p>
              <Input
                type="number"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                placeholder="0"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Coins size={14} className="text-accent-ruby" />
                <label className="text-sm font-medium text-white/80">{t('settings.currency')}</label>
              </div>
              <p className="text-xs text-white/40 mb-2">{t('settings.currencyDesc')}</p>
              <div className="flex gap-2 flex-wrap">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCurrency(c.value)}
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm font-medium transition-all',
                      currency === c.value
                        ? 'bg-accent-ruby text-white shadow-lg'
                        : 'bg-white/5 text-white/60 hover:bg-white/10',
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h3 className="text-sm font-semibold text-white/70 mb-4">{t('profile.settings')}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles size={16} className="text-white/40" />
                <div>
                  <p className="text-sm text-white/80">{t('settings.aiAssistant')}</p>
                  <p className="text-xs text-white/40">{t('settings.aiAssistantDesc')}</p>
                </div>
              </div>
              <button
                onClick={() => setAiEnabled(!aiEnabled)}
                className={cn(
                  'h-6 w-10 rounded-full transition-colors',
                  aiEnabled ? 'bg-accent-ruby' : 'bg-white/20',
                )}
              >
                <div className={cn(
                  'h-5 w-5 rounded-full bg-white transition-transform',
                  aiEnabled ? 'translate-x-[18px]' : 'translate-x-0.5',
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell size={16} className="text-white/40" />
                <div>
                  <p className="text-sm text-white/80">{t('settings.notifications')}</p>
                  <p className="text-xs text-white/40">{t('settings.notificationsDesc')}</p>
                </div>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={cn(
                  'h-6 w-10 rounded-full transition-colors',
                  notificationsEnabled ? 'bg-accent-ruby' : 'bg-white/20',
                )}
              >
                <div className={cn(
                  'h-5 w-5 rounded-full bg-white transition-transform',
                  notificationsEnabled ? 'translate-x-[18px]' : 'translate-x-0.5',
                )} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-white/40" />
                <div>
                  <p className="text-sm text-white/80">{t('settings.weeklyReport')}</p>
                  <p className="text-xs text-white/40">{t('settings.weeklyReportDesc')}</p>
                </div>
              </div>
              <button
                onClick={() => setWeeklyReport(!weeklyReport)}
                className={cn(
                  'h-6 w-10 rounded-full transition-colors',
                  weeklyReport ? 'bg-accent-ruby' : 'bg-white/20',
                )}
              >
                <div className={cn(
                  'h-5 w-5 rounded-full bg-white transition-transform',
                  weeklyReport ? 'translate-x-[18px]' : 'translate-x-0.5',
                )} />
              </button>
            </div>
          </div>
        </GlassCard>

        <Button
          size="lg"
          className="w-full"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? t('common.loading') : saved ? t('settings.saved') : t('common.save')}
        </Button>

        <div className="h-6" />
      </motion.div>
    </PageContainer>
  );
}
