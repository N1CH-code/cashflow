'use client';

import { type ButtonHTMLAttributes } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onClick: () => void;
}

export function FloatingActionButton({ onClick, className, ...props }: FloatingActionButtonProps) {
  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 mx-auto w-full max-w-lg flex justify-center pointer-events-none">
    <button
      onClick={onClick}
      className={cn(
        'group pointer-events-auto',
        'flex h-14 w-14 items-center justify-center',
        'rounded-full bg-gradient-to-r from-accent-ruby to-accent-crimson',
        'shadow-2xl shadow-accent-ruby/40',
        'backdrop-blur-xl',
        'transition-all duration-300 hover:scale-110 hover:shadow-accent-ruby/60',
        'active:scale-95',
        'ring-1 ring-white/20',
        'animate-float',
        className,
      )}
      {...props}
    >
      <Plus size={24} className="text-white" />
    </button>
    </div>
  );
}
