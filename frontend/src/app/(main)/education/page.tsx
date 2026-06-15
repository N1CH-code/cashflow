'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, TrendingUp, Shield, CreditCard, PiggyBank, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { ShimmerCard } from '@/components/ui/shimmer';
import { PageContainer } from '@/components/layout/PageContainer';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { EducationArticle, EducationArticleFull } from '@/types';

const categoryIcons: Record<string, any> = {
  BASICS: BookOpen,
  SAVING: PiggyBank,
  INVESTING: TrendingUp,
  BUDGETING: Shield,
  CREDIT: CreditCard,
};

const categoryColors: Record<string, string> = {
  BASICS: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
  SAVING: 'from-green-500/20 to-green-600/10 border-green-500/20',
  INVESTING: 'from-purple-500/20 to-purple-600/10 border-purple-500/20',
  BUDGETING: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/20',
  CREDIT: 'from-red-500/20 to-red-600/10 border-red-500/20',
};

export default function EducationPage() {
  const { t, locale } = useTranslation();
  const [articles, setArticles] = useState<EducationArticle[]>([]);
  const [selected, setSelected] = useState<EducationArticleFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingArticle, setLoadingArticle] = useState(false);
  const [category, setCategory] = useState<string | null>(null);

  useEffect(() => { fetchArticles(); }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try { setArticles(await api.getEducationArticles()); } catch {}
    setLoading(false);
  };

  const openArticle = async (id: string) => {
    setLoadingArticle(true);
    try { setSelected(await api.getEducationArticle(id)); } catch {}
    setLoadingArticle(false);
  };

  const categories = Array.from(new Set(articles.map((a) => a.category)));
  const filtered = category ? articles.filter((a) => a.category === category) : articles;

  if (selected) {
    return (
      <PageContainer>
        <div className="space-y-4 pt-4">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white"
          >
            <ArrowLeft size={14} />
            {t('education.back')}
          </button>

          {loadingArticle ? (
            <ShimmerCard />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlassCard className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br',
                    categoryColors[selected.category] || 'from-white/10 to-white/5',
                  )}>
                    {React.createElement(categoryIcons[selected.category] || BookOpen, { size: 22, className: 'text-white' })}
                  </div>
                    <div>
                    <h2 className="text-lg font-bold text-white">{selected.title}</h2>
                    {selected.titleRu && <p className="text-xs text-white/40 mt-0.5">{selected.titleRu}</p>}
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/50">
                          {selected.category} / {t(`education.categories.${selected.category}` as any)}
                        </span>
                      <span className="flex items-center gap-1 text-[10px] text-white/40">
                        <Clock size={10} />
                        {selected.readTime} {t('education.minRead')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="prose prose-invert prose-sm max-w-none">
                    {selected.content.split('\n').map((line, i) => {
                      if (line.startsWith('## ')) {
                        return <h3 key={i} className="mt-4 mb-2 text-base font-bold text-white">{line.replace('## ', '')}</h3>;
                      }
                      if (line.startsWith('- **')) {
                        const match = line.match(/- \*\*(.+?)\*\*\s*—\s*(.+)/);
                        if (match) {
                          return (
                            <p key={i} className="text-sm text-white/70 ml-2">
                              <strong className="text-white">{match[1]}</strong> — {match[2]}
                            </p>
                          );
                        }
                      }
                      if (line.startsWith('- ')) {
                        return <li key={i} className="text-sm text-white/70 ml-4">{line.replace('- ', '')}</li>;
                      }
                      if (line.trim() === '') return <div key={i} className="h-2" />;
                      return <p key={i} className="text-sm text-white/70">{line}</p>;
                    })}
                  </div>
                  {selected.contentRu && (
                    <div className="border-t border-white/10 pt-3">
                      <div className="prose prose-invert prose-sm max-w-none opacity-60">
                        {selected.contentRu.split('\n').map((line, i) => {
                          if (line.startsWith('## ')) {
                            return <h3 key={i} className="mt-4 mb-2 text-base font-bold text-white">{line.replace('## ', '')}</h3>;
                          }
                          if (line.startsWith('- **')) {
                            const match = line.match(/- \*\*(.+?)\*\*\s*—\s*(.+)/);
                            if (match) {
                              return (
                                <p key={i} className="text-sm text-white/70 ml-2">
                                  <strong className="text-white">{match[1]}</strong> — {match[2]}
                                </p>
                              );
                            }
                          }
                          if (line.startsWith('- ')) {
                            return <li key={i} className="text-sm text-white/70 ml-4">{line.replace('- ', '')}</li>;
                          }
                          if (line.trim() === '') return <div key={i} className="h-2" />;
                          return <p key={i} className="text-sm text-white/70">{line}</p>;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )}
        </div>
      </PageContainer>
    );
  }

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
        <div>
          <h1 className="text-xl font-bold text-white">{t('education.title')}</h1>
          <p className="text-xs text-white/40">{t('education.subtitle')}</p>
          <p className="text-[10px] text-white/30 mt-0.5">Financial Education / Финансовая грамотность</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategory(null)}
            className={cn(
              'rounded-full px-4 py-2 text-xs font-medium transition-all whitespace-nowrap',
              !category ? 'bg-accent-ruby/20 text-accent-rose border border-accent-ruby/30' : 'bg-white/5 text-white/50 hover:bg-white/10',
            )}
          >
            All / Все
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                'rounded-full px-4 py-2 text-xs font-medium transition-all whitespace-nowrap',
                category === cat ? 'bg-accent-ruby/20 text-accent-rose border border-accent-ruby/30' : 'bg-white/5 text-white/50 hover:bg-white/10',
              )}
            >
              {cat} / {t(`education.categories.${cat}` as any)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center pt-8">
            <BookOpen size={40} className="text-white/20" />
            <p className="mt-3 text-sm text-white/30">No articles yet / Статей пока нет</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((article) => {
              const Icon = categoryIcons[article.category] || BookOpen;
              return (
                <GlassCard
                  key={article.id}
                  className="p-4 cursor-pointer"
                  hover
                  onClick={() => openArticle(article.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br',
                      categoryColors[article.category] || 'from-white/10 to-white/5',
                    )}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white">{article.title}</h3>
                      {article.titleRu && <h4 className="text-xs text-white/40">{article.titleRu}</h4>}
                      <p className="mt-0.5 text-xs text-white/50 line-clamp-2">{article.summary}</p>
                      {article.summaryRu && <p className="text-[10px] text-white/30 line-clamp-2">{article.summaryRu}</p>}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/40">
                          {article.category} / {t(`education.categories.${article.category}` as any)}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-white/40">
                          <Clock size={10} />
                          {article.readTime} {t('education.minRead')}
                        </span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
