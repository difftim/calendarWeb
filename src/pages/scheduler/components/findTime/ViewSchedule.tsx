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
import { useAtomValue } from 'jotai';
import { Avatar } from '@/shared/Avatar';
import { getUserBaseInfoSync } from '@/atoms/userInfo';
import { userCacheAtom } from '@/atoms';
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
  onConfirmAddMember: (props: { newMembers: any[] }) => void;
  onConfirm: (props: { newWantDate: { start: number; end: number } }) => void;
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
  onConfirmAddMember,
  onConfirm,
  onAddMember,
}: Props) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [wantDate, setWantDate] = useState(() => propWantDate);
  const userCalendarsMap = useRef(new Map<string, string>());
  // 订阅用户缓存，当缓存更新时触发重新渲染
  const userCache = useAtomValue(userCacheAtom);

  // 用于获取成员的用户信息（优先从缓存读取）
  const getMemberInfo = useCallback(
    (member: any) => {
      const id = member.uid || member.id;
      const cached = userCache.get(id);
      const info = cached || getUserBaseInfoSync(id);
      return {
        ...member,
        id,
        name: member.name || info.name || id,
        cname: info.name,
        avatarPath: info.avatarPath,
        timeZone: info.timeZone,
      };
    },
    [userCache]
  );

  const normalizedMembers = useMemo(() => {
    return members.map(getMemberInfo).filter(member => member.id);
  }, [members, getMemberInfo]);

  const [viewScheduleMembers, setViewScheduleMembers] = useState(() =>
    sortMembers(normalizedMembers, ourNumber)
  );
  const membersRef = useRef(viewScheduleMembers);
  // 记录新增成员的 ID，用于持久化排序（即使 members prop 更新后仍能记住哪些是新增的）
  const newAddedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setWantDate(propWantDate);
  }, [propWantDate]);

  // 当 members prop 或 userCache 变化时，更新 viewScheduleMembers
  // 使用 newAddedIdsRef 让新增成员排在前面
  useEffect(() => {
    // 构建新增成员的 id map，用于排序
    const newAddIdMap: Record<string, number> = {};
    newAddedIdsRef.current.forEach(id => {
      newAddIdMap[id] = 1;
    });
    // 排序：当前用户 > 新增成员 > 其他成员
    membersRef.current = sortNewAddedMember([...normalizedMembers], ourNumber, newAddIdMap);
    setViewScheduleMembers(membersRef.current);
  }, [normalizedMembers, ourNumber, userCache]);

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

  const handleAdd = async () => {
    const membersToAdd = await onAddMember();
    if (!membersToAdd.length) {
      return;
    }

    // 直接把新成员添加到父组件的 members 列表
    onConfirmAddMember({ newMembers: membersToAdd });

    // 使用 getMemberInfo 获取用户信息，保持与 normalizedMembers 一致的处理方式
    const showMembers = membersToAdd.map(getMemberInfo).filter(member => member.id);

    if (showMembers.length) {
      // 记录新增成员的 ID，用于持久化排序
      showMembers.forEach(m => {
        if (m.id) {
          newAddedIdsRef.current.add(m.id);
        }
      });

      setViewScheduleMembers(members => {
        const newAddIdMap: Record<string, number> = {};
        newAddedIdsRef.current.forEach(id => {
          newAddIdMap[id] = 1;
        });
        return sortNewAddedMember(
          uniqBy([...members, ...showMembers], 'id'),
          ourNumber,
          newAddIdMap
        );
      });
      fetchData(start, showMembers);
    }
  };

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
            onConfirm({
              newWantDate: wantDate,
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
