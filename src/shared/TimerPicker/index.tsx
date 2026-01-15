import { AutoComplete, AutoCompleteProps, Input } from 'antd';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import dayjs, { Dayjs } from 'dayjs';

import { IconChevronDown2 as ChevronDown } from '../IconsNew';
import { prefixCls } from '@/constants';

export type Props = Omit<AutoCompleteProps, 'onChange' | 'value'> & {
  value: Dayjs | null;
  onChange?: (v: Dayjs | null) => void;
  format?: string;
  minuteStep?: number;
  disableTime?: (day: Dayjs) => boolean;
  onNormalizeInput?: (str: string) => string;
  timeZone?: string;
};

const TimePicker = (props: Props) => {
  const {
    value,
    onChange,
    className,
    suffixIcon = <ChevronDown className={`${prefixCls}-timepicker-chevrondown`} />,
    minuteStep = 30,
    format = 'HH:mm',
    size = 'large',
    style = {},
    disableTime = () => false,
    onNormalizeInput,
    timeZone,
    ...rest
  } = props;

  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [innerTimerStr, setInnerTimerStr] = useState<string>();
  const ref = useRef<any>();

  useLayoutEffect(() => {
    const timeStrFromProp = value?.locale('en').format(format) || '';

    if (timeStrFromProp) {
      setInnerTimerStr(timeStrFromProp);
    }
  }, [value, format]);

  const intervalList = useMemo(() => {
    let time = 0;
    const res = [];
    while (time < 60) {
      res.push(time);
      time += minuteStep;
    }

    return res;
  }, [minuteStep]);

  useEffect(() => {
    // 这里针对打开dropdown的情况，如果自己输入了一个时间不在下拉选项里，则找到最近的选项滚动过去, 也太复杂了吧 😂
    if (open) {
      const { isValid, minute, hour } = validateTimeStr(innerTimerStr, format);

      if (isValid && !intervalList.includes(minute!)) {
        const index = options.findIndex((item: any) => {
          const v = dayjs(item.value, format, 'en');
          return v.get('hour') === hour;
        });

        if (index > -1) {
          ref.current?.scrollTo?.({ index });
        }
      }
    }
  }, [innerTimerStr, open, format, options, intervalList]);

  const ranges = useMemo(() => {
    const list = [];
    const now = timeZone ? dayjs().tz(timeZone) : dayjs();
    const startTime = now.startOf('day');
    const endTime = now.endOf('day');

    let currentTime = startTime;

    while (currentTime.isBefore(endTime)) {
      list.push(currentTime);
      currentTime = currentTime.add(minuteStep, 'minutes');
    }

    return list;
  }, [minuteStep, timeZone]);

  const calculateOptions = () => {
    const _options = ranges.reduce((sum, item) => {
      if (!disableTime(item)) {
        const value = item.locale('en').format(format);
        sum.push({ value, label: value, unix: item.unix() });
      }

      return sum;
    }, [] as any[]);

    setOptions(_options);
  };

  const _onNormalizeInput = (v: string) => {
    v = v.trim();
    if (options.map(item => item.value).includes(v)) {
      return v;
    }

    if (onNormalizeInput) {
      return onNormalizeInput(v);
    }

    return v;
  };

  const validateTimeStr = (
    timeStr = '',
    format = 'HH:mm',
    onNormalizeInput: Props['onNormalizeInput'] = v => v.trim()
  ) => {
    timeStr = onNormalizeInput(timeStr);

    const time = dayjs(timeStr, format, 'en');

    if (!time.isValid()) {
      return {
        isValid: false,
      };
    }

    return {
      isValid: true,
      hour: time.get('hours'),
      minute: time.get('minute'),
    };
  };

  const checkValid = () => {
    const { isValid, minute, hour } = validateTimeStr(innerTimerStr, format, _onNormalizeInput);
    // 非法输入，还原到 props里的 value
    const _value = value?.locale('en');
    if (!isValid) {
      setInnerTimerStr(_value?.format(format) || '');
    } else {
      const now = timeZone ? dayjs().tz(timeZone) : dayjs();
      const time = now.set('minute', minute!).set('hour', hour!);
      onChange?.(time);
    }
  };

  const onSelect = (val: string, option: any) => {
    const time = dayjs(option.unix * 1000);
    setOpen(false);
    setInnerTimerStr(val);
    ref.current.blur?.();
    onChange?.(time);
  };

  return (
    <AutoComplete
      ref={ref}
      className={classNames(`${prefixCls}-timepicker`, className)}
      open={open}
      options={options}
      value={innerTimerStr}
      onChange={val => setInnerTimerStr(val)}
      onSelect={onSelect}
      onFocus={() => {
        calculateOptions();
        setOpen(true);
      }}
      onKeyDown={e => {
        if (open && e.code?.toLowerCase() === 'enter') {
          ref.current.blur?.();
        }
      }}
      onBlur={() => {
        checkValid();
        setOpen(false);
      }}
      {...rest}
    >
      <Input
        style={style}
        size={size}
        suffix={suffixIcon}
        onClick={e => {
          e.stopPropagation();
          if (!open) {
            setOpen(true);
          }
        }}
      />
    </AutoComplete>
  );
};

export default TimePicker;
