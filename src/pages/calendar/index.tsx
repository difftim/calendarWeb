import React, { useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { MyCalendar } from '@difftim/scheduler-component';
import classNames from 'classnames';

import {
  calendarVersionAtom,
  currentScheduleDetailInfoAtom,
  dateAtom,
  myCalendarCheckedAtom,
  otherCalendarCheckedAtom,
  timeZoneAtom,
} from '@/atoms';
import { cid2uid, cleanUserNameForDisplay, getOffset, getUtcOffset } from '@/util';
import { Avatar } from '@/components/shared/Avatar';
import { toastError } from '@/components/shared/Message';
import { useTimeZoneDayjs } from '@/hooks/useTimeZoneDayjs';
import { IconTablerSetting } from '@/components/shared/IconsNew';
import { calendarQueryAtom } from '@/atoms/query';
import { Spin } from 'antd';
import useFormatCalendarList from '@/components/CalendarList/hooks/useFormatCalendarList';
import { unstable_batchedUpdates } from 'react-dom';
import { uniqBy } from 'lodash';

export default function Calendar({ userId }: { userId: string }) {
  const [date, setDate] = useAtom(dateAtom);
  const [searchParams] = useSearchParams();
  const { createTzDayjs } = useTimeZoneDayjs();
  const navigate = useNavigate();
  const timeZone = useAtomValue(timeZoneAtom);
  const [myCheckedCalendar, setMyCheckedCalendar] = useAtom(myCalendarCheckedAtom);
  const [otherCheckedCalendar, setOtherCheckedCalendar] = useAtom(otherCalendarCheckedAtom);
  const [_, setCurrentDetailInfo] = useAtom(currentScheduleDetailInfoAtom);
  const setCalendarVersion = useSetAtom(calendarVersionAtom);
  const {
    data: { events, version = 0, myUsers = [], otherUsers = [] } = {},
    isFetching,
    isFetched,
  } = useAtomValue(calendarQueryAtom);
  const allCalendars = useMemo(
    () => uniqBy([...myUsers, ...otherUsers], 'cid'),
    [myUsers, otherUsers]
  );

  const allCheckedCalendar = useMemo(
    () => new Set([...myCheckedCalendar, ...otherCheckedCalendar]),
    [myCheckedCalendar, otherCheckedCalendar]
  );
  const scrollToTime = dayjs().startOf('day').add(9.5, 'hour').toDate();
  const { getEventsToRender } = useFormatCalendarList(allCalendars, allCheckedCalendar);
  const { list: eventsToRender, hasCrossDayEvent } = useMemo(
    () => getEventsToRender(events),
    [events, getEventsToRender]
  );

  useEffect(() => {
    if (isFetched) {
      unstable_batchedUpdates(() => {
        setCalendarVersion(version);
        setMyCheckedCalendar(prev =>
          prev.filter(id => myUsers.some(user => cid2uid(user.cid) === id))
        );
        setOtherCheckedCalendar(prev =>
          prev.filter(id => otherUsers.some(user => cid2uid(user.cid) === id))
        );
      });
    }
  }, [isFetched, version, myUsers, otherUsers]);

  // 直接从 URL 参数读取 view，默认为 'week'
  const view = useMemo(() => {
    const urlType = searchParams.get('type');
    return urlType === 'day' ? 'day' : 'week';
  }, [searchParams]);

  return (
    <>
      {isFetching ? (
        <div className="loading-indicator">
          <Spin />
        </div>
      ) : null}
      <MyCalendar
        className={classNames(`${view}-mode`, {
          allDay: hasCrossDayEvent,
          'no-allday': !hasCrossDayEvent,
        })}
        view={view}
        date={date.toDate()}
        isDisabled={() => false}
        onChange={d => {
          setDate(createTzDayjs(d));
        }}
        onViewChange={v => {
          const isDay = v === 'day';
          if (isDay) {
            navigate(`/calendar?type=day`);
          } else {
            navigate(`/calendar`);
          }
          setCurrentDetailInfo(v => ({
            ...v,
            selectItem: null,
          }));
        }}
        events={eventsToRender}
        members={[]}
        timeZone={timeZone}
        style={{ width: `calc(100vw - 300px)` }}
        eventColors={{}}
        scrollToTime={scrollToTime}
        onRenderHeader={item => {
          const timeZoneNum = getOffset(item);
          const utcOffset =
            item.id === userId
              ? getUtcOffset(timeZone)
              : `UTC${timeZoneNum >= 0 ? '+' : ''}${timeZoneNum}`;

          const totalChecked = myCheckedCalendar.length + otherCheckedCalendar.length;

          return (
            <div className="avatar-header">
              {totalChecked > 1 && (
                <Avatar
                  conversationType="direct"
                  size={36}
                  name={item.name}
                  id={item.id}
                  avatarPath={item.avatarPath}
                />
              )}
              <div className="name ellipsis-1">{item.cname || cleanUserNameForDisplay(item)}</div>
              <div className="utc">{utcOffset}</div>
            </div>
          );
        }}
        onSelectEvent={(e: any) => {
          console.log('event', e);
          // setOpenSetting(false);
          if (e.id !== userId && !e.isBossProxy) {
            toastError('You have no access to view details');

            return;
          }
          // TODO
          // showDetail(e);
        }}
        onSelectSlot={(slot: any) => {
          console.log('slot', slot);
          // 不能跟自己约会
          const slotInMyCalendar = myUsers.find(item => item.id === slot.resourceId);
          const isBossProxy = slotInMyCalendar?.role === 'proxy';

          if (slot?.resourceId && slotInMyCalendar && !isBossProxy && slot.resourceId !== userId) {
            toastError('You have no access to book.');
            return;
          }

          setCurrentDetailInfo(v => ({
            ...v,
            selectItem: {
              ...slot,
              isBossProxy,
            },
          }));
        }}
        onExtraHeaderRender={() => (
          <div className="setting-">
            <IconTablerSetting
              onClick={() => {
                // TODO
                // setOpenSetting(open => !open);
                setCurrentDetailInfo(v => ({
                  ...v,
                  selectItem: null,
                }));
              }}
            />
          </div>
        )}
        renderCustomViewGroup={() => <></>}
      />
    </>
  );
}
