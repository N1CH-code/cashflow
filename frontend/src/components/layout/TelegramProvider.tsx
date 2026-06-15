'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface TelegramContextType {
  webApp: any;
  user: any;
  ready: boolean;
  hapticFeedback: {
    impact: (style?: 'light' | 'medium' | 'heavy') => void;
    notification: (type?: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  showPopup: (message: string, title?: string) => void;
  showAlert: (message: string) => void;
  shareToStory: (mediaUrl: string, text?: string) => void;
  switchInlineQuery: (query: string) => void;
}

const TelegramContext = createContext<TelegramContextType | null>(null);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [webApp, setWebApp] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    try {
      const app = (window as any).Telegram?.WebApp;
      if (!app) {
        setReady(true);
        return;
      }

      app.ready();
      app.expand();

      setWebApp(app);
      setUser(app.initDataUnsafe?.user || null);

      const handleThemeChange = () => {
        const isDark = app.colorScheme === 'dark';
        document.documentElement.classList.toggle('dark', isDark);
      };

      app.onEvent('themeChanged', handleThemeChange);
      handleThemeChange();

      setReady(true);

      return () => {
        app.offEvent('themeChanged', handleThemeChange);
      };
    } catch {
      setReady(true);
    }
  }, []);

  const hapticFeedback = {
    impact: (style: 'light' | 'medium' | 'heavy' = 'medium') => {
      webApp?.HapticFeedback?.impactOccurred(style);
    },
    notification: (type: 'error' | 'success' | 'warning' = 'success') => {
      webApp?.HapticFeedback?.notificationOccurred(type);
    },
    selectionChanged: () => {
      webApp?.HapticFeedback?.selectionChanged();
    },
  };

  const showPopup = (message: string, title?: string) => {
    webApp?.showPopup({ title: title || 'CashFlow', message, buttons: [{ type: 'ok' }] });
  };

  const showAlert = (message: string) => {
    webApp?.showAlert(message);
  };

  const shareToStory = (mediaUrl: string, text?: string) => {
    webApp?.shareToStory(mediaUrl, { text });
  };

  const switchInlineQuery = (query: string) => {
    webApp?.switchInlineQuery(query);
  };

  return (
    <TelegramContext.Provider
      value={{ webApp, user, ready, hapticFeedback, showPopup, showAlert, shareToStory, switchInlineQuery }}
    >
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const ctx = useContext(TelegramContext);
  if (!ctx) {
    throw new Error('useTelegram must be used within TelegramProvider');
  }
  return ctx;
}
