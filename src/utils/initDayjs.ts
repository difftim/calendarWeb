import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import isTomorrow from 'dayjs/plugin/isTomorrow';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import updateLocale from 'dayjs/plugin/updateLocale';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';

import 'dayjs/locale/zh-cn';

const initDayjs = (locale: 'en' | 'zh-cn' = 'en', i18n: any) => {
  dayjs.extend(duration);
  dayjs.extend(relativeTime);
  dayjs.extend(isToday);
  dayjs.extend(isTomorrow);
  dayjs.extend(isYesterday);
  dayjs.extend(localizedFormat);
  dayjs.extend(updateLocale);
  dayjs.extend(utc);
  dayjs.extend(timezone);
  dayjs.extend(isoWeek);
  dayjs.extend(isBetween);

  const _relativeTime = dayjs.Ls[locale]?.relativeTime || {};

  dayjs.updateLocale(locale, {
    relativeTime: {
      ..._relativeTime,
      s: i18n('timestamp_s'),
      m: i18n('timestamp_m'),
      h: i18n('timestamp_h'),
    },
  });
  dayjs.locale(locale);
};

export { initDayjs };
