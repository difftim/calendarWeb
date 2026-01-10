import React, { ForwardRefRenderFunction, forwardRef, useImperativeHandle } from 'react';
import classNames from 'classnames';
import { DatePicker, DatePickerProps, Space } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

import TimePicker from '@shared/TimerPicker';
import { IconCalendar } from '@shared/IconsNew';
import { estimateTime, getUtcOffset } from '@/util';

type Props = {
  date: Dayjs | null;
  time: Dayjs | null;
  setDate: (d: Dayjs) => void;
  setTime: (d: Dayjs) => void;
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

const ScheduleMeetingTimePicker: ForwardRefRenderFunction<TimerRefFunctions, Props> = (
  {
    date,
    time,
    setDate,
    setTime,
    disabled = false,
    locale = 'en',
    quickSort = [
      { mins: 10, label: '10 mins later' },
      { mins: 30, label: '30 mins later' },
      { mins: 60, label: '1 hr later' },
    ],
    minuteStep = 30,
    datePickerClass = 'meeting-schedule-picker',
    timePickerClass = '',
    onRenderTitle,
    timeZone,
    showToday = true,
    ignoreTime = false,
  },
  ref
) => {
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

  if (!onRenderTitle) {
    onRenderTitle = () => {
      return (
        <div>
          <div style={{ lineHeight: '20px' }}>Start</div>
          <div className="timezone">{getUtcOffset(timeZone)}</div>
        </div>
      );
    };
  }

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
    // Date pick 选了后面的日子, time 随便设置
    if (date && !date.isToday()) return setTime(v);
    // Date pick 选了今日
    const now = (timeZone ? dayjs().tz(timeZone) : dayjs()).add(1, 'minute');
    setTime(v < now ? now : v);
  };

  const setQuickSort = (item: any) => {
    if (disabled) {
      return;
    }

    const now = timeZone ? dayjs().tz(timeZone) : dayjs();
    let time;
    if (item.todayFlag) {
      time = now.endOf('day');
    } else {
      time = estimateTime(now.add(item.mins, 'minute'), { timeZone });
    }
    setTime(time);
    setDate(time);
  };

  const onNormalizeInput = (v: string) => {
    v = v.toUpperCase().trim();
    if (v.endsWith(' AM') || v.endsWith(' PM')) {
      return v;
    }
    return v.replace('AM', ' AM').replace('PM', ' PM');
  };

  useImperativeHandle(ref, () => ({
    getStartTimestamp(date, time) {
      if (!date || !time) {
        return null;
      }

      const startDate = date
        .set('hour', time.get('hour'))
        .set('minute', time.get('minute'))
        .set('second', 0)
        .set('millisecond', 0);

      return startDate.unix();
    },
  }));

  return (
    <div className="item">
      <div className="item-title mt-2">{onRenderTitle()}</div>
      <Space direction="vertical" size={0}>
        <Space size={8}>
          <DatePicker
            className={classNames(datePickerClass, {
              disabled,
            })}
            disabled={disabled}
            allowClear={false}
            disabledDate={d => {
              const getStartUnix = (date = dayjs()) => {
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
              // 切换到今日时判断 time 合法性
              const current = timeZone ? dayjs().tz(timeZone) : dayjs();
              if (v && v.format('YYYY-MM-DD') === current.format('YYYY-MM-DD')) {
                const now = current.add(1, 'minutes');
                if (time && time < now) {
                  setTime(now);
                }
              }
              setDate(v);
            }}
            value={date}
            format={customFormat}
          />
          {!ignoreTime ? (
            <TimePicker
              className={classNames(timePickerClass)}
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
        {quickSort.length ? (
          <div className={classNames('quick-mins', { disabled })}>
            {quickSort.map((item: any) => {
              return (
                <span key={item.mins} onClick={() => setQuickSort(item)}>
                  {item.label}
                </span>
              );
            })}
          </div>
        ) : null}
      </Space>
    </div>
  );
};

export default forwardRef(ScheduleMeetingTimePicker);
