'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/glass-card';
import { ShimmerCard } from '@/components/ui/shimmer';
import { cn, formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAppStore } from '@/stores/app.store';

const COLORS = ['#8B5CF6', '#EC4899', '#22C55E', '#F59E0B', '#3B82F6', '#EF4444', '#06B6D4', '#A855F7'];
const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-dark-card/95 backdrop-blur-xl px-3 py-2 shadow-xl">
      <p className="text-xs text-white/40">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold text-white" style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value, currency)}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const { user, preferredCurrency } = useAppStore();
  const currency = preferredCurrency || user?.currency;
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [overview, setOverview] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [breakdown, trends, overviewData] = await Promise.all([
        api.getMonthlyBreakdown(month + 1, year),
        api.getTrends(6),
        api.getAnalyticsOverview(),
      ]);
      setDailyData(breakdown.dailyBreakdown || []);
      setCategoryData(breakdown.categories || []);
      setTopCategories(overviewData.topCategories || []);
      setTrendData(trends.trends || []);
      setOverview(overviewData);
    } catch (e) { console.error('[AnalyticsPage] fetchData failed', e); }
    setLoading(false);
  };

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
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

  return (
    <PageContainer>
      <div className="space-y-5 pt-4">
        <h1 className="text-xl font-bold text-white">{t('analytics.title')}</h1>

        <div className="flex items-center justify-between rounded-2xl bg-dark-surface px-4 py-3">
          <button onClick={prevMonth} className="rounded-lg p-1 hover:bg-white/10">
            <ChevronLeft size={18} className="text-white/60" />
          </button>
          <span className="text-sm font-semibold text-white">
            {t(`months.${MONTH_KEYS[month]}`)} {year}
          </span>
          <button onClick={nextMonth} className="rounded-lg p-1 hover:bg-white/10">
            <ChevronRight size={18} className="text-white/60" />
          </button>
        </div>

        {overview && (
          <div className="grid grid-cols-2 gap-3">
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={14} className="text-accent-green" />
                <span className="text-[10px] font-medium text-white/40 uppercase">{t('analytics.income')}</span>
              </div>
              <p className="text-lg font-bold text-accent-green">
                {formatCurrency(overview.totalIncome, currency)}
              </p>
            </GlassCard>
            <GlassCard className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown size={14} className="text-accent-red" />
                <span className="text-[10px] font-medium text-white/40 uppercase">{t('analytics.expenses')}</span>
              </div>
              <p className="text-lg font-bold text-accent-red">
                {formatCurrency(overview.totalExpense, currency)}
              </p>
            </GlassCard>
          </div>
        )}

        <GlassCard className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-white/70">{t('analytics.dailyExpenses')}</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} barSize={12}>
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#ffffff40', fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#ffffff40', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                <Bar dataKey="expense" name={t('analytics.expenses')} radius={[6, 6, 0, 0]} fill={COLORS[0]} fillOpacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {categoryData.length > 0 && (
          <GlassCard className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-white/70">{t('analytics.categoryBreakdown')}</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData.map((c: any) => ({ ...c, amount: c.expense }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="amount"
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip currency={currency} />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 space-y-1">
              {categoryData.map((cat, i) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-white/60">{cat.name}</span>
                  </div>
                  <span className="text-xs font-medium text-white">{formatCurrency(cat.expense, currency)}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {trendData.length > 0 && (
          <GlassCard className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-white/70">{t('analytics.incomeVsExpenses')}</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#ffffff40', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#ffffff40', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip currency={currency} />} />
                  <Line type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        )}

        {topCategories.length > 0 && (
          <GlassCard className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-white/70">{t('analytics.topCategories')}</h3>
            <div className="space-y-3">
              {topCategories.map((cat: any, i: number) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white">{cat.name}</span>
                    <span className="text-xs font-medium text-white/60">{formatCurrency(cat.amount, currency)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${cat.percent || 0}%`, backgroundColor: COLORS[i % COLORS.length] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </PageContainer>
  );
}
