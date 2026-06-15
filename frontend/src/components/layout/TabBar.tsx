'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

interface Tab {
  href: string;
  icon: ReactNode;
}

interface TabBarProps {
  tabs: Tab[];
}

const tabLabels: Record<string, string> = {
  '/home': 'tabBar.home',
  '/transactions': 'tabBar.transactions',
  '/analytics': 'tabBar.analytics',
  '/goals': 'tabBar.goals',
  '/profile': 'tabBar.profile',
};

export function TabBar({ tabs }: TabBarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 mx-auto w-full max-w-lg">
      <div className="relative mx-3 mb-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-[1.8] shadow-2xl shadow-black/40">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="relative flex items-center justify-around px-2 py-1.5">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 px-3 py-2 transition-all duration-200',
                  isActive ? 'text-white' : 'text-white/30',
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute inset-0 rounded-xl bg-white/[0.07]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 drop-shadow-sm">{tab.icon}</span>
                <span className="relative z-10 hidden text-[10px] font-medium tracking-wide xs:block">
                  {t(tabLabels[tab.href] || tabLabels['/'])}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
