import React, { useState } from 'react';
import { Select } from 'antd';
import { uniqBy } from 'lodash';

import { REPEAT_OPTIONS } from '@/constants';
import { useSetDetailData } from '@/hooks/useDetailData';
import { useI18n } from '@/hooks/useI18n';
import {
  CustomRepeat,
  ScheduleMeetingCustomRepeatModal,
} from './components/ScheduleMeetingCustomRepeatModal';
import { useDetailDataValueWithTimeZone as useDetailData } from '@/hooks/useCurrentTimeZone';

const Repeat = () => {
  const { i18n } = useI18n();
  const NEVER_REPEAT = i18n('schedule.never');
  const {
    mode,
    isLiveStream,
    recurringRule = {
      repeatOptions: REPEAT_OPTIONS,
      rrule: 'Never',
    },
    isRecurring = false,
    canNotEdit,
    date,
  } = useDetailData();
  const setData = useSetDetailData();
  const [customRepeat, setCustomRepeat] = useState<CustomRepeat>({
    options: [{ label: 'Custom...', value: 'custom' }],
    show: false,
  });

  if (isLiveStream) {
    return null;
  }

  const repeatOptions = recurringRule?.repeatOptions || REPEAT_OPTIONS;

  // view
  if (mode === 'view') {
    const renderRepeatStr = () => {
      if (!isRecurring) {
        return NEVER_REPEAT;
      }
      if (recurringRule?.repeat) {
        return recurringRule.repeat;
      }

      return (
        repeatOptions.find(item => item.value === recurringRule.rrule)?.label ||
        recurringRule.rrule ||
        NEVER_REPEAT
      );
    };

    return (
      <div className="item">
        <div className="item-title">{i18n('schedule.repeat')}</div>
        <div className="preview-item" style={{ height: 'auto' }}>
          {renderRepeatStr()}
        </div>
      </div>
    );
  }

  const setRepeat = (v: string) => {
    setData(prev => ({
      ...prev,
      recurringRule: { ...prev.recurringRule, rrule: v },
    }));
  };

  return (
    <>
      <div className="item">
        <div className="item-title">{i18n('schedule.repeat')}</div>
        <div style={{ maxWidth: '248px' }}>
          <Select
            disabled={canNotEdit}
            variant="outlined"
            size="large"
            value={recurringRule.rrule}
            listHeight={300}
            onChange={v => {
              if (v === 'custom') {
                setCustomRepeat(prev => ({ ...prev, show: true }));
                return;
              }
              setRepeat(v);
            }}
            options={uniqBy([...repeatOptions, ...customRepeat.options], 'value')}
            popupClassName="schedule-selector"
            virtual={false}
          />
        </div>
      </div>
      <ScheduleMeetingCustomRepeatModal
        date={date!}
        repeat={recurringRule.rrule!}
        customRepeat={customRepeat}
        setCustomRepeat={setCustomRepeat}
        setRepeat={setRepeat as any}
      />
    </>
  );
};
export default Repeat;
