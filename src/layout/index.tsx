import React from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { Calendar, ConfigProvider, Flex } from 'antd';
import { Outlet, useNavigate, useSearchParams, useLocation } from 'react-router-dom';

import { createInstantMeeting, createRoom, createWebCall } from '@/bridge';
import { useAntdLocale } from '@/components/CalendarList/hooks/useAntdLocale';
import { useSetDate } from '@/components/CalendarList/hooks/useSetDate';
import {
  IconCalendarEvent,
  IconChevronRight,
  IconFlashLineF,
  IconFluentLive24Filled,
  IconTablerLink,
  IconTablerUser,
  IconTablerVideo,
} from '@/components/shared/IconsNew';
import classNames from 'classnames';
import dayjs, { Dayjs } from 'dayjs';
import { useAtomValue, useSetAtom } from 'jotai';
import { currentScheduleDetailInfoAtom, timeZoneAtom } from '@/atoms';
import { fixScrollToTimePosition } from '@/util';
import { showPannelAtom } from '@/atoms/detail';
import { ScheduleMeetingDialog } from '@/pages/scheduler';
import { useSetDetailData } from '@/hooks/useDetailData';
import { useQueryDetail } from '@/hooks/useQueryDetail';

const ViewChangePanel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // 判断当前激活的视图
  const isListActive = location.pathname === '/list';
  const isDayActive = location.pathname === '/calendar' && searchParams.get('type') === 'day';
  const isWeekActive = location.pathname === '/calendar' && !searchParams.get('type');

  return (
    <div className="btn-wrapper">
      <button
        type="button"
        key="list"
        className={isListActive ? 'rbc-active' : ''}
        onClick={() => {
          if (isListActive) return;
          navigate('/list');
        }}
      >
        List
      </button>
      <button
        type="button"
        key="week"
        className={isWeekActive ? 'rbc-active' : ''}
        onClick={() => {
          if (isWeekActive) return;
          navigate('/calendar');
          setTimeout(() => {
            fixScrollToTimePosition();
          }, 200);
        }}
      >
        Week
      </button>
      <button
        type="button"
        key="day"
        className={isDayActive ? 'rbc-active' : ''}
        onClick={() => {
          if (isDayActive) return;
          navigate('/calendar?type=day');
        }}
      >
        Day
      </button>
    </div>
  );
};

/**
 * Layout 组件 - 保持布局不变，只切换内容区域
 * 使用 <Outlet /> 来渲染子路由的内容
 */
