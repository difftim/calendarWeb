import React, { useEffect, useMemo } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { Calendar, Dropdown, Flex } from 'antd';
import ConfigProvider, { useTheme } from '@/shared/ConfigProvider';
import { Outlet, useNavigate, useLocation, useSearchParams } from 'react-router-dom';

import { useAntdLocale } from '@/hooks/useAntdLocale';
import { useSetDate } from '@/hooks/useSetDate';
import {
  IconChevronDown,
  IconChevronRight,
  IconTablerPlus,
  IconTablerSetting,
} from '@/shared/IconsNew';
import classNames from 'classnames';
import dayjs, { Dayjs } from 'dayjs';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  calendarVersionAtom,
  currentScheduleDetailInfoAtom,
  myCalendarCheckedAtom,
  otherCalendarCheckedAtom,
  timeZoneAtom,
  userInfoAtom,
} from '@/atoms';
import { fixScrollToTimePosition, getUserBgColor } from '@/util';
import { showPannelAtom, showSettingAtom } from '@/atoms/detail';
import { ScheduleMeetingDialog } from '@/pages/scheduler';
import { SelectList } from '@/pages/calendar/components/SelectList';
import { calendarQueryAtom } from '@/atoms/query';
import { useCreateSchedule } from '@/hooks/useCreateSchedule';
import CalendarSettingDialog from '@/pages/calendarSetting';
import { useQueryClient } from '@tanstack/react-query';
import { initListener } from '@/init';
import { useGetAtom } from '@/hooks/useGetAtom';

const ViewChangePanel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const setShowSetting = useSetAtom(showSettingAtom);

  // 判断当前激活的视图
  const isListActive = location.pathname === '/list';
  const viewType = searchParams.get('view');
  const isDayActive = location.pathname === '/dashboard' && viewType === 'day';
  const isWeekActive = !isDayActive && !isListActive;

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
          navigate('/dashboard');
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
          navigate('/dashboard?view=day');
        }}
      >
        Day
      </button>
      <Flex className="setting-btn-wrapper" align="center" justify="center">
        <IconTablerSetting
          onClick={() => {
            setShowSetting(true);
          }}
        />
      </Flex>
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
  const [showPannel, setShowPannel] = useAtom(showPannelAtom);
  const [showSetting, setShowSetting] = useAtom(showSettingAtom);
  const setDetailInfo = useSetAtom(currentScheduleDetailInfoAtom);
  const myInfo = useAtomValue(userInfoAtom);
  const getCalendarVersion = useGetAtom(calendarVersionAtom);
  const mode = useTheme();
  const isListActive = location.pathname === '/list';
  const [myChecked, setMyChecked] = useAtom(myCalendarCheckedAtom);
  const [otherChecked, setOtherChecked] = useAtom(otherCalendarCheckedAtom);
  const { data: { myUsers = [], otherUsers = [] } = {} } = useAtomValue(calendarQueryAtom);
  const { createSchedule } = useCreateSchedule(timeZone);
  const queryClient = useQueryClient();
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
  const { checkBoxBg } = useMemo(() => getUserBgColor(mode), [mode]);

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

  useEffect(() => {
    if (!showPannel) {
      setDetailInfo({
        selectItem: null,
        currentFreeTimeId: '',
        currentEid: '',
        currentCid: 'default',
        currentSource: '',
      });
    }
  }, [showPannel]);

  useEffect(() => {
    initListener(async (appData: any) => {
      if (
        typeof appData.calendarVersion !== 'number' ||
        appData.calendarVersion <= getCalendarVersion()
      ) {
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['myEvents'] });
    });
  }, []);

  return (
    <div className="meeting-schedule-pane-wrapper">
      <div className="calendar-left-panel">
        <div className="title">
          <span>Calendar</span>
        </div>
        <div className="main-block">
          <Dropdown.Button
            className="create-meeting-dropdown"
            placement="bottomRight"
            menu={{
              items: [
                {
                  key: 'event',
                  label: 'Event',
                },
                {
                  key: 'livestream',
                  label: 'Live Stream',
                },
              ],
              onClick: ({ key }) => {
                createSchedule(key as 'event' | 'livestream');
              },
              className: 'create-meeting-dropdown-menu',
              style: { width: 180 },
            }}
            onClick={() => {
              createSchedule('meeting');
            }}
            trigger={['click']}
            icon={<IconChevronDown />}
          >
            <span className="create-meeting-btn-content">
              <IconTablerPlus width={16} height={16} />
              Meeting
            </span>
          </Dropdown.Button>
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
                  navigate('/dashboard?view=day');
                }
              });
            }}
            fullscreen={false}
            headerRender={headerRender}
            fullCellRender={fullCellRender}
          />
        </ConfigProvider>

        {myInfo.id && (
          <div className="select-list-wrapper">
            <SelectList
              listStyle={{ flexShrink: 0 }}
              list={myUsers}
              bgColors={checkBoxBg.slice(0, myUsers.length)}
              title="My Calendars"
              checked={myChecked}
              onChange={setMyChecked}
            />
            {!isListActive && (
              <SelectList
                bgColors={checkBoxBg.slice(myUsers.length, myUsers.length + otherUsers.length)}
                // height 0 makes height scroll
                list={otherUsers}
                title="Other Calendars"
                checked={otherChecked}
                onChange={setOtherChecked}
                style={{ marginTop: '24px' }}
              />
            )}
          </div>
        )}
      </div>
      {/* 这里是主要内容区域，会根据路由切换 */}
      <div className="calendar-main-panel">
        <Outlet />
        {/* for index and not drag */}
        <ViewChangePanel />
      </div>
      <ScheduleMeetingDialog />
      <CalendarSettingDialog
        open={showSetting}
        onClose={() => setShowSetting(false)}
        myList={myUsers}
        otherList={otherUsers}
        myId={myInfo.id}
      />
    </div>
  );
};

export default Layout;
