'use client';

import { cn } from '@/lib/utils';

interface ShimmerProps {
  className?: string;
}

const shimmerBase = 'animate-shimmer bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] rounded-lg';

function Shimmer({ className }: ShimmerProps) {
  return <div className={cn(shimmerBase, className)} />;
}

function ShimmerCard() {
  return (
    <div className="rounded-2xl border border-white/5 bg-dark-card/80 p-5 space-y-4">
      <Shimmer className="h-4 w-1/3" />
      <Shimmer className="h-8 w-2/3" />
      <Shimmer className="h-3 w-full" />
      <div className="flex gap-2">
        <Shimmer className="h-3 w-1/4" />
        <Shimmer className="h-3 w-1/4" />
      </div>
    </div>
  );
}

function ShimmerTextLine({ className }: ShimmerProps) {
  return <Shimmer className={cn('h-3', className)} />;
}

function ShimmerAvatar({ className }: ShimmerProps) {
  return <Shimmer className={cn('h-10 w-10 rounded-full', className)} />;
}

export { Shimmer, ShimmerCard, ShimmerTextLine, ShimmerAvatar };
