import React, { ReactNode } from 'react';
import dayjs from 'dayjs';
import { Flex } from 'antd';

import { cid2uid, getTimeFormatWithUtc, uid2cid } from '@/util';
import { getUserBaseInfoSync } from '@/atoms/userInfo';

export const calcIsOverlap = (events: any[], start: number, end: number) => {
  for (const event of events) {
    const eventStart = (event.start as Date).getTime();
    const eventEnd = (event.end as Date).getTime();
    const isOverlap = !(eventStart >= end || eventEnd <= start);
    if (isOverlap) {
      return true;
    }
  }
  return false;
};

const uidTimezoneMap = new Map<string, number>();

export const setUidTimezoneMap = (uid: string, timeZone: number) => {
  uidTimezoneMap.set(uid, timeZone);
};

export const getUidTimezone = (uid: string) => {
  return uidTimezoneMap.get(uid);
};

export const clearUidTimezoneMap = () => {
  uidTimezoneMap.clear();
};

export const formateResponse = (
  userEvents: any,
  tz: string,
  startUnix: number,
  endUnix: number,
  ourNumber: string,
  userCalendarsMap: Map<string, string>
) => {
  if (!userEvents) {
    return [];
  }

  const myOffset = dayjs().tz(tz).utcOffset() / 60;

  const result: Array<{
    eid: string;
    start: Date;
    end: Date;
    topic: string;
    id: string;
    timeZone: number;
    title: ReactNode;
  }> = [];

  userEvents.forEach(
    (userEvent: {
      events: Array<{
        eid: string;
        start: number;
        end: number;
        topic: string;
        cid: string;
      }>;
      timeZone: string;
      uid: string;
    }) => {
      const { events, uid, timeZone } = userEvent;
      const parsedTimeZone = Number(timeZone);
      const _timeZone = uid === ourNumber ? myOffset : parsedTimeZone;
      setUidTimezoneMap(uid, parsedTimeZone);

      result.push(
        ...events.map(event => {
          const start = dayjs(Math.max(event.start, startUnix) * 1000);
          const end = dayjs(Math.min(event.end, endUnix) * 1000);
          const timeStr = getTimeFormatWithUtc(
            dayjs(event.start * 1000),
            dayjs(event.end * 1000),
            _timeZone
          );

          const isMergeEvent = uid === ourNumber && event.cid !== uid2cid(uid);
          let userName = null;

          if (isMergeEvent) {
            const mergedUser = getUserBaseInfoSync(cid2uid(event.cid));
            userName = userCalendarsMap.get(event.cid) || mergedUser.name || mergedUser.id;
          }

          return {
            ...event,
            mergedUserName: userName,
            start: start.toDate(),
            end: end.toDate(),
            id: uid,
            timeZone: _timeZone,
            title: (
              <div className="event-inner">
                <Flex className="title-node" vertical gap={2}>
                  <div className="topic">{event.topic}</div>
                  <div className="time" style={{ overflow: 'hidden' }}>
                    {timeStr}
                  </div>
                </Flex>
              </div>
            ),
          };
        })
      );
    }
  );

  return result;
};

export const sortMembers = (members: any[], ourNumber: string) => {
  const showMembers =
    (members || []).filter(m => m.isGroupUser).length > 20
      ? members.filter(item => item.id === ourNumber)
      : members;

  return showMembers.sort((a, b) => {
    if (a.id === ourNumber && b.id !== ourNumber) {
      return -1;
    }
    if (a.id !== ourNumber && b.id === ourNumber) {
      return 1;
    }
    return 0;
  });
};

export const sortNewAddedMember = (
  members: any[],
  ourNumber: string,
  newAddedMap: Record<string, any> = {}
) => {
  return members.sort((a, b) => {
    if (a.id === ourNumber && b.id !== ourNumber) {
      return -1;
    }
    if (a.id !== ourNumber && b.id === ourNumber) {
      return 1;
    }

    if (newAddedMap[a.id] && !newAddedMap[b.id]) {
      return -1;
    }

    if (newAddedMap[b.id] && !newAddedMap[a.id]) {
      return 1;
    }

    return 0;
  });
};

export const noop = () => {};
