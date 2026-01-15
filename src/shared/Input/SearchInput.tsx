import React, { forwardRef } from 'react';
import classnames from 'classnames';
import { Input as AntdInput } from 'antd';
import type { InputProps } from 'antd';
import { prefixCls } from '@/constants';
import ConfigProvider, { useGetColor } from '../ConfigProvider';
export type Props = {} & InputProps;

function SearchInput({ className, ...rest }: Props, ref: any) {
  const { getColor } = useGetColor();
  return (
    <ConfigProvider
      themeConfig={{
        components: {
          Input: {
            colorBgContainer: getColor('dswColorBackground2'),
            colorBorder: 'transparent',
            activeBorderColor: getColor('dswColorPrimary'),
            colorText: getColor('dswColorTextPrimary'),
            colorTextPlaceholder: getColor('dswColorTextThird'),
            colorIcon: getColor('dswColorTextThird'),
          },
        },
      }}
    >
      <AntdInput
        ref={ref}
        className={classnames(`${prefixCls}-searchinput`, className)}
        allowClear
        {...rest}
      />
    </ConfigProvider>
  );
}

export default forwardRef(SearchInput);
