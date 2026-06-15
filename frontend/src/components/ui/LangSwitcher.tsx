'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Globe } from 'lucide-react';

export function LangSwitcher() {
  const { locale, setLocale } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const toggle = () => {
    setLocale(locale === 'en' ? 'ru' : 'en');
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 text-xs text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
    >
      <Globe size={14} />
      {mounted ? (locale === 'en' ? 'RU' : 'EN') : 'RU'}
    </button>
  );
}
