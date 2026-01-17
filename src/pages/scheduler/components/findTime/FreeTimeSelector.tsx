import React from 'react';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { Flex } from 'antd';
import { createPortal } from 'react-dom';

import { getTimeFormatWithUtc } from '@/util';
import { calcIsOverlap, getUidTimezone } from './utils';

const FreeTimeSelector = ({ item, start, events, members, ourNumber, timeZone }: any) => {
  const end = start + 86400 - 1;

  if (!item || item.end <= start || item.start >= end) {
    return null;
  }

  const root = document.querySelector('.find-a-time-container');
  if (!root) {
    return null;
  }
  const container = root.querySelector('.rbc-time-content');
  const leftNode = root.querySelector('.rbc-time-gutter');
  const columns = root.querySelectorAll('.rbc-day-slot.rbc-time-column');

  if (!container || !columns.length) {
    return null;
  }

  let rbcInfo = { width: '0px', height: '0px' };

  if (leftNode) {
    const { width: w, height: h } = getComputedStyle(leftNode);
    rbcInfo = { width: w, height: h };
  }

  const isBusy = calcIsOverlap(events, item.start * 1000, item.end * 1000);
  const rbcSlotWidth = leftNode ? getComputedStyle(leftNode).width : 0;
  const columHeight = Number(rbcInfo.height.replace('px', ''));
  const oneDay = 24 * 3600;
  const calcStart = Math.max(start, item.start);
  const calcEnd = Math.min(end, item.end);
  const percent = (calcStart - start) / oneDay;
  const eventHeight = ((calcEnd - calcStart) / oneDay) * columHeight;

  const top = percent * columHeight;
  const width = `${columns[0].clientWidth * columns.length}px`;
  const height = Math.min(eventHeight, (1 - percent) * columHeight);

  const myOffset = dayjs().tz(timeZone).utcOffset() / 60;
  const showTime = item.end - item.start > 22 * 60;

  return createPortal(
    <Flex
      ref={d => {
        if (d && container) {
          container.scrollTo({
            top: top - container.clientHeight / 2,
            behavior: 'smooth',
          });
        }
      }}
      vertical
      gap={2}
      className={classNames('want-event', { isBusy })}
      style={{
        left: rbcSlotWidth,
        top,
        width,
        height,
      }}
    >
      <span className="title">{item.topic}</span>
      {showTime && (
        <Flex>
          {members.map((member: any) => {
            const memberTimeZone =
              member.id === ourNumber
                ? myOffset
                : getUidTimezone(member.id) || Number(member.timeZone) || myOffset;
            return (
              <div className="time" style={{ width: `${100 / members.length}%` }} key={member.id}>
                {getTimeFormatWithUtc(
                  dayjs(item.start * 1000),
                  dayjs(item.end * 1000),
                  memberTimeZone
                )}
              </div>
            );
          })}
        </Flex>
      )}
    </Flex>,
    container
  );
};

export default FreeTimeSelector;
