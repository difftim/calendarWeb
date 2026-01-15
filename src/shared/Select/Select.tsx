import React from 'react';
import classnames from 'classnames';
import { Select as AntdSelect } from 'antd';
import { IconChevronDown2 as ChevronDown } from '@/shared/IconsNew';
import type { SelectProps } from 'antd';

export type Props = {} & SelectProps;

export default function Select({
  variant = 'borderless',
  suffixIcon = <ChevronDown style={{ color: 'var(--dsw-color-text-third)' }} />,
  value,
  onChange,
  options,
  popupClassName,
  className,
  ...rest
}: Props) {
  return (
    <AntdSelect
      className={classnames(`dsw-shared-select`, className)}
      variant={variant}
      suffixIcon={suffixIcon}
      value={value}
      onChange={onChange}
      options={options}
      virtual={false}
      popupClassName={classnames(`dsw-shared-select-popup`, popupClassName)}
      {...rest}
    />
  );
}
