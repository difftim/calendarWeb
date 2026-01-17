import React from 'react';
import { Flex } from 'antd';
import dayjs from 'dayjs';

import { IconTablerPlus } from '@/shared/IconsNew';

export const TimeGutterHeader = ({
  timeZone,
  handleAdd,
}: {
  timeZone: string;
  handleAdd: () => void;
}) => {
  const utcOffset = dayjs().tz(timeZone).utcOffset() / 60;
  const utcStr = utcOffset >= 0 ? `UTC+${utcOffset}` : `UTC-${Math.abs(Number(utcOffset))}`;

  return (
    <Flex
      vertical
      align="center"
      justify="flex-end"
      gap={24}
      className="view-schedule-gutter-header"
    >
      <Flex
        className="round"
        align="center"
        justify="center"
        onClick={e => {
          e.stopPropagation();
          handleAdd();
        }}
      >
        <IconTablerPlus width={24} height={24} />
      </Flex>
      <span>{utcStr}</span>
    </Flex>
  );
};
