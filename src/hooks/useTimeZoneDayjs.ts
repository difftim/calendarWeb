import { useCallback, useEffect } from 'react';
import dayjs, { ConfigType } from 'dayjs';
import { useAtom } from 'jotai';

import { isSystemTimeZoneAtom, timeZoneAtom } from '@/atoms';
import { useGetAtom } from './useGetAtom';

let timeoutRef: NodeJS.Timeout | null = null;

export const useTimeZoneDayjs = () => {
  const [timeZone, _setTimeZone] = useAtom(timeZoneAtom);
  const getTimeZone = useGetAtom(timeZoneAtom);
  const [isSystemTimeZoneSwitchOn, setSystemTimeZoneSwitchOn] = useAtom(isSystemTimeZoneAtom);

  const isValidTimeZone = useCallback((timeZone: string) => {
    try {
      //will cause error if timeZone is not valid
      dayjs().tz(timeZone);
      return true;
    } catch {
      return false;
    }
  }, []);

  const setTimeZone = useCallback((timeZone: string) => {
    const isSameTimeZone = getTimeZone() === dayjs.tz.guess();
    timeoutRef && clearTimeout(timeoutRef);
    _setTimeZone(timeZone);
    if (!isSameTimeZone) {
      timeoutRef = setTimeout(
        () => {
          _setTimeZone(dayjs.tz.guess());
          timeoutRef && clearTimeout(timeoutRef);
        },
        5 * 60 * 1000
      );
    }
  }, []);

  useEffect(() => {
    if (isSystemTimeZoneSwitchOn) {
      timeoutRef && clearTimeout(timeoutRef);
      const realTimeZone = dayjs.tz.guess();
      const isSameTimeZone = getTimeZone() === realTimeZone;
      if (!isSameTimeZone) {
        setTimeZone(dayjs.tz.guess());
      }
    }
  }, [isSystemTimeZoneSwitchOn]);

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
