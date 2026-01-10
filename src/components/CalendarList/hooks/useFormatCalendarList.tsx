import React, { useCallback } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { useAtomValue } from 'jotai';
import { uniqBy } from 'lodash';

import { cid2uid, getOffset, getTimeFormatWithUtc, isOverlap } from '@/util';
import { IconLiveStream, IconTablerPlus } from '@shared/IconsNew';
import { useTimeZoneDayjs } from './useTimeZoneDayjs';
import { currentScheduleDetailInfoAtom, userIdAtom } from '@/atoms';
import classNames from 'classnames';

type Item = {
  channelName: string;
  cid: string;
  eid: string;
  host: string;
  start: number;
  end: number;
  topic: string;
  source:
    | 'google'
    | 'difft'
    | 'transfer'
    | 'secureMail'
    | 'secureMail-google'
    | 'secureMail-outlook';
  isBusy: boolean;
  timeZone?: any;
  isLiveStream?: boolean;
  isAllDay?: boolean;
  allDayStart?: string;
  allDayEnd?: string;
};

const useFormatCalendarList = (allCalendars: any[], userCheckedSet: Set<string>) => {
  const { utcOffset, createTzDayjs, timeZone } = useTimeZoneDayjs();
  const myId = useAtomValue(userIdAtom);
  const { selectItem } = useAtomValue(currentScheduleDetailInfoAtom);

  const isSameDay = (start: Dayjs, end: Dayjs) =>
    start.startOf('day').unix() === end.startOf('day').unix();

  const filterEvents = useCallback(
    (list?: Item[]) => {
      if (!list) {
        return {
          list: [],
          hasCrossDayEvent: false,
        };
      }

      let hasCrossDayEvent = false;
      list = uniqBy(list, v => `${v.cid}_${v.eid}`);

      const showList = list.reduce((s, item) => {
        const curUid = cid2uid(item.cid);
        if (userCheckedSet.has(curUid)) {
          const offset = curUid === myId ? utcOffset : getOffset(item);
          // 这里通过 utcOffset 去设置，无需使用类型的 CreateTzDayjs
          const start = dayjs(item.start * 1000);
          const end = dayjs(item.end * 1000);
          if (item.isAllDay) {
            hasCrossDayEvent = true;
          }

          if (!hasCrossDayEvent && !isSameDay(start, end)) {
            hasCrossDayEvent = true;
          }

          const timeStr = getTimeFormatWithUtc(start, end, offset);
          const isShortMeeting = end.unix() - start.unix() <= 25 * 60;
          const createTitleNode = () => {
            if (item.isBusy) {
              return <div className="ellipsis-1">{item.topic}</div>;
            }

            const iconNode = item.isLiveStream ? (
              <IconLiveStream style={{ width: '24px', height: '12px', marginRight: '4px' }} />
            ) : item.source === 'google' || item.source === 'secureMail-google' ? (
              <div className="google-icon" />
            ) : item.source === 'secureMail-outlook' ? (
              <div className="outlook-icon" />
            ) : null;

            if (item.isAllDay) {
              return (
                <>
                  <div className="title-wrapper">
                    {iconNode}
                    <div className="ellipsis-1">{item.topic}</div>
                  </div>
                  <div className="ellipsis-1">All Day</div>
                </>
              );
            }

            if (isShortMeeting) {
              return (
                <div className="title-wrapper">
                  {iconNode}
                  <div className="ellipsis-1">
                    {item.topic},{timeStr}
                  </div>
                </div>
              );
            }

            return (
              <>
                <div className="title-wrapper">
                  {iconNode}
                  <div className="ellipsis-1">{item.topic}</div>
                </div>
                <div className="ellipsis-1">{timeStr}</div>
              </>
            );
          };

          const title = <div className="event-inner">{createTitleNode()}</div>;

          let showStart = start.toDate();
          let showEnd = end.toDate();

          if (item.isAllDay && item.allDayStart && item.allDayEnd) {
            showStart = dayjs(item.allDayStart, 'YYYYMMDD').tz(timeZone, true).toDate();
            showEnd = dayjs(item.allDayEnd, 'YYYYMMDD').tz(timeZone, true).toDate();
          }

          const res = {
            ...item,
            id: item.cid.replace('user_', '+'),
            start: showStart,
            end: showEnd,
            title,
            allDay: item.isAllDay,
          };
          s.push(res);
        }
        return s;
      }, [] as any);

      return {
        list: showList,
        hasCrossDayEvent,
      };
    },
    [userCheckedSet, myId, createTzDayjs, utcOffset, timeZone]
  );

  const filterCheckedUser = useCallback(
    (users: any[]) => users.filter(u => userCheckedSet.has(u.id)),
    [userCheckedSet]
  );

  const getTempEventInfo = useCallback(
    (list: any[], item: any, defaultUtc: string | number) => {
      const resourceId = item.resourceId || myId;
      const curUserEvents = list.filter(u => cid2uid(u.cid) === resourceId);
      const timeZone =
        resourceId === myId
          ? defaultUtc
          : (allCalendars.find(item => item.id === resourceId)?.timeZone ?? defaultUtc);
      const isBusy = curUserEvents.some(u => isOverlap(item.start, item.end, u.start, u.end));

      return {
        timeZone: Number(timeZone),
        isBusy,
      };
    },
    [utcOffset, timeZone, myId, allCalendars]
  );

  const createTemperateOperateEvent = useCallback(
    (item: any, timeZone: number, isBusy: boolean) => {
      const renderTitleTempEventComponent = () => {
        const start = dayjs(item.start * 1000);
        const end = dayjs(item.end * 1000);
        // 这里通过 utcOffset 去设置，无需使用类型的 CreateTzDayjs
        const timeStr = getTimeFormatWithUtc(start, end, timeZone);
        // const meetingName = getMeetingName(item);
        const meetingName = `primo's Meeting`;

        return (
          <div
            onClick={e => {
              e.stopPropagation();
              // TODO
              // createNativeMeeting(item);
            }}
            className={classNames('temp-event', { busy: isBusy })}
          >
            <div className="text-area">
              <div className="ellipsis-1">{meetingName}</div>
              <div className="ellipsis-1">{timeStr}</div>
            </div>
            <div className={classNames('schedule-icon', { busy: isBusy })}>
              <IconTablerPlus />
            </div>
          </div>
        );
      };

      const tempEventNode = {
        start: new Date(item.start * 1000),
        end: new Date(item.end * 1000),
        timeZone,
        isTempEvent: true,
        id: item.resourceId,
        title: renderTitleTempEventComponent(),
      };

      return tempEventNode;
    },
    [timeZone]
  );

  const getEventsToRender = useCallback(
    data => {
      const { list, hasCrossDayEvent } = filterEvents(data);
      if (selectItem) {
        const { timeZone, isBusy } = getTempEventInfo(list, selectItem, utcOffset);
        const selectedEvent = createTemperateOperateEvent(selectItem, timeZone, isBusy);
        list.unshift(selectedEvent);
      }
      return {
        list,
        hasCrossDayEvent,
      };
    },
    [selectItem, utcOffset, filterEvents, getTempEventInfo, createTemperateOperateEvent]
  );

  return { getEventsToRender, filterCheckedUser };
};

export default useFormatCalendarList;
