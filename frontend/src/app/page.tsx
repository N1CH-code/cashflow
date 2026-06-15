'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles } from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { useTelegram } from '@/components/layout/TelegramProvider';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

export default function SplashPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user: tgUser, ready: tgReady } = useTelegram();
  const { isAuthenticated, isLoading, user, setUser, setToken, setLoading } = useAppStore();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tgReady) setLoading(false);
  }, [tgReady]);

  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    const webApp = (window as any).Telegram?.WebApp;
    setIsDev(!webApp?.initData && typeof window !== 'undefined' && window.location.hostname === 'localhost');
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/home');
      return;
    }
    if (!tgReady || isLoading) return;

    const autoLogin = async () => {
      setConnecting(true);
      setError(null);
      const webApp = (window as any).Telegram?.WebApp;
      const initData = webApp?.initData;
      if (!initData && !isDev) {
        if (!webApp) {
          setError(t('splash.noWebApp'));
        } else {
          setError(t('splash.noInitData'));
        }
        setConnecting(false);
        return;
      }
      if (isDev) {
        setConnecting(false);
        return;
      }
      try {
        const res = await api.login(initData);
        api.setToken(res.access_token);
        setToken(res.access_token);
        const userData = await api.getMe();
        setUser(userData);
        router.replace('/home');
      } catch (e: any) {
        const msg = e?.response?.data?.message || e?.message || t('common.error');
        setError(`Login failed: ${msg}`);
      }
      setConnecting(false);
    };

    autoLogin();
  }, [tgReady, isLoading, isAuthenticated, isDev]);

  useEffect(() => {
    if (isAuthenticated && user?.onboardingComplete === false) {
      router.replace('/onboarding');
    }
  }, [isAuthenticated, user, router]);

  const handleDevLogin = async () => {
    setConnecting(true);
    setError(null);
    try {
      const res = await api.devLogin();
      api.setToken(res.access_token);
      setToken(res.access_token);
      const userData = await api.getMe();
      setUser(userData);
      router.replace('/home');
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || t('common.error');
      setError(`Dev login failed: ${msg}`);
    }
    setConnecting(false);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-dark-bg px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-accent-ruby/20 blur-[100px]" />
        <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-accent-crimson/20 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-ruby to-accent-crimson shadow-2xl shadow-accent-ruby/30">
          <Sparkles size={44} className="text-white" />
        </div>

        <h1 className="bg-gradient-to-r from-accent-ruby via-accent-crimson to-accent-rose bg-clip-text text-5xl font-extrabold text-transparent">
          CashFlow
        </h1>
        <p className="mt-2 text-lg text-white/50">{t('splash.subtitle')}</p>
      </div>

      <div className="relative z-10 mt-12 flex flex-col items-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent-rose" />
        <p className="mt-3 text-sm text-white/40">
          {connecting ? t('splash.connecting') : t('splash.initializing')}
        </p>
        {error && (
          <p className="mt-4 max-w-xs text-center text-xs text-red-400">
            {error}
          </p>
        )}
        {isDev && !isAuthenticated && (
          <button
            onClick={handleDevLogin}
            disabled={connecting}
            className="mt-6 rounded-xl bg-gradient-to-r from-accent-ruby to-accent-crimson px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {connecting ? t('splash.loggingIn') : t('splash.devLogin')}
          </button>
        )}
        {isDev && !isAuthenticated && error && (
          <button
            onClick={handleDevLogin}
            className="mt-3 rounded-lg bg-white/10 px-5 py-2 text-xs text-white/60"
          >
            {t('splash.retry')}
          </button>
        )}
      </div>
    </div>
  );
}
