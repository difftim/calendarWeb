import React, { forwardRef } from 'react';
import classnames from 'classnames';
import { Input as AntdInput } from 'antd';
import type { InputProps } from 'antd';

export type Props = {} & InputProps;

function Input({ className, ...rest }: Props, ref: any) {
  return <AntdInput ref={ref} className={classnames(`dsw-shared-input`, className)} {...rest} />;
}

export default forwardRef(Input);
