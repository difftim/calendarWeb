import React, { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';
import { DatePicker, DatePickerProps, Space } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

import TimePicker from '@/shared/TimerPicker';
import { IconCalendar } from '@/shared/IconsNew';
import { unstable_batchedUpdates } from 'react-dom';

type Props = {
  startDate: Dayjs;
  startTime: Dayjs;
  duration: number;
  setDuration: (duration: number) => void;
  disabled?: boolean;
  i18n?: any;
  locale?: string;
  quickSort?: any[];
  minuteStep?: number;
  datePickerClass?: string;
  timePickerClass?: string;
  onRenderTitle?: () => JSX.Element;
  timeZone?: string;
  showToday?: boolean;
  ignoreTime?: boolean;
};

export type TimerRefFunctions = {
  getStartTimestamp: (date: Dayjs, time: Dayjs) => number | null;
};

const ScheduleEventEndPicker: React.FC<Props> = ({
  disabled = false,
  locale = 'en',
  minuteStep = 30,
  timeZone,
  showToday = true,
  startDate,
  startTime,
  duration = 30,
  ignoreTime = false,
  setDuration,
}) => {
  const customFormat: DatePickerProps['format'] = value => {
    const valueOfUnix = (timeZone ? value.tz(timeZone) : value).startOf('day').unix();

    const now = (timeZone ? dayjs().tz(timeZone) : dayjs()).startOf('day').unix();

    if (showToday && valueOfUnix === now) {
      return `Today`;
    }

    if (showToday && valueOfUnix === now + 24 * 3600) {
      return `Tomorrow`;
    }

    if (timeZone) {
      value = value.tz(timeZone);
    }

    if (locale) {
      value = value.locale(locale);
    }

    return value.format(`ddd, MMM D`);
  };

  const startDateTime = useMemo(() => {
    return startDate
      .set('hour', ignoreTime ? 0 : startTime!.get('hour'))
      .set('minutes', ignoreTime ? 0 : startTime!.get('minute'));
  }, [startDate, startTime, ignoreTime]);

  const [date, setDate] = useState(() => startDateTime.add(duration, 'minutes'));
  const [time, setTime] = useState(() => startDateTime.add(duration, 'minutes'));

  const getEndDateTime = (options: { date?: Dayjs; time?: Dayjs; ignoreTime?: boolean } = {}) => {
    const d = options.date || date;
    const t = options.time || time;
    return d
      .set('hours', ignoreTime ? 23 : t.get('hours'))
      .set('minute', ignoreTime ? 59 : t.get('minutes'))
      .set('second', ignoreTime ? 59 : t.get('seconds'));
  };

  useEffect(() => {
    const currentEndDateTime = getEndDateTime({ ignoreTime });
    const startDateTimeUnix = startDateTime.unix();

    // recompute duration when start changes
    unstable_batchedUpdates(() => {
      if (currentEndDateTime.unix() - startDateTimeUnix < 60) {
        const newDateTime = ignoreTime
          ? startDateTime.endOf('day')
          : startDateTime.add(30, 'minutes');
        setDate(newDateTime);
        setTime(newDateTime);
        setDuration(newDateTime.diff(startDateTime, 'minutes'));
      } else {
        setDuration(currentEndDateTime.diff(startDateTime, 'minutes'));
      }
    });
  }, [startDateTime, ignoreTime]);

  const disabledTime = (current: Dayjs) => {
    const now = timeZone ? dayjs().tz(timeZone) : dayjs();
    if (date) {
      if (date.startOf('day') > now.startOf('day')) {
        return false;
      }
    }

    return now > current;
  };

  const fixTimeInput = (v: Dayjs | null) => {
    if (!v) return setTime(v as any);
    unstable_batchedUpdates(() => {
      const endDateTime = getEndDateTime({ time: v, ignoreTime });
      if (date.isSame(startDateTime, 'day') && endDateTime.unix() <= startDateTime.unix()) {
        setDuration(30);
        setTime(startDateTime.add(30, 'minutes'));
      } else {
        setTime(v);
        setDuration(Math.round(endDateTime.diff(startDateTime, 'minutes')));
      }
    });
  };

  const onNormalizeInput = (v: string) => {
    v = v.toUpperCase().trim();
    if (v.endsWith(' AM') || v.endsWith(' PM')) {
      return v;
    }
    return v.replace('AM', ' AM').replace('PM', ' PM');
  };

  return (
    <div className="item">
      <div className="item-title">End</div>
      <Space direction="vertical" size={0}>
        <Space size={8}>
          <DatePicker
            className={classNames('meeting-schedule-picker', {
              disabled,
            })}
            disabled={disabled}
            allowClear={false}
            disabledDate={d => {
              const getStartUnix = (date = startDate) => {
                if (timeZone) {
                  date = date.tz(timeZone);
                }
                return date.startOf('day').unix();
              };
              return getStartUnix(d) < getStartUnix();
            }}
            style={{
              cursor: disabled ? 'not-allowed!important' : 'pointer',
              width: ignoreTime ? '248px' : 'auto',
            }}
            suffixIcon={
              <IconCalendar
                style={{
                  color: 'var(--dsw-color-text-third)',
                  width: '17px',
                  height: '17px',
                }}
              />
            }
            size="large"
            onChange={v => {
              const endDateTime = getEndDateTime({ date: v, ignoreTime });
              unstable_batchedUpdates(() => {
                if (endDateTime.unix() <= startDateTime.unix()) {
                  const newEndDate = startDateTime.add(30, 'minutes');
                  setDate(newEndDate);
                  setTime(newEndDate);
                  setDuration(30);
                } else {
                  setDate(v);
                  setDuration(endDateTime.diff(startDateTime, 'minutes'));
                }
              });
            }}
            value={date}
            format={customFormat}
          />
          {!ignoreTime ? (
            <TimePicker
              style={{ width: '112px' }}
              value={time}
              disabled={disabled}
              onChange={fixTimeInput}
              disableTime={disabledTime}
              onNormalizeInput={onNormalizeInput}
              format={'h:mm A'}
              minuteStep={minuteStep}
              timeZone={timeZone}
            />
          ) : null}
        </Space>
      </Space>
    </div>
  );
};

export default ScheduleEventEndPicker;
