import React, { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { Flex, InputNumber, Modal } from 'antd';
import { Dayjs } from 'dayjs';
import classNames from 'classnames';

import Select from '@shared/Select';
import { getDayOfMonth, getNthWeekdayOfMonth, isLastWeekdayOfMonth } from '@/util';

export interface CustomRepeat {
  options: any[];
  show: boolean;
}

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const weekDaysMap = weekDays.reduce(
  (acc, day, index) => {
    acc[day] = index + 1;
    return acc;
  },
  {} as Record<string, number>
);

export const ScheduleMeetingCustomRepeatModal = ({
  customRepeat,
  setCustomRepeat,
  repeat,
  setRepeat,
  date,
}: {
  customRepeat: CustomRepeat;
  setCustomRepeat: Dispatch<SetStateAction<CustomRepeat>>;
  repeat: string;
  setRepeat: Dispatch<SetStateAction<string>>;
  date: Dayjs;
}) => {
  const dateStr = date.format('YYYY-MM-DD');
  const currentWeekDay = date.locale('en').format('ddd');
  const [repeatCount, setRepeatCount] = useState(1);
  const [repeatType, setRepeatType] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [_pickedWeekDays, setPickedWeekDays] = useState<string[]>([currentWeekDay]);

  const pickedWeekDays = useMemo(
    () => _pickedWeekDays.sort((a, b) => weekDaysMap[a] - weekDaysMap[b]),
    [_pickedWeekDays]
  );

  const repeatTypeOptions = useMemo(() => {
    const isMultiple = repeatCount > 1;
    return [
      { label: isMultiple ? 'days' : 'day', value: 'day' },
      { label: isMultiple ? 'weeks' : 'week', value: 'week' },
      { label: isMultiple ? 'months' : 'month', value: 'month' },
      { label: isMultiple ? 'years' : 'year', value: 'year' },
    ];
  }, [repeatCount]);

  const monthOptions = useMemo(() => {
    const dayOfMonth = getDayOfMonth(date);
    const weekOfMonth = getNthWeekdayOfMonth(date);
    const lastWeekOfMonth = isLastWeekdayOfMonth(date);
    const orderMap = {
      1: '1st',
      2: '2nd',
      3: '3rd',
      4: '4th',
      5: '5th',
    };
    const options = [
      {
        label: `Monthly on day ${dayOfMonth}`,
        value: `FREQ=MONTHLY;BYMONTHDAY=${dayOfMonth}`,
      },
    ];

    if (weekOfMonth !== 5) {
      options.push({
        label: `Monthly on the ${orderMap[weekOfMonth]} ${date.locale('en').format('ddd')}`,
        value: `FREQ=MONTHLY;BYDAY=${weekOfMonth}${date.locale('en').format('dd').toUpperCase()}`,
      });
    }
    if (lastWeekOfMonth) {
      options.push({
        label: `Monthly on the last ${date.locale('en').format('ddd')}`,
        value: `FREQ=MONTHLY;BYDAY=-1${date.locale('en').format('dd').toUpperCase()}`,
      });
    }
    return options;
  }, [date]);

  const yearOptions = useMemo(() => {
    return [
      {
        label: `on ${date.locale('en').format('MMM D')}`,
        value: `BYMONTH=${date.format('MM')};BYMONTHDAY=${date.format('DD')}`,
      },
    ];
  }, [date]);

  const getRealMonthRule = (rule: string, interval: number) => {
    const [freq, by] = rule.split(';');
    return `${freq};INTERVAL=${interval};${by}`;
  };

  const [monthValue, setMonthValue] = useState(() => monthOptions[0].value);

  const getMonthOptionWithInterval = (
    monthOptions: any[], // without interval
    monthValue: string, // without interval
    interval: number
  ) => {
    const result = monthOptions.find(item => item.value === monthValue);

    // return result with interval
    if (!result) {
      return null;
    }

    return {
      label:
        interval === 1
          ? result.label
          : `Every ${interval} ${result.label.replace('Monthly', 'months')}`,
      value: getRealMonthRule(result.value, interval),
    };
  };

  const getYearOptionWithInterval = (option: any, interval: number) => {
    const label =
      interval === 1 ? `Annually ${option.label}` : `Every ${interval} years ${option.label}`;
    const value = `FREQ=YEARLY;INTERVAL=${interval};${option.value}`;

    return {
      label,
      value,
    };
  };

  const getCustomOption = () => {
    // day
    if (repeatType === 'day') {
      const value = `FREQ=DAILY;INTERVAL=${repeatCount}`;
      const label = repeatCount > 1 ? `Every ${repeatCount} days` : `Daily`;
      return {
        label,
        value,
      };
    }
    // week
    if (repeatType === 'week') {
      if (pickedWeekDays.length === 7 && repeatCount === 1) {
        return {
          label: 'Daily',
          value: `FREQ=DAILY;INTERVAL=1`,
        };
      }
      const getByDayStr = () => {
        if (
          pickedWeekDays.length === 2 &&
          pickedWeekDays.includes('Sat') &&
          pickedWeekDays.includes('Sun')
        ) {
          return `weekend`;
        }

        if (
          pickedWeekDays.length === 5 &&
          !pickedWeekDays.includes('Sat') &&
          !pickedWeekDays.includes('Sun')
        ) {
          return `weekdays`;
        }
        return pickedWeekDays.join(', ');
      };
      const rules = ['FREQ=WEEKLY', `INTERVAL=${repeatCount}`];
      const byDayRule =
        'BYDAY=' + pickedWeekDays.map(day => `${day.slice(0, 2).toUpperCase()}`).join(',');

      const byDayStr = getByDayStr();

      const value = [...rules, byDayRule].join(';');
      let label = '';
      if (byDayStr === 'weekend') {
        label = repeatCount === 1 ? 'Every weekend' : `Every ${repeatCount} weeks on Sat, Sun`;
      } else {
        label =
          repeatCount === 1 ? `Weekly on ${byDayStr}` : `Every ${repeatCount} weeks on ${byDayStr}`;
      }

      return {
        label,
        value,
      };
    }
    // month
    if (repeatType === 'month') {
      return getMonthOptionWithInterval(monthOptions, monthValue, repeatCount);
    }
    // year
    if (repeatType === 'year') {
      return getYearOptionWithInterval(yearOptions[0], repeatCount);
    }
    return null;
  };

  const repatInfoRef = useRef<any>();

  repatInfoRef.current = {
    currentWeekDay,
    monthValue,
    monthOptions,
    yearOptions,
    repeatCount,
    repeat,
  };

  useEffect(() => {
    // 是否需要根据日期变化改变自定义选项
    const shouldChangeRepeat = (repeat: string) => {
      const getInterval = (repeat: string) => {
        return repeat.includes('INTERVAL')
          ? parseInt(repeat.split('INTERVAL=')[1].split(';')[0])
          : 1;
      };

      if (!repeat) {
        return {
          shouldChange: false,
        };
      }
      if (repeat.includes('YEARLY')) {
        return {
          shouldChange: true,
          type: 'year',
          interval: getInterval(repeat),
        };
      }
      if (
        repeat.includes('MONTHLY') &&
        (repeat.includes('BYMONTHDAY') || repeat.includes('BYDAY'))
      ) {
        const index =
          repeat.indexOf('BYMONTHDAY') !== -1 ? 0 : repeat.includes('BYDAY=-1') ? -1 : 1;
        return {
          shouldChange: true,
          type: 'month',
          interval: getInterval(repeat),
          index,
        };
      }
      return {
        shouldChange: false,
      };
    };
    const repeat = repatInfoRef.current?.repeat;
    const { shouldChange, type, index = 0, interval = 1 } = shouldChangeRepeat(repeat);
    if (shouldChange) {
      const { monthOptions, yearOptions } = repatInfoRef.current;
      const isMonthly = type === 'month';
      let newOptions = isMonthly
        ? index === -1
          ? monthOptions[monthOptions.length - 1]
          : monthOptions[index]
        : yearOptions[0];

      unstable_batchedUpdates(() => {
        if (isMonthly) {
          setMonthValue(newOptions.value);
          newOptions = getMonthOptionWithInterval(monthOptions, newOptions.value, interval);
        } else {
          newOptions = getYearOptionWithInterval(newOptions, interval);
        }
        setRepeat(newOptions.value);
        setCustomRepeat(prev => {
          const options = [newOptions, { label: 'Custom...', value: 'custom' }].filter(Boolean);

          return {
            ...prev,
            options,
          };
        });
      });
    }
  }, [dateStr]);

  useEffect(() => {
    if (customRepeat.show) {
      const { currentWeekDay, monthValue, monthOptions } = repatInfoRef.current;
      unstable_batchedUpdates(() => {
        setRepeatType('week');
        setRepeatCount(1);
        setPickedWeekDays([currentWeekDay]);
        if (
          !monthOptions.find((item: { label: string; value: string }) => item.value === monthValue)
        ) {
          setMonthValue(monthOptions[0].value);
        }
      });
    }
  }, [customRepeat.show]);

  return (
    <Modal
      className="custom-repeat-modal"
      destroyOnClose
      getContainer={document.querySelector('.meeting-main') as HTMLElement}
      width={312}
      style={{ padding: 0 }}
      onOk={() => {
        const customOption = getCustomOption();
        unstable_batchedUpdates(() => {
          if (customOption) {
            setRepeat(customOption.value);
          }
          setCustomRepeat(prev => {
            const options = [customOption, { label: 'Custom...', value: 'custom' }].filter(Boolean);

            return {
              ...prev,
              show: false,
              options,
            };
          });
        });
      }}
      okText="Done"
      cancelText="Cancel"
      onCancel={() => {
        setCustomRepeat(prev => ({ ...prev, show: false }));
      }}
      open={customRepeat.show}
      title={<div style={{ fontWeight: 500 }}>Custom recurrence</div>}
    >
      <Flex align="center" gap={4} style={{ marginTop: 24 }}>
        <span
          style={{
            color: `var(--dsw-color-text-primary)`,
            fontSize: 14,
            marginRight: 5,
          }}
        >
          Repeat every
        </span>
        <InputNumber
          variant="outlined"
          style={{ width: 71, backgroundColor: 'transparent' }}
          min={1}
          max={99}
          value={repeatCount}
          onChange={v => v && setRepeatCount(v)}
          controls={false}
          precision={0}
        />
        <Select
          variant="outlined"
          style={{ width: 94 }}
          options={repeatTypeOptions}
          value={repeatType}
          onChange={setRepeatType}
        />
      </Flex>
      {repeatType === 'week' && (
        <>
          <div style={{ margin: '24px 0 16px' }}>Repeat on</div>
          <Flex align="center" gap={4}>
            {weekDays.map(day => (
              <div
                key={day}
                className={classNames('day-item', {
                  active: pickedWeekDays.includes(day),
                })}
                onClick={() => {
                  setPickedWeekDays(prev => {
                    let result;
                    if (prev.includes(day)) {
                      result = prev.filter(d => d !== day);
                      result.length === 0 && result.push(date.locale('en').format('ddd'));
                    } else {
                      result = [...prev, day];
                    }
                    return result;
                  });
                }}
              >
                {day.slice(0, 1)}
              </div>
            ))}
          </Flex>
        </>
      )}
      {repeatType === 'month' && (
        <Select
          labelRender={({ label }) => {
            if (label) {
              return label;
            }
            return ' ';
          }}
          value={monthValue}
          onChange={setMonthValue}
          options={monthOptions}
          variant="outlined"
          style={{
            width: '100%',
            marginTop: 24,
          }}
        />
      )}
    </Modal>
  );
};
