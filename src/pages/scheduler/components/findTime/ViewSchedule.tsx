import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Flex, Spin, Tooltip } from 'antd';
import { MyCalendar } from '@difftim/scheduler-component';
import dayjs from 'dayjs';
import { uniqBy } from 'lodash';

import {
  getOffset,
  getOffsetStringFromOffsetNumber,
  getUtcOffset,
  cleanUserNameForDisplay,
} from '@/util';
import { Avatar } from '@/shared/Avatar';
import { getUserBaseInfoSync } from '@/atoms/userInfo';
import { getMeetingViewScheduleList } from '@/api';
import FreeTimeSelector from './FreeTimeSelector';
import {
  clearUidTimezoneMap,
  formateResponse,
  noop,
  sortMembers,
  sortNewAddedMember,
} from './utils';
import { TimeGutterHeader } from './TimeGutterHeader';

interface Props {
  ourNumber: string;
  members: any[];
  timeZone: string;
  queryDate: string;
  wantDate: {
    start: number;
    end: number;
    topic: string;
  };
  onConfirm: (props: { newWantDate: { start: number; end: number }; newMembers?: any[] }) => void;
  onAddMember: () => Promise<any[]>;
}

const CustomEventWrapper = (props: any) => {
  const { event, style, children } = props;
  if (!event.mergedUserName) {
    return children;
  }

  let rbcEventStyle = children.props?.style;
  if (!rbcEventStyle) {
    rbcEventStyle = {
      ...style,
      top: `${Number.parseFloat(style.top)}%`,
      left: `${Number.parseFloat(style.left)}%`,
    };
  }

  return (
    <>
      <Tooltip
        overlayClassName="antd-tooltip-cover"
        trigger="hover"
        title={event.mergedUserName}
        align={{ offset: [0, 6] }}
      >
        <div
          className="rbc-hover-layer"
          style={{
            ...rbcEventStyle,
            position: 'absolute',
            height: '20px',
            zIndex: 1,
          }}
        />
      </Tooltip>

      <div
        style={{
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {children}
      </div>
    </>
  );
};

const ViewSchedule = ({
  members,
  ourNumber,
  timeZone,
  queryDate,
  wantDate: propWantDate,
  onConfirm,
  onAddMember,
}: Props) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [wantDate, setWantDate] = useState(() => propWantDate);
  const userCalendarsMap = useRef(new Map<string, string>());

  const normalizedMembers = useMemo(() => {
    return members
      .map(member => {
        const info = getUserBaseInfoSync(member.uid || member.id);
        return {
          ...member,
          id: member.uid || member.id,
          name: member.name || info.name || member.uid || member.id,
          cname: info.name,
          avatarPath: info.avatarPath,
          timeZone: info.timeZone,
        };
      })
      .filter(member => member.id);
  }, [members]);

  const [viewScheduleMembers, setViewScheduleMembers] = useState(() =>
    sortMembers(normalizedMembers, ourNumber)
  );
  const membersRef = useRef(viewScheduleMembers);
  // 记录待确认的新增成员，只有点击 Confirm 时才真正提交到父组件
  const pendingNewMembersRef = useRef<any[]>([]);

  useEffect(() => {
    setWantDate(propWantDate);
  }, [propWantDate]);

  useEffect(() => {
    const nextMembers = sortMembers(normalizedMembers, ourNumber);
    setViewScheduleMembers(nextMembers);
    membersRef.current = nextMembers;
  }, [normalizedMembers, ourNumber]);

  const currentUtcOffset = dayjs().tz(timeZone).utcOffset() / 60;
  const start = dayjs(
    `${queryDate} ${getOffsetStringFromOffsetNumber(currentUtcOffset)}`,
    'YYYY-MM-DD Z'
  )
    .tz(timeZone)
    .unix();

  const fetchData = useCallback(
    async (start: number, membersToAdd?: any[]) => {
      try {
        setLoading(true);
        const isAddMember = !!membersToAdd;
        const end = start + 86400 - 1;
        const users = (isAddMember ? membersToAdd : membersRef.current)
          .map(item => item.id)
          .filter(Boolean);
        if (!users.length) {
          return;
        }

        const getFreeBusyList = async ({ start, end, users }: any) => {
          const result = await Promise.allSettled(
            new Array(Math.ceil(users.length / 20)).fill('batch').map((_, index) => {
              const batchUsers = users.slice(index * 20, (index + 1) * 20);
              if (batchUsers.length > 0) {
                return getMeetingViewScheduleList({
                  start,
                  end,
                  users: batchUsers,
                });
              }
              return Promise.resolve(null);
            })
          );

          const userEventsBatch: any[] = [];
          for (const res of result) {
            if (res.status === 'fulfilled' && res.value) {
              const data = res.value as any;
              const userEvents = data?.userEvents || [];
              const userCalendars = data?.userCalendars || [];
              userEventsBatch.push(...userEvents);
              userCalendars.forEach((calendar: { cid: string; name?: string }) => {
                if (calendar.name) {
                  userCalendarsMap.current.set(calendar.cid, calendar.name);
                }
              });
            }
          }
          return uniqBy(userEventsBatch, 'uid');
        };

        const freeBusyList = await getFreeBusyList({
          start,
          end,
          users,
        });

        const userEvents = formateResponse(
          freeBusyList,
          timeZone,
          start,
          end,
          ourNumber,
          userCalendarsMap.current
        );
        setEvents(events =>
          uniqBy(
            isAddMember ? [...events, ...userEvents] : userEvents,
            item => `${item.eid}-${item.id}`
          )
        );
      } catch (error) {
        console.error('fetch data error', error);
      } finally {
        setLoading(false);
      }
    },
    [ourNumber, timeZone]
  );

  const handleAdd = useCallback(async () => {
    const membersToAdd = await onAddMember();
    if (!membersToAdd.length) {
      return;
    }

    // 使用 getUserBaseInfoSync 获取用户信息，保持与 normalizedMembers 一致的处理方式
    const showMembers = membersToAdd
      .map((member: any) => {
        const id = member.id || member.uid;
        const info = getUserBaseInfoSync(id);
        return {
          ...member,
          id,
          name: member.name || info.name || id,
          cname: info.name,
          avatarPath: info.avatarPath,
          timeZone: info.timeZone,
        };
      })
      .filter(member => member.id);

    if (showMembers.length) {
      // 记录待确认的新增成员，不立即调用 onConfirmAddMember
      pendingNewMembersRef.current = uniqBy(
        [...pendingNewMembersRef.current, ...membersToAdd],
        (item: any) => item.id || item.uid
      );

      setViewScheduleMembers(members => {
        const newAddIdMap = showMembers.reduce((sum: Record<string, number>, item: any) => {
          if (item.id) {
            sum[item.id] = 1;
          }
          return sum;
        }, {});
        return sortNewAddedMember(
          uniqBy([...members, ...showMembers], 'id'),
          ourNumber,
          newAddIdMap
        );
      });
      fetchData(start, showMembers);
    }
  }, [fetchData, onAddMember, ourNumber, start]);

  useEffect(() => {
    fetchData(start);
  }, [fetchData, start]);

  useEffect(() => {
    let headerElement: Element | null | undefined;
    let onScroll: ((...args: any) => void) | null = null;

    setTimeout(() => {
      const container = document.querySelector('.find-a-time-container');
      headerElement = container?.querySelector('.rbc-overflowing');
      if (headerElement) {
        onScroll = (e: any) => {
          const contentElement = container?.querySelector('.rbc-time-content');
          if (contentElement && e.target) {
            contentElement.scrollLeft = e.target.scrollLeft;
          }
        };

        headerElement?.addEventListener('scroll', onScroll);
      }
    }, 500);

    return () => {
      clearUidTimezoneMap();
      onScroll && headerElement?.removeEventListener('scroll', onScroll);
      headerElement = null;
      onScroll = null;
    };
  }, []);

  return (
    <Flex vertical className="view-schedule-wrapper">
      <Spin spinning={loading} className="view-schedule-loading" />
      <MyCalendar
        style={{ height: '100%' }}
        showHeader={false}
        components={{
          timeGutterHeader: () => <TimeGutterHeader timeZone={timeZone} handleAdd={handleAdd} />,
          eventWrapper: CustomEventWrapper,
        }}
        className="view-schedule"
        date={new Date(start * 1000)}
        view="day"
        onViewChange={noop}
        onChange={noop}
        members={viewScheduleMembers}
        events={events}
        onSelectSlot={(info: any) => {
          setWantDate(want => ({
            ...want,
            start: info.start,
            end: info.start + (want.end - want.start),
          }));
        }}
        onRenderHeader={item => {
          const timeZoneNum = getOffset(item);
          const utcOffset =
            item.id === ourNumber
              ? getUtcOffset(timeZone)
              : `UTC${timeZoneNum >= 0 ? '+' : ''}${timeZoneNum}`;

          return (
            <div className="avatar-header avatar-header-1">
              <Avatar
                conversationType="direct"
                size={36}
                name={item.name}
                id={item.id}
                avatarPath={item.avatarPath}
                noClickEvent
              />
              <div className="name ellipsis-1">{item.cname || cleanUserNameForDisplay(item)}</div>
              <div className="utc">{utcOffset}</div>
            </div>
          );
        }}
        timeZone={timeZone}
      />
      <FreeTimeSelector
        item={wantDate}
        start={start}
        events={events}
        members={viewScheduleMembers}
        ourNumber={ourNumber}
        timeZone={timeZone}
      />
      <Flex className="bottom-btn" align="center" justify="center">
        <Button
          type="primary"
          onClick={e => {
            e.stopPropagation();
            // 点击 Confirm 时把待确认的新增成员一起传递给父组件，确保状态更新原子性
            const newMembers = pendingNewMembersRef.current.length
              ? pendingNewMembersRef.current
              : undefined;
            pendingNewMembersRef.current = [];
            onConfirm({
              newWantDate: wantDate,
              newMembers,
            });
          }}
        >
          Confirm
        </Button>
      </Flex>
    </Flex>
  );
};

export default ViewSchedule;