const Layout = () => {
  const antdLocale = useAntdLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const { date, setDate, showDate, setShowDate } = useSetDate();
  const timeZone = useAtomValue(timeZoneAtom);
  const setShowPannel = useSetAtom(showPannelAtom);
  const setDetailInfo = useSetAtom(currentScheduleDetailInfoAtom);
  const setDetailData = useSetDetailData();
  const { getDetailData } = useQueryDetail();

  const headerRender = ({ value /*onChange*/ }: any) => {
    return (
      <Flex className="calendar-header" align="center" justify="center" gap={8}>
        <span>
          <IconChevronRight
            width={20}
            height={20}
            onClick={() => {
              // if (isDisabled) {
              //   return;
              // }
              const previous = value.clone().add(-1, 'month');
              // 不同步
              setShowDate(previous);
            }}
            style={{ transform: 'rotate(180deg)' }}
          />
        </span>
        <div style={{ flexGrow: 1, textAlign: 'center' }}>
          {value.locale('en').format(`MMM YYYY`)}
        </div>
        <span>
          <IconChevronRight
            width={20}
            height={20}
            onClick={() => {
              const next = value.clone().add(1, 'month');
              // 不同步
              setShowDate(next);
            }}
          />
        </span>
      </Flex>
    );
  };

  const fullCellRender = (curDate: Dayjs, info: any) => {
    const now = dayjs();
    const d = curDate.tz(timeZone);
    return React.cloneElement(info.originNode, {
      ...info.originNode.props,
      className: classNames('custom-cell', {
        current: d.isSame(date, 'date'),
        today: d.isSame(now, 'date'),
      }),
      children: <div>{dayjs(d.format('YYYY-MM-DD')).get('date')}</div>,
    });
  };

  return (
    <div className="meeting-schedule-pane-wrapper">
      <div className="calendar-left-panel">
        <div className="title">
          <span
            onClick={() => {
              // setDetailData(getDetailData('123', 'default', 'difft'));
              const start = dayjs().unix();
              const end = start + 1800;
              setDetailData({
                mode: 'create',
                start,
                end,
                date: dayjs().tz(timeZone),
                time: dayjs().tz(timeZone),
                source: 'difft',
                calendarId: 'default',
              });
              setShowPannel(true);
            }}
          >
            Calendar
          </span>
        </div>
        <div className="main-block">
          <div
            onClick={() => {
              // createNativeMeeting();
            }}
            className="meeting-block book"
          >
            <IconTablerVideo />
            <div>Meeting</div>
          </div>
          <div
            className="meeting-block instant"
            onClick={() => {
              // createEvent();
            }}
          >
            <IconCalendarEvent />
            <div>Event</div>
          </div>
          <div onClick={createInstantMeeting} className="meeting-block instant">
            <IconFlashLineF />
            <div>Instant Meet</div>
          </div>
          <div onClick={() => {}} className="meeting-block instant">
            <IconFluentLive24Filled />
            <div>Live Stream</div>
          </div>
          <div onClick={() => createRoom()} className="meeting-block instant">
            <IconTablerUser />
            <div>My Room</div>
          </div>
          <div onClick={() => createWebCall()} className="meeting-block instant webCall">
            <IconTablerLink style={{ flexShrink: 0 }} />
            <div>New Web Call</div>
          </div>
        </div>
        <ConfigProvider locale={antdLocale}>
          <Calendar
            className="left-pane-calendar"
            value={showDate}
            onSelect={(curDate, { source }) => {
              if (source !== 'date') return;
              unstable_batchedUpdates(() => {
                setDate(curDate);
                setShowPannel(false);
                setDetailInfo({
                  selectItem: null,
                  currentFreeTimeId: '',
                  currentEid: '',
                  currentCid: 'default',
                  currentSource: '',
                });
                if (
                  location.pathname === '/list' &&
                  curDate.unix() < dayjs().startOf('day').unix()
                ) {
                  navigate('/calendar?type=day');
                }
              });
            }}
            fullscreen={false}
            headerRender={headerRender}
            fullCellRender={fullCellRender}
          />
        </ConfigProvider>

        <div className="select-list-wrapper">
          {/* <SelectList
            myId={props.ourNumber}
            listStyle={{ flexShrink: 0 }}
            list={myCalendar}
            bgColors={checkBoxBg.slice(0, myCalendar.length)}
            title="My Calendars"
            checked={myCalendarChecked}
            onChange={list => {
              localStorage.setItem('myChecked', JSON.stringify(list));
              setMyCalendarChecked(list);
            }}
          />
          {view !== 'list' ? (
            <SelectList
              style={{ marginTop: '24px' }}
              bgColors={checkBoxBg.slice(
                myCalendar.length,
                myCalendar.length + otherCalendar.length
              )}
              // height 0 makes height scroll
              list={otherCalendar}
              title="Other Calendars"
              checked={otherCalendarChecked}
              onChange={list => {
                localStorage.setItem('otherChecked', JSON.stringify(list));
                setOtherCalendarChecked(list);
              }}
            />
          ) : null} */}
        </div>
      </div>
      {/* 这里是主要内容区域，会根据路由切换 */}
      <div className="calendar-main-panel">
        <ViewChangePanel />
        <Outlet />
      </div>
      <ScheduleMeetingDialog />
    </div>
  );
};

export default Layout;
