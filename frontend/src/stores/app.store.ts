import { create } from 'zustand';
import { User, DashboardData, GamificationProfile, Currency } from '@/types';

interface AppState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  dashboard: DashboardData | null;
  gamification: GamificationProfile | null;
  preferredCurrency: Currency | null;

  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setDashboard: (data: DashboardData) => void;
  setGamification: (profile: GamificationProfile) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setPreferredCurrency: (currency: Currency) => void;
}

function getStoredCurrency(): Currency | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('cf_currency');
    if (stored === 'EUR' || stored === 'USD' || stored === 'RUB' || stored === 'GBP' || stored === 'UAH' || stored === 'PLN' || stored === 'CHF') return stored;
  }
  return null;
}

const storedCurrency = getStoredCurrency();

export const useAppStore = create<AppState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  dashboard: null,
  gamification: null,
  preferredCurrency: storedCurrency,

  setUser: (user) => {
    const stored = storedCurrency || user.currency;
    set({ user, isAuthenticated: true, preferredCurrency: stored });
    if (typeof window !== 'undefined' && !storedCurrency) {
      localStorage.setItem('cf_currency', user.currency);
    }
  },

  setToken: (token) => set({ token }),

  setDashboard: (dashboard) => set({ dashboard }),

  setGamification: (gamification) => set({ gamification }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cf_token');
      localStorage.removeItem('cf_currency');
    }
    set({ user: null, token: null, isAuthenticated: false, dashboard: null, gamification: null, preferredCurrency: null });
  },

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  setPreferredCurrency: (currency) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('cf_currency', currency);
    }
    set({ preferredCurrency: currency });
  },
}));
