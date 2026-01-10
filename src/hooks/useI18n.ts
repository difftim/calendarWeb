import { useCallback } from 'react';
import translations from '@/translate/en.json';

export const useI18n = () => {
  const i18n = useCallback((key: keyof typeof translations, substitutions?: string | string[]) => {
    const message = translations[key]?.message;
    if (!message) {
      return key;
    }
    if (Array.isArray(substitutions)) {
      return substitutions.reduce(
        (result, substitution) => result.replace(/\$.+?\$/, substitution),
        message
      );
    }
    if (substitutions) {
      return message.replace(/\$.+?\$/, substitutions);
    }
    return message;
  }, []);

  return { i18n };
};
