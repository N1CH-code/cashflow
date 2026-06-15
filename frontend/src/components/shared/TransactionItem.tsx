'use client';

import type { Transaction } from '@/types';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { cn, formatCurrency, getDateLabel } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface TransactionItemProps {
  transaction: Transaction;
  className?: string;
  currency?: string;
}

export function TransactionItem({
  transaction,
  className,
  currency,
}: TransactionItemProps) {
  const { t } = useTranslation();
  const isIncome = transaction.type === 'INCOME';

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-white/5',
        className,
      )}
    >
      <CategoryIcon
        icon={transaction.category?.icon || 'more-horizontal'}
        size="md"
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {transaction.description || transaction.category?.name || t('transactionItem.transaction')}
        </p>
        <p className="text-xs text-white/40 mt-0.5">
          {getDateLabel(transaction.date)}
          {transaction.tags?.length ? ` · ${transaction.tags[0]}` : null}
        </p>
      </div>

      <div className="text-right">
        <p
          className={cn(
            'text-sm font-semibold',
            isIncome ? 'text-accent-green' : 'text-white',
          )}
        >
          {isIncome ? '+' : '-'}
          {formatCurrency(transaction.amount, currency || transaction.currency)}
        </p>
        {transaction.source && (
          <p className="text-[10px] text-white/30 mt-0.5 capitalize">
            {transaction.source === 'AI_RECOGNITION'
              ? t('transactionItem.ai')
              : transaction.source.replace('_', ' ').toLowerCase()}
          </p>
        )}
      </div>
    </div>
  );
}
