'use client';

import { type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-white/10 text-white/80',
        success: 'bg-accent-green/15 text-accent-green',
        warning: 'bg-accent-orange/15 text-accent-orange',
        danger: 'bg-accent-red/15 text-accent-red',
        info: 'bg-accent-blue/15 text-accent-blue',
        premium: 'bg-gradient-to-r from-accent-ruby/20 to-accent-crimson/20 text-accent-rose',
        ruby: 'bg-accent-ruby/15 text-accent-rose',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = ({ className, variant, ...props }: BadgeProps) => {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
};

export { Badge, badgeVariants };
