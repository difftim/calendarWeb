import { useAtomValue } from 'jotai';
import { useDetailDataValue } from './useDetailData';
import { useTimeZoneDayjs } from './useTimeZoneDayjs';
import { bossCalendarAtom } from '@/atoms';
import { useMemo } from 'react';
import { DetailData } from '@/atoms/detail';

export const useCurrentTimeZone = () => {
  const { timeZone: myTimeZone } = useTimeZoneDayjs();
  const { calendarId, isLiveStream } = useDetailDataValue();
  const bossCalendar = useAtomValue(bossCalendarAtom);

  const currentTimeZone = useMemo(() => {
    if (isLiveStream) {
      return myTimeZone;
    }
    return bossCalendar.find(item => item.cid === calendarId)?.timeZone || myTimeZone;
  }, [calendarId, bossCalendar, myTimeZone]);

  return {
    timeZone: currentTimeZone,
  };
};

export const useDetailDataValueWithTimeZone = () => {
  const { timeZone } = useCurrentTimeZone();
  const { date: _date, time: _time, ...rest } = useDetailDataValue();
  const date = useMemo(() => _date?.tz(timeZone), [_date, timeZone]);
  const time = useMemo(() => _time?.tz(timeZone), [_time, timeZone]);

  return {
    ...rest,
    canNotEdit: rest.mode === 'view' && !rest.canModify,
    date,
    time,
  } as DetailData & { canNotEdit: boolean };
};
