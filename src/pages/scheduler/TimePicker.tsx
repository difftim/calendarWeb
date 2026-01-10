import { userIdAtom } from '@/atoms';
import {
  useCurrentTimeZone,
  useDetailDataValueWithTimeZone as useDetailData,
} from '@/hooks/useCurrentTimeZone';
import { useSetDetailData } from '@/hooks/useDetailData';
import { useI18n } from '@/hooks/useI18n';
import { formatTime, getUtcOffset, uid2cid } from '@/util';
import { Dayjs } from 'dayjs';
import { useAtomValue } from 'jotai';
import React from 'react';
import ScheduleMeetingTimePicker from './components/ScheduleMeetingTimePicker';

function TimePicker() {
  const { mode, start, calendarId, isEvent, isAllDay, date, time, canNotEdit } = useDetailData();
  const setData = useSetDetailData();
  const { i18n } = useI18n();
  const myId = useAtomValue(userIdAtom);
  const { timeZone } = useCurrentTimeZone();
  const showToday = calendarId === uid2cid(myId);

  if (mode === 'view') {
    return (
      <div className="item">
        <div className="item-title mt-2">
          <div style={{ lineHeight: '20px' }}>{i18n('schedule.start')}</div>
          <div className="timezone">{getUtcOffset(timeZone)}</div>
        </div>
        <div className="preview-item" style={{ minHeight: '40px', height: 'auto' }}>{`${formatTime(
          start * 1000,
          {
            withRelativeTime: true,
            locale: 'en',
            tz: timeZone,
            showToday,
            ignoreTime: isEvent && isAllDay,
          }
        )}`}</div>
      </div>
    );
  }

  return (
    <ScheduleMeetingTimePicker
      showToday={showToday}
      timeZone={timeZone}
      date={date!}
      time={time!}
      disabled={canNotEdit}
      setTime={(time: Dayjs) => setData({ time })}
      setDate={(date: Dayjs) => setData({ date })}
      quickSort={isEvent ? [] : undefined}
      ignoreTime={isAllDay}
    />
  );
}

export default TimePicker;
