'use client';

import { useEffect, type ReactNode } from 'react';
import { useAppStore } from '@/stores/app.store';
import { api } from '@/lib/api';

export function StoreProvider({ children }: { children: ReactNode }) {
  const { setUser, setToken, setLoading } = useAppStore();

  useEffect(() => {
    const init = async () => {
      const savedToken = api.loadToken();
      if (savedToken) {
        api.setToken(savedToken);
        setToken(savedToken);
        try {
          const user = await api.getMe();
          setUser(user);
        } catch {
          api.clearToken();
        }
      }
      setLoading(false);
    };

    init();
  }, []);

  return <>{children}</>;
}
