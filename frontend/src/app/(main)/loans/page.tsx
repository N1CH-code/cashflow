'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, ChevronUp, Brain, Calculator, TrendingDown, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageContainer } from '@/components/layout/PageContainer';
import { GlassCard } from '@/components/ui/glass-card';
import { Progress } from '@/components/ui/progress';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { ShimmerCard } from '@/components/ui/shimmer';
import { cn, formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';
import { useAppStore } from '@/stores/app.store';
import type { Loan, LoanScheduleEntry } from '@/types';

export default function LoansPage() {
  const { t } = useTranslation();
  const { user, preferredCurrency } = useAppStore();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<LoanScheduleEntry[]>([]);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [extraPayment, setExtraPayment] = useState('');
  const [earlyPayoff, setEarlyPayoff] = useState<any>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [formName, setFormName] = useState('');
  const [formTotal, setFormTotal] = useState('');
  const [formRate, setFormRate] = useState('');
  const [formTerm, setFormTerm] = useState('');
  const [formMonthly, setFormMonthly] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formSaving, setFormSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const currency = preferredCurrency || user?.currency || 'EUR';

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const data = await api.getLoans();
      setLoans(data);
    } catch (err) {
      console.error('Failed to fetch loans:', err);
    }
    setLoading(false);
  };

  const openAddForm = () => {
    setEditingLoan(null);
    setFormName('');
    setFormTotal('');
    setFormRate('');
    setFormTerm('');
    setFormMonthly('');
    setFormStartDate(new Date().toISOString().slice(0, 10));
    setShowForm(true);
  };

  const openEditForm = (loan: Loan, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLoan(loan);
    setFormName(loan.name);
    setFormTotal(String(loan.totalAmount));
    setFormRate(String(loan.interestRate));
    setFormTerm(String(loan.termMonths));
    setFormMonthly(String(loan.monthlyPayment));
    setFormStartDate(new Date(loan.startDate).toISOString().slice(0, 10));
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formName || !formTotal || !formRate || !formTerm || !formMonthly) return;
    setFormSaving(true);
    try {
      const body = {
        name: formName,
        totalAmount: parseFloat(formTotal),
        interestRate: parseFloat(formRate),
        termMonths: parseInt(formTerm, 10),
        monthlyPayment: parseFloat(formMonthly),
        startDate: formStartDate || new Date().toISOString(),
      };
      if (editingLoan) {
        await api.updateLoan(editingLoan.id, body);
      } else {
        await api.createLoan(body);
      }
      await fetchLoans();
      setShowForm(false);
    } catch (err) {
      console.error('Failed to save loan:', err);
    }
    setFormSaving(false);
  };

  const handleDelete = async (loanId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(loanId);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await api.deleteLoan(deletingId);
      await fetchLoans();
      setDeletingId(null);
    } catch (err) {
      console.error('Failed to delete loan:', err);
    }
    setDeleting(false);
  };

  const toggleExpand = async (loanId: string) => {
    if (expandedId === loanId) {
      setExpandedId(null);
      setEarlyPayoff(null);
      setExtraPayment('');
      return;
    }
    setExpandedId(loanId);
    setEarlyPayoff(null);
    setExtraPayment('');
    try {
      const sched = await api.getLoanSchedule(loanId);
      setSchedule(sched);
    } catch (err) {
      console.error('Failed to load schedule:', err);
    }
  };

  const handleAiAdvice = async (loan: Loan) => {
    setAiLoading(true);
    try {
      const advice = await api.getLoanAdvice({
        totalAmount: loan.totalAmount,
        interestRate: loan.interestRate,
        termMonths: loan.termMonths,
        monthlyPayment: loan.monthlyPayment,
        remainingAmount: loan.remainingAmount,
        paidAmount: loan.paidAmount,
        name: loan.name,
        currency,
      });
      setAiAdvice(advice?.advice || JSON.stringify(advice));
    } catch (err) {
      console.error('Failed to get AI advice:', err);
      setAiAdvice(t('loans.aiError'));
    }
    setAiLoading(false);
  };

  const handleEarlyPayoff = async (loanId: string) => {
    if (!extraPayment) return;
    try {
      const result = await api.getLoanEarlyPayoff(loanId, parseFloat(extraPayment));
      setEarlyPayoff(result);
    } catch (err) {
      console.error('Failed to calculate early payoff:', err);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-4 pt-4">
          {[1, 2].map((i) => <ShimmerCard key={i} />)}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">{t('loans.title')}</h1>
          <Button size="sm" onClick={openAddForm}>
            <Plus size={16} />
            {t('loans.add')}
          </Button>
        </div>

        {loans.length === 0 ? (
          <div className="flex flex-col items-center pt-12">
            <TrendingDown size={48} className="text-white/20" />
            <p className="mt-4 text-sm text-white/30">{t('loans.empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {loans.map((loan) => (
              <GlassCard key={loan.id} className="overflow-hidden">
                <button
                  onClick={() => toggleExpand(loan.id)}
                  className="flex w-full items-center gap-4 p-5 text-left"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-red/10">
                    <TrendingDown size={22} className="text-accent-red" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-white">{loan.name}</h4>
                      <button
                        onClick={(e) => openEditForm(loan, e)}
                        className="rounded p-1 text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(loan.id, e)}
                        className="rounded p-1 text-white/30 hover:text-accent-red hover:bg-accent-red/10 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <AnimatedNumber
                        value={loan.remainingAmount}
                        formatter={(v) => formatCurrency(v, currency)}
                        className="text-base font-bold text-white"
                      />
                      <span className="text-xs text-white/40">/ {formatCurrency(loan.totalAmount, currency)}</span>
                    </div>
                    <Progress value={loan.progress} size="sm" color="orange" className="mt-2" />
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-accent-orange">{loan.interestRate}%</p>
                    {expandedId === loan.id ? <ChevronUp size={16} className="text-white/40 mt-1" /> : <ChevronDown size={16} className="text-white/40 mt-1" />}
                  </div>
                </button>

                <AnimatePresence>
                  {expandedId === loan.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5"
                    >
                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-xl bg-white/5 p-3 text-center">
                            <p className="text-[10px] text-white/40 uppercase">{t('loans.monthly')}</p>
                            <p className="text-sm font-bold text-white mt-1">{formatCurrency(loan.monthlyPayment, currency)}</p>
                          </div>
                          <div className="rounded-xl bg-white/5 p-3 text-center">
                            <p className="text-[10px] text-white/40 uppercase">{t('loans.paid')}</p>
                            <p className="text-sm font-bold text-accent-green mt-1">{formatCurrency(loan.paidAmount, currency)}</p>
                          </div>
                          <div className="rounded-xl bg-white/5 p-3 text-center">
                            <p className="text-[10px] text-white/40 uppercase">{t('loans.remaining')}</p>
                            <p className="text-sm font-bold text-accent-red mt-1">{formatCurrency(loan.remainingAmount, currency)}</p>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Calculator size={14} className="text-accent-rose" />
                            <span className="text-xs font-medium text-white/50 uppercase">{t('loans.earlyPayoff')}</span>
                          </div>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder={t('loans.extraPerMonth')}
                              value={extraPayment}
                              onChange={(e) => setExtraPayment(e.target.value)}
                            />
                            <Button size="sm" variant="secondary" onClick={() => handleEarlyPayoff(loan.id)}>
                              {t('loans.calculate')}
                            </Button>
                          </div>
                          {earlyPayoff && (
                            <div className="mt-2 rounded-xl bg-accent-green/10 p-3">
                              <p className="text-xs text-accent-green">
                                {t('loans.payoffBy')} {new Date(earlyPayoff.newEndDate).toLocaleDateString()} {t('loans.insteadOf')} {new Date(earlyPayoff.originalEndDate).toLocaleDateString()}. {t('loans.saveInInterest')} {formatCurrency(earlyPayoff.interestSaved, currency)} {t('loans.inInterest')}.
                              </p>
                            </div>
                          )}
                        </div>

                        {schedule.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-white/50 uppercase mb-2">{t('loans.amortizationSchedule')}</p>
                            <div className="max-h-40 overflow-y-auto space-y-1">
                              {schedule.slice(0, 12).map((entry) => (
                                <div key={entry.month} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                                  <span className="text-xs text-white/40">{t('loans.month')} {entry.month}</span>
                                  <span className="text-xs text-white/60">{formatCurrency(entry.payment, currency)}</span>
                                  <span className="text-xs text-accent-green">+{formatCurrency(entry.principal, currency)}</span>
                                  <span className="text-xs text-accent-orange">{formatCurrency(entry.interest, currency)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleAiAdvice(loan)}
                            loading={aiLoading}
                            className="w-full"
                          >
                            <Brain size={14} />
                            {t('loans.aiAdvice')}
                          </Button>

                          {aiAdvice && (
                            <div className="mt-3 rounded-2xl border border-accent-ruby/20 bg-accent-ruby/5 p-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Brain size={14} className="text-accent-rose" />
                                <span className="text-xs font-medium text-accent-rose">{t('loans.aiAdvice')}</span>
                              </div>
                              <p className="text-sm text-white/70 whitespace-pre-wrap">{aiAdvice}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {deletingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-5"
            onClick={() => setDeletingId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-dark-card/95 backdrop-blur-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-red/10 mb-4">
                  <AlertTriangle size={28} className="text-accent-red" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{t('loans.confirmDelete')}</h3>
                <p className="text-sm text-white/50 mb-6">{t('loans.deleteWarning')}</p>
                <div className="flex gap-3 w-full">
                  <Button variant="secondary" onClick={() => setDeletingId(null)} className="flex-1">
                    {t('loans.cancel')}
                  </Button>
                  <Button variant="danger" onClick={confirmDelete} loading={deleting} className="flex-1">
                    <Trash2 size={16} />
                    {t('loans.delete')}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full max-w-lg rounded-t-3xl border border-white/10 bg-dark-card/95 backdrop-blur-2xl p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto mb-4 flex h-1 w-10 rounded-full bg-white/20" />
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  {editingLoan ? t('loans.editLoan') : t('loans.newLoan')}
                </h2>
                <button onClick={() => setShowForm(false)} className="rounded-full p-1 text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <Input
                  label={t('loans.loanName')}
                  placeholder="e.g. Mortgage, Car Loan"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
                <Input
                  label={t('loans.totalAmount')}
                  type="number"
                  placeholder="100000"
                  value={formTotal}
                  onChange={(e) => setFormTotal(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={t('loans.interestRate')}
                    type="number"
                    placeholder="5.5"
                    suffix="%"
                    value={formRate}
                    onChange={(e) => setFormRate(e.target.value)}
                  />
                  <Input
                    label={t('loans.termMonths')}
                    type="number"
                    placeholder="360"
                    suffix="mo"
                    value={formTerm}
                    onChange={(e) => setFormTerm(e.target.value)}
                  />
                </div>
                <Input
                  label={t('loans.monthly')}
                  type="number"
                  placeholder="1500"
                  value={formMonthly}
                  onChange={(e) => setFormMonthly(e.target.value)}
                />
                <Input
                  label={t('loans.startDate')}
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                />

                <Button
                  onClick={handleSave}
                  size="lg"
                  className="w-full"
                  loading={formSaving}
                  disabled={!formName || !formTotal || !formRate || !formTerm || !formMonthly}
                >
                  {editingLoan ? <Pencil size={16} /> : <Plus size={16} />}
                  {editingLoan ? t('loans.updateLoan') : t('loans.createLoan')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
