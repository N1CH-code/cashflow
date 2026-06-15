'use client';

import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  showLabel?: boolean;
  color?: 'ruby' | 'purple' | 'green' | 'blue' | 'orange' | 'red';
  size?: 'sm' | 'md' | 'lg';
}

const colorMap = {
  ruby: 'from-accent-ruby to-accent-crimson',
  purple: 'from-accent-purple to-accent-pink',
  green: 'from-accent-green to-accent-cyan',
  blue: 'from-accent-blue to-accent-purple',
  orange: 'from-accent-orange to-accent-red',
  red: 'from-accent-red to-accent-orange',
};

const Progress = ({
  value,
  max = 100,
  showLabel = false,
  color = 'ruby',
  size = 'md',
  className,
  ...props
}: ProgressProps) => {
  const pct = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full', className)} {...props}>
      <div
        className={cn(
          'w-full overflow-hidden rounded-full bg-white/5',
          size === 'sm' && 'h-1.5',
          size === 'md' && 'h-2',
          size === 'lg' && 'h-3',
        )}
      >
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out',
            colorMap[color],
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-right text-xs text-white/40">{pct.toFixed(0)}%</p>
      )}
    </div>
  );
};

export { Progress };
