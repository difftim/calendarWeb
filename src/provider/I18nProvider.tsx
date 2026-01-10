import React, { ReactNode } from 'react';
import { LocalizerType } from '../types/Util';

interface I18nContextType {
  i18n: LocalizerType;
  locale: string;
}

interface I18nProviderProps {
  children: ReactNode;
  translations?: Record<string, any>;
  locale?: string;
}

const defaultI18n = (window as any).i18n || {};
const defaultLocale = defaultI18n?.getLocale?.() || 'en';

const defaultContextValue = {
  i18n: defaultI18n,
  locale: defaultLocale,
};

export const I18nContext = React.createContext<I18nContextType>(defaultContextValue);

export const I18nProvider: React.FC<I18nProviderProps> = ({ children, translations, locale }) => {
  const mainWindow = window as any;
  const effectiveTranslations = translations || mainWindow.i18n || {};
  const effectiveLocale = locale || mainWindow.i18n?.getLocale() || 'en';

  const value: I18nContextType = {
    i18n: effectiveTranslations,
    locale: effectiveLocale,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
