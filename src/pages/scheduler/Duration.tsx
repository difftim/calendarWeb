import React from 'react';
import { Checkbox } from 'antd';
import { useAtomValue } from 'jotai';

import { userIdAtom } from '@/atoms';
import {
  useCurrentTimeZone,
  useDetailDataValueWithTimeZone as useDetailData,
} from '@/hooks/useCurrentTimeZone';
import { useI18n } from '@/hooks/useI18n';
import { formatRoundMinute, formatTime, uid2cid } from '@/util';
import { useSetDetailData } from '@/hooks/useDetailData';
import { DURATION_OPTIONS } from '@/constants';
import classNames from 'classnames';
import InputSelect from '@/components/shared/InputSelect';
import ScheduleEventEndPicker from './components/ScheduleEventEndPicker';

function Duration() {
  const { i18n } = useI18n();
  const {
    date,
    time,
    mode,
    isEvent,
    start,
    duration = 30,
    canNotEdit,
    isAllDay,
    calendarId,
  } = useDetailData();
  const myId = useAtomValue(userIdAtom);
  const { timeZone } = useCurrentTimeZone();
  const setDetailData = useSetDetailData();
  const _setDuration = (duration: number) => {
    setDetailData({ duration });
  };

  const setDuration = (duration: number) => {
    if (!canNotEdit) {
      _setDuration(duration);
    }
  };

  if (isEvent) {
    if (mode === 'view') {
      return (
        <div className="item">
          <div className="item-title">{i18n('schedule.end')}</div>
          <div className="preview-item" style={{ minHeight: '40px', height: 'auto' }}>
            {formatTime(start * 1000 + duration * 60 * 1000, {
              withRelativeTime: true,
              locale: 'en',
              tz: timeZone,
              showToday: calendarId === uid2cid(myId),
              ignoreTime: isEvent && isAllDay,
            })}
          </div>
        </div>
      );
    }

    return (
      <>
        <ScheduleEventEndPicker
          disabled={canNotEdit}
          startDate={date!}
          startTime={time!}
          timeZone={timeZone}
          duration={duration}
          setDuration={_setDuration}
          showToday={calendarId === uid2cid(myId)}
          ignoreTime={isAllDay}
        />
        <div style={{ marginBottom: '10px', marginLeft: '80px' }}>
          <Checkbox
            checked={isAllDay}
            disabled={canNotEdit}
            onChange={e => {
              const allDay = e.target.checked;
              setDetailData({ isAllDay: allDay });
            }}
          >
            All day
          </Checkbox>
        </div>
      </>
    );
  }

  if (mode === 'view') {
    return (
      <div className="item">
        <div className="item-title">{i18n('schedule.duration')}</div>
        <div className="preview-item">{formatRoundMinute(duration)}</div>
      </div>
    );
  }

  const onCheckValid = (
    v: string
  ): {
    valid: boolean;
    value?: any;
    label?: string;
  } => {
    v = v.trim();

    if (!v) {
      return {
        valid: false,
      };
    }

    const hint = DURATION_OPTIONS.find(item => item.label === v);

    if (hint) {
      return {
        valid: true,
        ...hint,
      };
    }

    if (!Number.isNaN(Number(v))) {
      const value = Math.round(Number(v));
      return {
        valid: true,
        value,
        label: `${value} ${value > 1 ? 'minutes' : 'minute'}`,
      };
    }

    if (v?.endsWith('day') || v?.endsWith('days')) {
      const _v = v.split('day')[0]?.trim();

      if (!_v || Number.isNaN(Number(_v))) {
        return {
          valid: false,
        };
      }

      const value = Math.round(Number(_v));

      return {
        valid: true,
        value: value * 1440,
        label: `${value} ${value > 1 ? 'days' : 'day'}`,
      };
    }

    if (v?.endsWith('hour') || v?.endsWith('hours')) {
      const _v = v.split('hour')[0]?.trim();

      if (!_v || Number.isNaN(Number(_v))) {
        return {
          valid: false,
        };
      }

      const value = Math.round(Number(_v));

      return {
        valid: true,
        value: value * 60,
        label: `${value} ${value > 1 ? 'hours' : 'hour'}`,
      };
    }

    if (v?.endsWith('minute') || v?.endsWith('minutes')) {
      const _v = v.split('minute')[0]?.trim();

      if (!_v || Number.isNaN(Number(_v))) {
        return {
          valid: false,
        };
      }

      const value = Math.round(Number(_v));

      return {
        valid: true,
        value: value,
        label: `${value} ${value > 1 ? 'minutes' : 'minute'}`,
      };
    }

    return {
      valid: false,
    };
  };

  return (
    <div className="item">
      <div className="item-title">{i18n('schedule.duration')}</div>
      <div>
        <InputSelect
          disabled={canNotEdit}
          variant="outlined"
          size="large"
          value={duration}
          onChange={setDuration}
          options={DURATION_OPTIONS}
          popupClassName="schedule-selector"
          virtual={false}
          onCheckValid={onCheckValid}
          labelRender={formatRoundMinute}
        />
        <div className={classNames('quick-mins', { disabled: canNotEdit })}>
          <span onClick={() => setDuration(15)}>15 mins</span>
          <span onClick={() => setDuration(30)}>30 mins</span>
          <span onClick={() => setDuration(60)}>1 hr</span>
        </div>
      </div>
    </div>
  );
}

export default Duration;
