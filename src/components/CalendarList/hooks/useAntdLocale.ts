import zh from 'antd/locale/zh_CN';
import en from 'antd/locale/en_US';

export const useAntdLocale = (i18n?: any) => {
  const isCN = i18n?.('lang') === 'zh-CN';
  if (zh.DatePicker) {
    zh.DatePicker.lang.shortWeekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  }
  return isCN ? zh : en;
};
