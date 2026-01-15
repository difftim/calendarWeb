import { AutoComplete, AutoCompleteProps, Input } from 'antd';
import React, { useLayoutEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { IconChevronDown2 as ChevronDown } from '@/shared/IconsNew';
import { prefixCls } from '@/constants';

export type Props = Omit<AutoCompleteProps, 'onChange' | 'options' | 'labelRender'> & {
  options: Array<{ value: any; label: string; desc?: string }>;
  onChange: (v: any) => void;
  onCheckValid?: (str: string) => {
    valid: boolean;
    value?: any;
    label?: string;
  };
  labelRender?: (v: any) => string;
  optionLabelProp?: string;
};

const InputSelect = (props: Props) => {
  const {
    value,
    className,
    suffixIcon = <ChevronDown className={`${prefixCls}-timepicker-chevrondown`} />,
    size = 'large',
    style = {},
    onChange,
    onCheckValid,
    labelRender,
    options,
    optionLabelProp,
    ...rest
  } = props;

  const lastValidValue = useRef('');
  const [open, setOpen] = useState(false);
  const [innerVaue, setInnerVaue] = useState<string>(() => {
    let res;
    const hint = options.find(item => item.value === value);
    if (hint) {
      if (optionLabelProp && hint.desc) {
        res = hint.desc;
      } else {
        res = hint.label;
      }
    } else {
      res = labelRender?.(value) || String(value);
    }

    lastValidValue.current = res;

    return res;
  });
  const ref = useRef<any>();
  const blurLock = useRef(false);

  const checkValid = () => {
    if (blurLock.current) {
      return;
    }
    if (onCheckValid) {
      const { valid, value: val, label } = onCheckValid(innerVaue);
      // 非法输入，还原到 props里的 value
      if (valid) {
        setInnerVaue(label!);
        onChange(val);
        lastValidValue.current = label!;
      } else {
        onChange(value);
        setInnerVaue(lastValidValue.current);
      }
    }
  };

  useLayoutEffect(() => {
    const hint = options.find(item => item.value === value);
    if (hint) {
      if (optionLabelProp && hint.desc) {
        setInnerVaue(hint.desc);
        lastValidValue.current = hint.desc;
      } else {
        setInnerVaue(hint.label);
        lastValidValue.current = hint.label;
      }
    }
  }, [value]);

  const onSelect = (val: any) => {
    // from onSelect always valid
    setOpen(false);
    blurLock.current = true;
    ref.current.blur?.();
    blurLock.current = false;
    if (val !== value) {
      onChange?.(val);
    }
  };

  return (
    <AutoComplete
      ref={ref}
      className={classNames(`${prefixCls}-timepicker`, className)}
      open={open}
      options={options}
      value={innerVaue}
      onChange={val => {
        const hint = options.find(item => item.value === val);
        if (optionLabelProp && hint?.desc) {
          setInnerVaue(hint?.desc || val);
        } else {
          setInnerVaue(hint?.label || val);
        }
        setInnerVaue(hint?.label || val);
      }}
      onSelect={onSelect}
      onFocus={() => {
        // calculateOptions();
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

export default InputSelect;
