import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { MyCalendar } from '@difftim/scheduler-component';
import classNames from 'classnames';

import {
  currentScheduleDetailInfoAtom,
  dateAtom,
  myCalendarCheckedAtom,
  otherCalendarCheckedAtom,
  timeZoneAtom,
  userIdAtom,
} from '@/atoms';
import { toastError } from '@/shared/Message';
import { useTimeZoneDayjs } from '@/hooks/useTimeZoneDayjs';
import { calendarQueryAtom } from '@/atoms/query';
import { Spin } from 'antd';
import useFormatCalendarList from '@/hooks/useFormatCalendarList';
import { uniqBy } from 'lodash';
import HeaderAvatar from './components/HeaderAvatar';
import { useSetDetailData } from '@/hooks/useDetailData';
import { useQueryDetail } from '@/hooks/useQueryDetail';
import { showPannelAtom } from '@/atoms/detail';
import { useGetEventColors } from '@/shared/ConfigProvider/useTheme';

export default function Calendar() {
  const [date, setDate] = useAtom(dateAtom);
  const userId = useAtomValue(userIdAtom);
  const { createTzDayjs } = useTimeZoneDayjs();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const timeZone = useAtomValue(timeZoneAtom);
  const { getEventColor } = useGetEventColors();
  const myCheckedCalendar = useAtomValue(myCalendarCheckedAtom);
  const otherCheckedCalendar = useAtomValue(otherCalendarCheckedAtom);
  const [_, setCurrentDetailInfo] = useAtom(currentScheduleDetailInfoAtom);
  const { data: { events = [], myUsers = [], otherUsers = [] } = {}, isFetching } =
    useAtomValue(calendarQueryAtom);
  const allCalendars = useMemo(
    () => uniqBy([...myUsers, ...otherUsers], 'cid'),
    [myUsers, otherUsers]
  );
  const eventColors = useMemo(() => getEventColor(allCalendars), [allCalendars, getEventColor]);

  const allCheckedCalendar = useMemo(
    () => new Set([...myCheckedCalendar, ...otherCheckedCalendar]),
    [myCheckedCalendar, otherCheckedCalendar]
  );
  const scrollToTime = dayjs().startOf('day').add(9.5, 'hour').toDate();
  const { getEventsToRender, members } = useFormatCalendarList(allCalendars, allCheckedCalendar);
  const { list: eventsToRender, hasCrossDayEvent } = useMemo(
    () => getEventsToRender(events),
    [events, getEventsToRender]
  );
  const { getDetailData } = useQueryDetail();

  const setShowPannel = useSetAtom(showPannelAtom);
  const setDetailData = useSetDetailData();

  // 从 URL query 参数读取 view，默认为 'week'
  const view = useMemo(() => {
    return searchParams.get('view') === 'day' ? 'day' : 'week';
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
            navigate('/dashboard?view=day');
          } else {
            navigate('/dashboard');
          }
          setCurrentDetailInfo(prev => ({
            ...prev,
            selectItem: null,
          }));
        }}
        events={eventsToRender}
        members={members}
        timeZone={timeZone}
        style={{ width: `calc(100vw - 300px)` }}
        eventColors={eventColors}
        scrollToTime={scrollToTime}
        onRenderHeader={item => {
          return (
            <HeaderAvatar timeZone={timeZone} item={item} totalChecked={allCheckedCalendar.size} />
          );
        }}
        onSelectEvent={(e: any) => {
          console.log('event', e);
          // setOpenSetting(false);
          if (e.id !== userId && !e.isBossProxy) {
            toastError('You have no access to view details');
            return;
          }
          setShowPannel(true);
          setDetailData(getDetailData(e.eid, e.cid, e.source ?? 'difft'));
        }}
        onSelectSlot={(slot: any) => {
          console.log('slot', slot);
          // 不能跟自己约会
          const slotInMyCalendar = myUsers.find((item: any) => item.id === slot.resourceId);
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
        onExtraHeaderRender={() => <></>}
        renderCustomViewGroup={() => <></>}
      />
    </>
  );
}
