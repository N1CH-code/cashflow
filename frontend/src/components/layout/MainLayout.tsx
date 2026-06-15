'use client';

import { useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Target,
  User,
} from 'lucide-react';
import { TabBar } from './TabBar';
import { FloatingActionButton } from './FloatingActionButton';
import { PageContainer } from './PageContainer';
import { ErrorBoundary } from './ErrorBoundary';
import { AddTransactionSheet } from '@/app/(main)/transactions/add';
import { LangSwitcher } from '@/components/ui/LangSwitcher';
import { CurrencySwitcher } from '@/components/ui/CurrencySwitcher';

const tabs = [
  { href: '/home', icon: <LayoutDashboard size={20} /> },
  { href: '/transactions', icon: <ArrowLeftRight size={20} /> },
  { href: '/analytics', icon: <BarChart3 size={20} /> },
  { href: '/goals', icon: <Target size={20} /> },
  { href: '/profile', icon: <User size={20} /> },
];

interface MainLayoutProps {
  children: ReactNode;
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function MainLayout({ children }: MainLayoutProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen bg-dark-bg text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(225,29,72,0.08),transparent_50%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMCAwaDQwdjQwSDB6IiBmaWxsPSJub25lIi8+PHBhdGggZD0iTTAgMjBoNDBNMjAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] opacity-60" />
      <div className="fixed right-4 top-4 z-50 flex items-center gap-2">
        <CurrencySwitcher />
        <LangSwitcher />
      </div>

      <ErrorBoundary>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <PageContainer>{children}</PageContainer>
          </motion.div>
        </AnimatePresence>
      </ErrorBoundary>

      <FloatingActionButton onClick={() => setSheetOpen(true)} />
      <TabBar tabs={tabs} />

      <AddTransactionSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
