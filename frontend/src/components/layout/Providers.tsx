'use client';

import { ReactNode } from 'react';
import { I18nProvider } from '@/lib/i18n';
import { TelegramProvider } from './TelegramProvider';
import { StoreProvider } from './StoreProvider';

import { ErrorBoundary } from './ErrorBoundary';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <StoreProvider>
        <TelegramProvider>
          <I18nProvider>
            {children}
          </I18nProvider>
        </TelegramProvider>
      </StoreProvider>
    </ErrorBoundary>
  );
}
