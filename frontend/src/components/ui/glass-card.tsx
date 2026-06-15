'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  ruby?: boolean;
  glow?: boolean;
  noHighlight?: boolean;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, hover = false, ruby = false, glow = false, noHighlight = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-3xl border backdrop-blur-xl transition-all duration-300',
          ruby
            ? 'border-glassRuby-border bg-glassRuby'
            : 'border-glass-border bg-glass',
          !noHighlight && 'glass-inner-highlight',
          hover && (ruby
            ? 'hover:bg-glassRuby-light hover:border-glassRuby-border hover:shadow-lg hover:shadow-accent-ruby/10'
            : 'hover:bg-glass-light hover:border-white/20 hover:shadow-lg hover:shadow-white/5'),
          glow && 'glow-ruby',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
GlassCard.displayName = 'GlassCard';

export { GlassCard };
