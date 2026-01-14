import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { AutoSizer, List } from 'react-virtualized';

import ListItem from './components/ListItem';
import { cid2uid, uid2cid } from '@/util';
import {
  currentScheduleDetailInfoAtom,
  dateAtom,
  myCalendarCheckedAtom,
  timeZoneAtom,
  userIdAtom,
} from '@/atoms';
import { useAtom, useAtomValue } from 'jotai';
import dayjs from 'dayjs';
import useFormatMeetingList from '@/hooks/useFormatMeetingList';
import { calendarQueryAtom } from '@/atoms/query';
import { useCreateSchedule } from '@/hooks/useCreateSchedule';
import { useGetEventColors } from '@/components/shared/ConfigProvider/useTheme';

const ListView = () => {
  const timeZone = useAtomValue(timeZoneAtom);
  const { createSchedule } = useCreateSchedule(timeZone);
  const [date, setDate] = useAtom(dateAtom);
  const { data: { events = [], myUsers = [] } = {} } = useAtomValue(calendarQueryAtom);
  const myCheckedAccounts = useAtomValue(myCalendarCheckedAtom);
  const myId = useAtomValue(userIdAtom);
  const myAccounts = myCheckedAccounts
    .sort((a, b) => (a === myId ? -1 : b === myId ? 1 : 0))
    .map(uid2cid);
  const { formatList } = useFormatMeetingList();
  const list = formatList(events, date.startOf('week'), myAccounts);
  const { currentEid, currentCid, currentFreeTimeId } = useAtomValue(currentScheduleDetailInfoAtom);
  const [curDay, setCurDay] = useState(null);
  const [scrollToIndex, setScrollToIndex] = useState<number>(-1);
  const lastRenderedRow = useRef(0);
  const listRef = useRef<any>(null);
  const { getEventColor } = useGetEventColors();
  const eventColors = useMemo(() => getEventColor(myUsers, true), [myUsers, getEventColor]);
  const onListRef = useCallback(d => {
    listRef.current = d;
  }, []);

  // TODO
  // const meetingStatusMap = {};

  const dateStr = date.format('YYYY-MM-DD');

  const dataKey = useMemo(
    () =>
      list
        .reduce((sum, item) => {
          if (item?.rowType === 'data') {
            sum.push(`${item.eid}_${item.start}`);
          }
          return sum;
        }, [])
        .join('-'),
    [list]
  );

  useEffect(() => {
    listRef.current?.recomputeRowHeights(0);
    const index = list.findIndex(item => item.rowType === 'title' && date.isSame(item.day, 'day'));
    setScrollToIndex(index);
  }, [dateStr, dataKey]);

  const setStickyTitleDay = ({ startIndex }: { startIndex: number }) => {
    const item = list[startIndex];
    lastRenderedRow.current = startIndex;
    setCurDay(item.curDay);
  };

  const doSchedule = (options: any) => {
    console.log('doSchedule', options);
    createSchedule('meeting', {
      start: options.start.unix(),
      freeTimeId: options.id,
    });
  };

  const renderRow = ({ index, style }: any) => {
    const item = list[index];

    // TODO getMeetingStatus
    // const isGoogleMeet = !item.channelName && item.googleMeetingLink;
    // const isOutlookMeet = !item.channelName && item.outlookMeetingLink;
    const meetingStatus = undefined;
    const isHighLight = item.id === currentFreeTimeId;
    const redpointColor = document.body.classList.contains('dark-theme')
      ? eventColors[cid2uid(item.cid)]?.bgColor
      : eventColors[cid2uid(item.cid)]?.color;

    return (
      <ListItem
        active={currentEid === item.eid && currentCid === item.cid}
        item={item}
        style={style}
        status={meetingStatus}
        key={`${item.id}_${item.cid}`}
        isHighLight={isHighLight}
        onCreateByFreeTime={doSchedule}
        redpointColor={redpointColor}
      />
    );
  };

  const getRowHeight = (index: number) => {
    const item = list[index];
    if (item.rowType === 'title') {
      return 57;
    }
    if (item.rowType === 'diff') {
      return item.isEnd ? 48 : 32;
    }
    return 80;
  };

  return (
    <>
      <div className="sticky-header is-sticky">
        <div className="today" onClick={() => setDate(dayjs())}>
          Today
        </div>
        <div className="date-str">{curDay}</div>
      </div>
      <AutoSizer>
        {({ height, width }: any) => (
          <List
            ref={onListRef}
            scrollToAlignment="start"
            width={width}
            height={height}
            rowHeight={({ index }) => getRowHeight(index)}
            rowCount={list.length}
            rowRenderer={renderRow}
            onRowsRendered={setStickyTitleDay}
            onScroll={() => {
              unstable_batchedUpdates(() => {
                if (scrollToIndex >= 0) {
                  setScrollToIndex(-1);
                }
              });
            }}
            scrollToIndex={scrollToIndex}
          />
        )}
      </AutoSizer>
    </>
  );
};

export default ListView;
