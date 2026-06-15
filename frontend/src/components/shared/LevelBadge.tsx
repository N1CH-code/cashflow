'use client';

import { cn, getLevelTitle } from '@/lib/utils';

interface LevelBadgeProps {
  level: number;
  showTitle?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-6 min-w-6 text-[10px]',
  md: 'h-8 min-w-8 text-xs',
  lg: 'h-10 min-w-10 text-sm',
};

const titleSizeMap = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
};

export function LevelBadge({
  level,
  showTitle = false,
  size = 'md',
  className,
}: LevelBadgeProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full font-bold',
          'bg-gradient-to-br from-accent-ruby to-accent-crimson text-white',
          'shadow-lg shadow-accent-ruby/30',
          sizeMap[size],
        )}
      >
        {level}
      </span>
      {showTitle && (
        <span className={cn('font-medium text-white/70', titleSizeMap[size])}>
          {getLevelTitle(level)}
        </span>
      )}
    </div>
  );
}
