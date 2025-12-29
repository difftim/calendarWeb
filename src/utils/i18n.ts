// Mock i18n function for standalone calendar
export const createI18n = (locale: string = 'en') => {
  const translations: Record<string, Record<string, string>> = {
    en: {
      timestamp_s: 'a few seconds',
      timestamp_m: 'a minute',
      timestamp_h: 'an hour',
      // Add more translations as needed
    },
    'zh-cn': {
      timestamp_s: '几秒',
      timestamp_m: '1 分钟',
      timestamp_h: '1 小时',
      // Add more translations as needed
    },
  };

  return (key: string, values?: Array<string>) => {
    const translation = translations[locale]?.[key] || key;
    if (values && values.length > 0) {
      return translation.replace(/%\d/g, match => {
        const index = parseInt(match.slice(1), 10);
        return values[index] || match;
      });
    }
    return translation;
  };
};
