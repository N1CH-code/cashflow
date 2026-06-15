'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Copy, LogOut, UserPlus, Target, ArrowLeftRight, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GlassCard } from '@/components/ui/glass-card';
import { ShimmerCard } from '@/components/ui/shimmer';
import { PageContainer } from '@/components/layout/PageContainer';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { useAppStore } from '@/stores/app.store';
import { cn, formatCurrency, getCategoryIcon } from '@/lib/utils';
import type { Family, FamilyMember, FamilyStats } from '@/types';

export default function FamilyPage() {
  const { t, locale } = useTranslation();
  const { user, preferredCurrency } = useAppStore();
  const [family, setFamily] = useState<Family | null>(null);
  const [stats, setStats] = useState<FamilyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [tab, setTab] = useState<'overview' | 'members' | 'goals'>('overview');
  const [copied, setCopied] = useState(false);

  useEffect(() => { fetchFamily(); }, []);

  const fetchFamily = async () => {
    setLoading(true);
    try {
      const [f, s] = await Promise.all([
        api.getMyFamily(),
        api.getFamilyStats().catch(() => null),
      ]);
      setFamily(f);
      setStats(s);
    } catch {}
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!familyName) return;
    try {
      const f = await api.createFamily({ name: familyName });
      setFamily(f);
      setShowCreate(false);
      setFamilyName('');
      fetchFamily();
    } catch {}
  };

  const handleJoin = async () => {
    if (!inviteCode) return;
    try {
      const f = await api.joinFamily(inviteCode.toUpperCase());
      setFamily(f);
      setShowJoin(false);
      setInviteCode('');
      fetchFamily();
    } catch {}
  };

  const handleLeave = async () => {
    if (!confirm(t('family.leaveConfirm'))) return;
    try {
      await api.leaveFamily();
      setFamily(null);
      setStats(null);
    } catch {}
  };

  const copyInviteCode = () => {
    if (!family) return;
    navigator.clipboard.writeText(family.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  if (!family) {
    return (
      <PageContainer>
        <div className="space-y-4 pt-4">
          <h1 className="text-xl font-bold text-white">{t('family.title')}</h1>

          <div className="flex flex-col items-center pt-8">
            <Users size={48} className="text-white/20" />
            <p className="mt-4 text-sm text-white/30">{t('family.noFamily')}</p>
            <p className="text-xs text-white/20">{t('family.noFamilyHint')}</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={() => setShowCreate(true)} className="flex-1">
              <Plus size={16} />
              {t('family.create')}
            </Button>
            <Button onClick={() => setShowJoin(true)} variant="outline" className="flex-1">
              <UserPlus size={16} />
              {t('family.join')}
            </Button>
          </div>

          <AnimatePresence>
            {showCreate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <Input
                  label={t('family.name')}
                  placeholder={t('family.namePlaceholder')}
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                />
                <Button onClick={handleCreate} className="w-full" disabled={!familyName}>
                  {t('family.create')}
                </Button>
              </motion.div>
            )}

            {showJoin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <Input
                  label={t('family.inviteCode')}
                  placeholder={t('family.inviteCodePlaceholder')}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                />
                <Button onClick={handleJoin} className="w-full" disabled={!inviteCode}>
                  {t('family.join')}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PageContainer>
    );
  }

  const memberRoleLabel = (role: string) => {
    if (role === 'OWNER') return t('family.owner');
    if (role === 'ADMIN') return t('family.admin');
    return t('family.member');
  };

  const tabs = [
    { key: 'overview' as const, label: t('family.stats') },
    { key: 'members' as const, label: t('family.members') },
    { key: 'goals' as const, label: t('family.sharedGoals') },
  ];

  return (
    <PageContainer>
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{family.name}</h1>
            <p className="text-xs text-white/40">
              {family.members?.length || 0} {t('family.members')}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLeave}>
            <LogOut size={16} className="text-red-400" />
          </Button>
        </div>

        <GlassCard className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">{t('family.inviteCode')}:</span>
            <code className="rounded bg-white/10 px-2 py-0.5 text-sm font-mono font-bold text-accent-rose tracking-widest">
              {family.inviteCode}
            </code>
          </div>
          <button onClick={copyInviteCode} className="rounded-lg bg-white/10 p-2 transition-colors hover:bg-white/20">
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-white/60" />}
          </button>
        </GlassCard>

        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <GlassCard className="p-3 text-center">
              <p className="text-[10px] text-green-400">{t('family.totalIncome')}</p>
              <p className="mt-1 text-sm font-bold text-white">
                {formatCurrency(stats.totalIncome, preferredCurrency || user?.currency)}
              </p>
            </GlassCard>
            <GlassCard className="p-3 text-center">
              <p className="text-[10px] text-red-400">{t('family.totalExpenses')}</p>
              <p className="mt-1 text-sm font-bold text-white">
                {formatCurrency(stats.totalExpenses, preferredCurrency || user?.currency)}
              </p>
            </GlassCard>
            <GlassCard className="p-3 text-center">
              <p className="text-[10px] text-accent-rose">{t('family.balance')}</p>
              <p className="mt-1 text-sm font-bold text-white">
                {formatCurrency(stats.balance, preferredCurrency || user?.currency)}
              </p>
            </GlassCard>
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'rounded-full px-4 py-2 text-xs font-medium transition-all whitespace-nowrap',
                tab === key
                  ? 'bg-accent-ruby/20 text-accent-rose border border-accent-ruby/30'
                  : 'bg-white/5 text-white/50 hover:bg-white/10',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            {tab === 'members' && (
              <div className="space-y-2">
                {family.members?.map((m: FamilyMember) => (
                  <GlassCard key={m.id} className="flex items-center gap-3 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-accent-ruby/30 to-accent-blue/30 text-sm font-bold text-white">
                      {(m.user.firstName || '?')[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">
                        {m.user.firstName || m.user.telegramUsername || 'User'}
                      </p>
                      <p className="text-[10px] text-white/40">{memberRoleLabel(m.role)}</p>
                    </div>
                    <span className={cn(
                      'rounded-full px-2.5 py-0.5 text-[10px] font-medium',
                      m.role === 'OWNER' ? 'bg-yellow-400/15 text-yellow-400' :
                      m.role === 'ADMIN' ? 'bg-accent-ruby/15 text-accent-rose' :
                      'bg-white/10 text-white/50',
                    )}>
                      {memberRoleLabel(m.role)}
                    </span>
                  </GlassCard>
                ))}
              </div>
            )}

            {tab === 'overview' && (
              <div className="text-center py-8">
                <p className="text-xs text-white/30">{t('family.recentActivity')}</p>
              </div>
            )}

            {tab === 'goals' && (
              <div className="text-center py-8">
                <Target size={32} className="mx-auto text-white/20" />
                <p className="mt-2 text-xs text-white/30">{t('family.sharedGoals')}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </PageContainer>
  );
}
