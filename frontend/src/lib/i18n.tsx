/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo, useState } from 'react';
import type { Language } from './i18n-dictionaries';
import { dictionaries } from './i18n-dictionaries';
import { readLocalStorage, writeLocalStorage } from './storage';

const LANG_KEY = 'abasto.lang';

function getInitialLanguage(): Language {
  const stored = readLocalStorage(LANG_KEY);
  if (stored === 'es' || stored === 'en') return stored;

  const nav = typeof navigator !== 'undefined' ? navigator.language : 'es';
  return nav.toLowerCase().startsWith('es') ? 'es' : 'en';
}

type I18nContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(getInitialLanguage);

  const value = useMemo<I18nContextValue>(() => {
    return {
      lang,
      setLang(next) {
        writeLocalStorage(LANG_KEY, next);
        setLangState(next);
      },
      t(key) {
        return dictionaries[lang][key] ?? key;
      },
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
