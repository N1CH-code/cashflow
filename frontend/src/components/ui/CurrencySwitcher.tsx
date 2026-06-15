'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/stores/app.store';
import { DollarSign } from 'lucide-react';
import type { Currency } from '@/types';
import { getCurrencySymbol } from '@/lib/utils';

const options: { value: Currency; symbol: string }[] = [
  { value: 'EUR', symbol: '\u20AC' },
  { value: 'USD', symbol: '\u0024' },
  { value: 'RUB', symbol: '\u20BD' },
];

export function CurrencySwitcher() {
  const preferredCurrency = useAppStore((s) => s.preferredCurrency);
  const setPreferredCurrency = useAppStore((s) => s.setPreferredCurrency);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
      >
        <DollarSign size={14} />
        {mounted ? getCurrencySymbol(preferredCurrency || 'EUR') : getCurrencySymbol('EUR')}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-28 rounded-xl bg-dark-surface border border-white/10 p-1 shadow-xl z-50">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setPreferredCurrency(opt.value);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors ${
                (preferredCurrency || 'EUR') === opt.value
                  ? 'bg-accent-ruby/20 text-accent-rose'
                  : 'text-white/50 hover:bg-white/5 hover:text-white/80'
              }`}
            >
              <span className="text-sm">{opt.symbol}</span>
              <span>{opt.value}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
