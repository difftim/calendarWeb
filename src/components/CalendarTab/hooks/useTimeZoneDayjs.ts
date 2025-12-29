import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export const useTimeZoneDayjs = () => {
  // 默认使用系统时区
  const [timeZone] = useState(() => dayjs.tz.guess());

  const createTzDayjs = (date?: any, locale?: string) => {
    if (date) {
      return dayjs(date)
        .tz(timeZone)
        .locale(locale || 'en');
    }
    return dayjs().tz(timeZone);
  };

  const utcOffset = dayjs().tz(timeZone).utcOffset() / 60;

  return {
    timeZone,
    createTzDayjs,
    utcOffset,
  };
};

export default useTimeZoneDayjs;
