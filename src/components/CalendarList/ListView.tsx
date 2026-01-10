import React, { useCallback, useEffect, useRef, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { AutoSizer, List } from 'react-virtualized';

import ListItem from './ListItem';
import useMeetingStatusCheck from './hooks/useMeetingStatusCheck';
import { useTimeZoneDayjs } from './hooks/useTimeZoneDayjs';
import { cid2uid, fixScrollToTimePosition } from '@/util';
import type { Dayjs } from 'dayjs';

const ListView = (props: {
  list: any[];
  setView: any;
  i18n: any;
  showDetail: any;
  currentEid: any;
  currentCid: string;
  currentFreeTimeId: any;
  doSchedule: any;
  meetings: any[];
  ourNumber: string;
  date: Dayjs;
  setDate: any;
  eventColors: Record<string, { bgColor: string; color: string }>;
}) => {
  const {
    i18n,
    list,
    setView,
    showDetail,
    currentEid,
    currentCid,
    currentFreeTimeId,
    doSchedule,
    meetings,
    ourNumber,
    date,
    setDate,
    eventColors,
  } = props;
  const { createTzDayjs } = useTimeZoneDayjs();
  const [curDay, setCurDay] = useState(null);
  const [scrollToIndex, setScrollToIndex] = useState<number>(-1);
  const lastRenderedRow = useRef(0);
  const listRef = useRef<any>(null);
  const onListRef = useCallback(d => {
    listRef.current = d;
  }, []);

  const { statusMap: meetingStatusMap } = useMeetingStatusCheck(
    list.filter(item => cid2uid(item.cid) === ourNumber),
    true, // 独立应用，总是激活状态
    meetings
  );

  const dateStr = date.format('YYYY-MM-DD');

  const dataKey = list
    .reduce((sum, item) => {
      if (item?.rowType === 'data') {
        sum.push(`${item.eid}_${item.start}`);
      }
      return sum;
    }, [])
    .join('-');

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

  const renderRow = ({ index, style }: any) => {
    const item = list[index];
    const isGoogleMeet = !item.channelName && item.googleMeetingLink;
    const isOutlookMeet = !item.channelName && item.outlookMeetingLink;
    const meetingStatus =
      cid2uid(item.cid) === ourNumber || isGoogleMeet || isOutlookMeet
        ? meetingStatusMap.get(item.eid)
        : undefined;
    const isHighLight = item.id === currentFreeTimeId;
    const redpointColor = document.body.classList.contains('dark-theme')
      ? eventColors[cid2uid(item.cid)]?.bgColor
      : eventColors[cid2uid(item.cid)]?.color;

    return (
      <ListItem
        active={currentEid === item.eid && currentCid === item.cid}
        onShowDetail={showDetail}
        item={item}
        i18n={i18n}
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
      if (item.isEnd) {
        return 48;
      }

      return 32;
    }

    return 80;
  };

  return (
    <>
      <div className="sticky-header is-sticky">
        <div className="today" onClick={() => setDate(createTzDayjs().startOf('day'))}>
          Today
        </div>
        <div className="date-str">{curDay}</div>
        {/* <div className="pre-next-btn-wrapper">
          <span
            onClick={scrollToPrevDay}
            className={position === 'top' ? 'disabled' : ''}
          >
            <ChevronRight
              style={{
                transform: 'rotate(180deg)',
                width: '20px',
                height: '20px',
              }}
            />
          </span>
          <span
            onClick={scrollToNextDay}
            className={position === 'bottom' ? 'disabled' : ''}
          >
            <ChevronRight
              style={{
                width: '20px',
                height: '20px',
              }}
            />
          </span>
        </div> */}
        <div className="btn-wrapper">
          <button type="button" key="list" className="rbc-active">
            List
          </button>
          <button
            type="button"
            key="week"
            onClick={() => {
              setView('week');
              setTimeout(() => {
                fixScrollToTimePosition();
              }, 50);
            }}
          >
            Week
          </button>
          <button type="button" key="day" onClick={() => setView('day')}>
            Day
          </button>
        </div>
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
            onScroll={
              (/*{ scrollHeight, scrollTop, clientHeight }*/) => {
                unstable_batchedUpdates(() => {
                  // const position =
                  //   scrollTop <= 0
                  //     ? 'top'
                  //     : scrollHeight <= scrollTop + clientHeight
                  //       ? 'bottom'
                  //       : 'middle';

                  // setPosition(position);
                  if (scrollToIndex >= 0) {
                    setScrollToIndex(-1);
                  }
                });
              }
            }
            scrollToIndex={scrollToIndex}
          />
        )}
      </AutoSizer>
    </>
  );
};

export default ListView;
