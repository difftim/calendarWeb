import { useCallback, useEffect, useState } from 'react';
import dayjs, { ConfigType } from 'dayjs';

let timeoutRef: NodeJS.Timeout | null = null;

export const useTimeZoneDayjs = () => {
  const [timeZone, _setTimeZone] = useState<string | undefined>(undefined);
  const [isSystemTimeZoneSwitchOn, setSystemTimeZoneSwitchOn] = useState(true);

  const isValidTimeZone = useCallback((timeZone: string) => {
    try {
      //will cause error if timeZone is not valid
      dayjs().tz(timeZone);
      return true;
    } catch {
      return false;
    }
  }, []);

  const setTimeZone = useCallback((timeZone?: string) => {
    timeoutRef && clearTimeout(timeoutRef);
    _setTimeZone(timeZone);
    if (timeZone) {
      timeoutRef = setTimeout(
        () => {
          _setTimeZone(undefined);
          timeoutRef && clearTimeout(timeoutRef);
        },
        5 * 60 * 1000
      );
    }
  }, []);

  useEffect(() => {
    if (!isSystemTimeZoneSwitchOn) {
      return;
    }
    if (timeZone) {
      setTimeZone(undefined);
      timeoutRef && clearTimeout(timeoutRef);
    }
  }, [isSystemTimeZoneSwitchOn, timeZone, setTimeZone]);

  const createTzDayjs = useCallback(
    (date?: ConfigType, locale?: string) => {
      if (timeZone) {
        return locale ? dayjs(date).tz(timeZone).locale(locale) : dayjs(date).tz(timeZone);
      }

      return locale ? dayjs(date).locale(locale) : dayjs(date);
    },
    [timeZone]
  );

  const utcOffset = (timeZone ? dayjs().tz(timeZone) : dayjs()).utcOffset() / 60;

  return {
    timeZone,
    utcOffset,
    isValidTimeZone,
    isSystemTimeZoneSwitchOn,
    createTzDayjs,
    setTimeZone,
    setSystemTimeZoneSwitchOn,
  };
};
