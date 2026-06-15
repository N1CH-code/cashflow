'use client';

import { cn } from '@/lib/utils';
import { getCategoryIcon } from '@/lib/utils';

interface CategoryIconProps {
  icon: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'text-lg h-8 w-8',
  md: 'text-xl h-10 w-10',
  lg: 'text-2xl h-12 w-12',
};

export function CategoryIcon({ icon, size = 'md', className }: CategoryIconProps) {
  const emoji = getCategoryIcon(icon);

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-xl bg-white/5',
        sizeMap[size],
        className,
      )}
      role="img"
      aria-label={icon}
    >
      {emoji}
    </span>
  );
}
