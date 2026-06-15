'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  withPadding?: boolean;
  withNav?: boolean;
}

export function PageContainer({
  children,
  className,
  withPadding = true,
  withNav = true,
}: PageContainerProps) {
  return (
    <main
      className={cn(
        'mx-auto min-h-screen w-full max-w-lg',
        withPadding && 'px-4',
        withNav && 'pb-28',
        className,
      )}
    >
      {children}
    </main>
  );
}
