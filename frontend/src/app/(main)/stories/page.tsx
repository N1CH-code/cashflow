'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { Share2, Download, Brain, Trophy, Target, BarChart3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/glass-card';
import { cn, formatCurrency, getFinancialTypeEmoji, getFinancialTypeLabel } from '@/lib/utils';
import { useAppStore } from '@/stores/app.store';
import { api } from '@/lib/api';

const templates = [
  { id: 'iq', name: 'financialIq', icon: Brain, gradient: 'from-accent-ruby to-accent-crimson' },
  { id: 'type', name: 'financialType', icon: Sparkles, gradient: 'from-accent-blue to-accent-cyan' },
  { id: 'monthly', name: 'monthlySummary', icon: BarChart3, gradient: 'from-accent-green to-accent-cyan' },
  { id: 'savings', name: 'savingsProgress', icon: Target, gradient: 'from-accent-orange to-accent-rose' },
];

export default function StoriesPage() {
  const { t } = useTranslation();
  const { user, preferredCurrency } = useAppStore();
  const [selectedTemplate, setSelectedTemplate] = useState('iq');
  const [generating, setGenerating] = useState(false);
  const [iq, setIq] = useState<{ total: number } | null>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [iqData, goalsData] = await Promise.all([
        api.getFinancialIQ().catch(() => null),
        api.getGoals().catch(() => []),
      ]);
      setIq(iqData);
      setGoals(goalsData);
    } catch {}
  };

  const handleShareToStory = async () => {
    setGenerating(true);
    try {
      const { toPng } = await import('html-to-image');
      if (!cardRef.current) return;
      const dataUrl = await toPng(cardRef.current, { quality: 0.95, pixelRatio: 2 });

      const webApp = (window as any).Telegram?.WebApp;
      if (webApp?.shareToStory) {
        webApp.shareToStory(dataUrl, {
          text: 'Check out my CashFlow stats!',
        });
      } else {
        const link = document.createElement('a');
        link.download = 'cashflow-story.png';
        link.href = dataUrl;
        link.click();
      }
    } catch {}
    setGenerating(false);
  };

  const handleDownload = async () => {
    try {
      const { toPng } = await import('html-to-image');
      if (!cardRef.current) return;
      const dataUrl = await toPng(cardRef.current, { quality: 0.95, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = 'cashflow-story.png';
      link.href = dataUrl;
      link.click();
    } catch {}
  };

  const renderCardPreview = () => {
    switch (selectedTemplate) {
      case 'iq':
        return (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <Brain size={48} className="text-white mb-4" />
            <p className="text-sm text-white/60 uppercase tracking-wider">{t('stories.financialIq')}</p>
            <p className="mt-2 text-6xl font-extrabold text-white">{iq?.total || '—'}</p>
            <p className="mt-2 text-white/70 text-lg">/100</p>
            <p className="mt-4 text-white/50 text-sm">
              {(iq?.total ?? 0) >= 80 ? t('stories.excellent') : (iq?.total ?? 0) >= 60 ? t('stories.good') : t('stories.keepImproving')}
            </p>
          </div>
        );
      case 'type':
        return (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <span className="text-6xl mb-4">{getFinancialTypeEmoji(user?.financialType || 'RATIONALIST')}</span>
            <p className="text-sm text-white/60 uppercase tracking-wider">{t('stories.financialType')}</p>
            <p className="mt-2 text-2xl font-bold text-white">{getFinancialTypeLabel(user?.financialType || 'RATIONALIST')}</p>
            <div className="mt-6 rounded-2xl bg-white/10 px-4 py-2">
              <p className="text-white/70 text-sm">💰 {formatCurrency(user?.monthlyIncome || 0, preferredCurrency || user?.currency)}/mo</p>
            </div>
          </div>
        );
      case 'monthly':
        return (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <BarChart3 size={40} className="text-white mb-4" />
            <p className="text-sm text-white/60 uppercase tracking-wider">{t('stories.monthlySummary')}</p>
            <div className="mt-4 space-y-2">
              <div className="rounded-xl bg-white/10 px-5 py-2">
                <p className="text-xs text-white/50">{t('stories.income')}</p>
                <p className="text-lg font-bold text-accent-green">{formatCurrency(0, preferredCurrency || user?.currency)}</p>
              </div>
              <div className="rounded-xl bg-white/10 px-5 py-2">
                <p className="text-xs text-white/50">{t('stories.expenses')}</p>
                <p className="text-lg font-bold text-accent-red">{formatCurrency(0, preferredCurrency || user?.currency)}</p>
              </div>
            </div>
          </div>
        );
      case 'savings':
        return (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <Target size={40} className="text-white mb-4" />
            <p className="text-sm text-white/60 uppercase tracking-wider">{t('stories.savingsProgress')}</p>
            <p className="mt-4 text-4xl font-bold text-white">{goals.filter(g => g.status === 'COMPLETED').length}</p>
            <p className="text-white/50 text-sm mt-1">{t('stories.goalsCompleted')}</p>
            <p className="mt-4 text-white/60 text-sm">
               {goals.length > 0 ? `${goals.filter(g => g.status === 'ACTIVE').length} ${t('stories.activeGoals')}` : t('stories.noGoalsYet')}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <PageContainer>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pt-4">
        <h1 className="text-xl font-bold text-white">{t('stories.title')}</h1>
        <p className="text-sm text-white/50">{t('stories.subtitle')}</p>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {templates.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => setSelectedTemplate(tmpl.id)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all',
                selectedTemplate === tmpl.id
                  ? 'bg-accent-ruby text-white shadow-lg'
                  : 'bg-white/5 text-white/50 hover:bg-white/10',
              )}
            >
              <tmpl.icon size={14} />
              {t(`stories.${tmpl.name}`)}
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <div
            ref={cardRef}
            className={cn(
              'h-[480px] w-[270px] overflow-hidden rounded-3xl shadow-2xl',
              'bg-gradient-to-br',
              templates.find((tmpl) => tmpl.id === selectedTemplate)?.gradient || 'from-accent-ruby to-accent-crimson',
            )}
            style={{ backgroundColor: '#0A0A0F' }}
          >
            {renderCardPreview()}
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleShareToStory}
            size="lg"
            className="w-full"
            loading={generating}
          >
            <Share2 size={16} />
            {t('stories.shareTelegram')}
          </Button>
          <Button
            onClick={handleDownload}
            variant="secondary"
            size="lg"
            className="w-full"
          >
            <Download size={16} />
            {t('stories.downloadImage')}
          </Button>
        </div>

        <div className="h-6" />
      </motion.div>
    </PageContainer>
  );
}
