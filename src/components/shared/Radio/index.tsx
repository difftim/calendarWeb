import React from 'react';
import classnames from 'classnames';
import { Radio as AntdRadio } from 'antd';
import { prefixCls } from '@/constants';

import type { RadioProps } from 'antd';

export type Props = {} & RadioProps;

export default function Radio({ className, ...rest }: Props) {
  return <AntdRadio className={classnames(`${prefixCls}-radio`, className)} {...rest} />;
}

export const RadioGroup = AntdRadio.Group;
