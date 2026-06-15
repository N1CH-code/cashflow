'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Loader2, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PageContainer } from '@/components/layout/PageContainer';
import { TransactionItem } from '@/components/shared/TransactionItem';
import { ShimmerCard } from '@/components/ui/shimmer';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAppStore } from '@/stores/app.store';
import { useTranslation } from '@/lib/i18n';
import type { Transaction } from '@/types';

export default function TransactionsPage() {
  const { t } = useTranslation();
  const { user, preferredCurrency } = useAppStore();
  const filters = [
    { label: t('transactions.all'), value: 'ALL' },
    { label: t('transactions.income'), value: 'INCOME' },
    { label: t('transactions.expense'), value: 'EXPENSE' },
  ];
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchTransactions = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      const params: any = { page: pageNum, limit: 20 };
      if (filter !== 'ALL') params.type = filter;
      if (search) params.search = search;
      const response = await api.getTransactions(params);
      const items = response.data ?? response;
      if (append) {
        setTransactions((prev) => [...prev, ...items]);
      } else {
        setTransactions(items);
      }
      setHasMore(items.length === 20);
    } catch {}
  }, [filter, search]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchTransactions(1).finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setPage(1);
      fetchTransactions(1);
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    await fetchTransactions(nextPage, true);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    await fetchTransactions(1);
    setRefreshing(false);
  };

  const filtered = search
    ? transactions.filter(
        (t) =>
          t.description?.toLowerCase().includes(search.toLowerCase()) ||
          t.category?.name?.toLowerCase().includes(search.toLowerCase()),
      )
    : transactions;

  return (
    <PageContainer>
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">{t('transactions.title')}</h1>
          <button
            onClick={handleRefresh}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 transition-colors hover:bg-white/10"
          >
            <RefreshCw size={18} className={`text-white/60 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <Input
            placeholder={t('transactions.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-all',
                filter === f.value
                  ? 'bg-accent-ruby text-white shadow-lg shadow-accent-ruby/20'
                  : 'bg-white/5 text-white/50 hover:bg-white/10',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <ShimmerCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center pt-12">
            <p className="text-white/30 text-sm">{t('transactions.empty')}</p>
          </div>
        ) : (
          <div>
            <div className="rounded-2xl border border-white/5 bg-dark-card/80 backdrop-blur-xl">
              {filtered.map((t) => (
                <TransactionItem key={t.id} transaction={t} currency={preferredCurrency || user?.currency} />
              ))}
            </div>

            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="mt-4 w-full rounded-xl bg-white/5 py-3 text-sm font-medium text-white/50 transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                {loadingMore ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  t('transactions.loadMore')
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
