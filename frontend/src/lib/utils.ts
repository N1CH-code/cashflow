import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const currencySymbols: Record<string, string> = {
  EUR: '\u20AC', USD: '\u0024', GBP: '\u00A3', RUB: '\u20BD', UAH: '\u20B4', PLN: 'z\u0142', CHF: 'Fr',
};

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  if (!amount && amount !== 0) return `${currencySymbols[currency] || currency}0.00`;
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currencySymbols[currency] || currency}${amount < 0 ? '-' : ''}${formatted}`;
}

export function formatCompactCurrency(amount: number, currency: string = 'EUR'): string {
  if (!amount && amount !== 0) return `${currencySymbols[currency] || currency}0`;
  const sym = currencySymbols[currency] || currency;
  if (Math.abs(amount) >= 1_000_000) return `${sym}${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000) return `${sym}${(amount / 1_000).toFixed(1)}K`;
  return `${sym}${amount.toFixed(0)}`;
}

export function getCurrencySymbol(currency: string): string {
  return currencySymbols[currency] || currency;
}

export function daysUntilSalary(salaryDate: number): number {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let salaryDay = new Date(currentYear, currentMonth, salaryDate);
  if (salaryDay < now) {
    salaryDay = new Date(currentYear, currentMonth + 1, salaryDate);
  }

  return Math.ceil((salaryDay.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getLevelTitle(level: number): string {
  const titles: Record<number, string> = {
    1: 'Novice',
    2: 'Controller',
    3: 'Economist',
    4: 'Strategist',
    5: 'Investor',
    6: 'Financial Master',
    7: 'Wealth Guardian',
    8: 'Money Sage',
    9: 'Prosperity Legend',
    10: 'CashFlow King',
  };
  return titles[level] || 'Legend';
}

export function getLevelXp(level: number): number {
  const thresholds = [0, 0, 100, 300, 600, 1000, 2000, 3500, 5000, 7500, 10000];
  return thresholds[level] || 10000;
}

export function getFinancialTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    SAVER: 'Saver',
    INVESTOR: 'Investor',
    IMPULSIVE: 'Impulsive',
    RATIONALIST: 'Rationalist',
    ADVENTURER: 'Adventurer',
  };
  return labels[type] || type;
}

export function getFinancialTypeEmoji(type: string): string {
  const emojis: Record<string, string> = {
    SAVER: '🐷',
    INVESTOR: '📈',
    IMPULSIVE: '🛍️',
    RATIONALIST: '📊',
    ADVENTURER: '🚀',
  };
  return emojis[type] || '💡';
}

export function getCategoryIcon(icon: string): string {
  const icons: Record<string, string> = {
    'shopping-cart': '🛒',
    car: '🚗',
    coffee: '☕',
    'utensils-crossed': '🍽️',
    popcorn: '🎬',
    repeat: '🔄',
    plane: '✈️',
    shirt: '👕',
    'heart-pulse': '❤️',
    'book-open': '📚',
    package: '📦',
    'file-text': '📄',
    wallet: '👛',
    cafe: '☕',
    restaurants: '🍽️',
    groceries: '🛒',
    subscriptions: '🔄',
    laptop: '💻',
    'trending-up': '📈',
    'more-horizontal': '📌',
  };
  return icons[icon] || '📌';
}

export function ordinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
