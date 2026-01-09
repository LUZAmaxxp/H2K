'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Locale } from './i18n-client';


interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: Record<string, string>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children, initialLocale = 'en' as Locale }: { children: React.ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    const getStoredLocale = (): Locale | null => {
      try {
        const settingsRaw = localStorage.getItem('user-settings');
        if (settingsRaw) {
          const settings = JSON.parse(settingsRaw);
          const lang = settings?.language;
          if (lang && ['en', 'fr', 'es', 'ar'].includes(lang)) {
            return lang as Locale;
          }
        }
      } catch {
        // ignore JSON parsing errors
      }

      const stored = localStorage.getItem('locale');
      if (stored && ['en', 'fr', 'es', 'ar'].includes(stored)) {
        return stored as Locale;
      }
      return null;
    };

    const storedLocale = getStoredLocale();
    if (storedLocale && storedLocale !== initialLocale) {
      setLocaleState(storedLocale);
    }
  }, [initialLocale]);

  const setLocale = async (newLocale: Locale) => {
    setLocaleState(newLocale);
    // Load messages for the new locale
    try {
      const newMessages = (await import(`../../messages/${newLocale}.json`)).default;
      setMessages(newMessages);
      // Store in localStorage
      localStorage.setItem('locale', newLocale);
      // Update document direction for RTL languages
      document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = newLocale;
    } catch (error: unknown) {
      console.error('Failed to load messages for locale:', newLocale, error);
    }
  };

  useEffect(() => {
    // Load initial messages and set initial direction
    const loadInitialMessages = async () => {
      try {
        const initialMessages = (await import(`../../messages/${locale}.json`)).default;
        setMessages(initialMessages);
        // Set initial direction
        document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = locale;
      } catch (error: unknown) {
        console.error('Failed to load initial messages', error);
      }
    };

    loadInitialMessages();
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, messages }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export function useTranslation() {
  const { messages, locale, setLocale } = useI18n();

  const t = (key: string, params?: Record<string, string>) => {
    const keys = key.split('.');
    let value: Record<string, string> | string | undefined = messages;

    for (const k of keys) {
      if (typeof value === 'object' && value !== null) {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }

    if (typeof value !== 'string') {
      return key; // Fallback to key if translation not found
    }

    // Replace parameters
    if (params) {
      return Object.entries(params).reduce((str: string, [param, val]: [string, string]) => {
        return str.replace(new RegExp(`{{${param}}}`, 'g'), val);
      }, value);
    }

    return value;
  };

  return { t, locale, setLocale };
}
