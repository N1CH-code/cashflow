'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, prefix, suffix, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-white/70 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {prefix && (
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/40">
              {prefix}
            </span>
          )}
          <input
            id={id}
            ref={ref}
            className={cn(
              'w-full rounded-xl border bg-dark-surface py-3 text-sm text-white transition-all duration-200',
              'placeholder:text-white/30',
              'focus:outline-none focus:ring-2 focus:ring-accent-ruby/50 focus:border-accent-ruby/50',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              prefix && 'pl-8',
              suffix && 'pr-8',
              error ? 'border-accent-red/50 focus:ring-accent-red/50' : 'border-dark-border',
              className,
            )}
            {...props}
          />
          {suffix && (
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/40">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-accent-red">{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
