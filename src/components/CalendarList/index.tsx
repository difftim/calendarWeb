// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Calendar, Flex, Spin } from 'antd';
import classNames from 'classnames';
import dayjs, { Dayjs } from 'dayjs';
import { uniq, pick, uniqBy } from 'lodash';

// import { ScheduleMeetingDialog } from '../ScheduleMeetingDialog';
import { SelectList } from './SelectList';
import { Avatar } from '@shared/SimpleComponent';
import ListView from './ListView';
import ConfigProvider, { useTheme } from '@shared/ConfigProvider';
// import { CalendarSettingDialog } from './CalendarSettingDialog';
import {
  IconChevronRight1 as IconChevronRight,
  IconTablerPlus,
  IconFlashLineF,
  IconFluentLive24Filled,
  IconTablerVideo,
  IconTablerLink,
  IconTablerSetting,
  IconCalendarEvent,
  IconTablerUser,
} from '@shared/IconsNew';

import useFormatCalendarList from './hooks/useFormatCalendarList';
import { useQueryMyEvents } from './hooks/useQueryEvents';
import { useAntdLocale } from './hooks/useAntdLocale';
import { useStateWithRef } from './hooks/useStateWithRef';
import useFormatMeetingList from './hooks/useFormatMeetingList';
import {
  estimateTime,
  cid2uid,
  getOffset,
  getQueryKey,
  getTimeFormatWithUtc,
  getUserBgColor,
  isOverlap,
  isPassedWeek,
  uid2cid,
  getTodayListCount,
  fixScrollToTimePosition,
} from '@/util';
import { useShowInstantMeetingModal } from '@/bussiness/InstantMeetingModal';
import { toast, toastError } from '@shared/Message';
import { useTimeZoneDayjs } from '@/hooks/useTimeZoneDayjs';
import {
  isCurrentWindowIndependent,
  getWebApi,
  instantMeeting,
  registerReadScheduleNotifyCallback,
  registerIPCScheduleWithSomeone,
  getUserBaseInfo,
  getConversations,
  updateTodayUnreadSchedule,
} from '@/shims/globalAdapter';
import { EditAttendeeItem, useShowEditAttendeeDialog } from '@/bussiness/EditScheduleMemberModal';
import { joinMeeting } from './JoinMeeting';
import { cleanUserNameForDisplay, getUtcOffset, isBotId, isMatchUserId } from '@/util';

import type { CalendarComponent } from '@difftim/scheduler-component';

export type Events = {
  cid: string;
  eid: string;
  topic: string;
  channelName: string;
  host: string;
  start: number;
  end: number;
  source: 'difft' | 'google' | 'transfer' | 'secureMail';
};

const CalendarList = (props: any) => {
  const { i18n, ourNumber, meetings } = props;
  const timeInfo = useRef<any>({
    date: null,
    timeZone: undefined,
  });
  const isForceRefreshLock = useRef(false);
  const { showInstantMeetingModal } = useShowInstantMeetingModal();
  const { showEditAttendeeDialog } = useShowEditAttendeeDialog();
  const [timeStamp, setTimeStamp] = useState(0);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentEid, setCurrentEid] = useState('');
  const [currentSource, setCurrentSource] = useState('');
  const [currentCid, setCurrentCid] = useState('default');
  const [currentFreeTimeId, setCurrentFreeTimeId] = useState('');
  const [openSetting, setOpenSetting] = useState(false);
  const { createTzDayjs, timeZone } = useTimeZoneDayjs();
  const now = createTzDayjs();
  const [_date, setRealDate, getDate] = useStateWithRef(now);
  const curTimeZone = timeZone || dayjs.tz.guess();
  const date = _date.tz(curTimeZone).startOf('day');
  timeInfo.current = {
    timeZone: curTimeZone,
    date,
  };
  const [showDate, setShowDate] = useState(now.startOf('day'));
  const [view, setView] = useState<'list' | 'day' | 'week'>('week');
  const locale = useAntdLocale(i18n);
  const didCalendarMount = useRef(false);
  const [dialogInfo, setDialogInfo] = useState(() => ({
    scheduleType: 'meeting' as 'meeting' | 'event' | 'livestream',
    portalClass: 'calendarScheduleDialog',
    from: 'mainTab' as const,
    key: 0,
    visible: false,
    meetingName: '',
    ourNumber,
    members: [] as any[],
    isPrivate: true,
    i18n,
    groupInfo: undefined,
    isPreviewMode: false,
    detail: null as any,
    openType: '' as '' | 'freeTime',
    showFindTime: false,
    currentUserId: ourNumber,
    showMeetingAttendeeDialog: (items: any, groupId: string) => {
      const list = getConversations<EditAttendeeItem>();
      const isExtId = (id: string) => id?.length > 12;
      const disabledList = items.map((m: any) => {
        if (isExtId(m.id)) {
          return { ...m, id: m.email || m.id };
        }
        return m;
      }) as any[];
      if (groupId) {
        disabledList.push({ id: groupId, type: 'group' });
      }
      const disableSet = new Set(disabledList.map(u => u.id));
      const memberSet = new Set<string>();

      return new Promise<any[]>(r => {
        showEditAttendeeDialog({
          list,
          disabledList,
          onConfirm: async (payload, close) => {
            const isGroup = payload.selectType === 'groups';
            // handle group select
            if (isGroup) {
              const groups = payload.selected;
              groups.forEach(group => {
                group.members?.forEach(id => {
                  if (!disableSet.has(id) && !isBotId(id)) {
                    memberSet.add(id);
                  }
                });
              });
              r([...memberSet].map(getUserBaseInfo));
            } else {
              // handle user and extUser select
              const users = payload.selected;
              let externalUsers = users.filter(u => u.extUser);
              const appUsers = users.filter(u => !u.extUser);

              if (externalUsers.length > 0) {
                externalUsers = await getWebApi()
                  .getUserEmail(externalUsers.map(item => item.id))
                  .catch(() => ({}))
                  .then((resp: any) => {
                    if (resp?.status !== 0) {
                      return {};
                    }

                    return resp.data.map((info: any) => ({
                      id: info.uid,
                      name: info.name,
                      email: info.email,
                      validUser: info.validUser,
                      extUser: true,
                    }));
                  });
              }

              r([...appUsers, ...externalUsers]);
            }
            close();
          },
          afterClose() {
            r([]);
          },
        });
      });
    },
    onChangeToCreate: (detail: any) => {
      const scheduleType = detail.isLiveStream
        ? 'livestream'
        : detail.category === 'event'
          ? 'event'
          : 'meeting';
      const isPrivate = !detail.group?.gid;
      const groupInfo = detail.group;
      const members = detail.attendees
        .map((atd: any) => {
          const userInfo = getUserBaseInfo(atd.uid);
          const email = atd.email || userInfo.email;
          const name = atd.name || userInfo.name;

          return {
            ...atd,
            ...(userInfo || {
              id: atd.uid,
            }),
            name,
            email,
          };
        })
        .filter(Boolean);

      const start =
        (detail.isAllDay && detail.category === 'event') || detail.start * 1000 > Date.now()
          ? detail.start
          : dayjs(Math.ceil(Date.now() / 600000) * 600000).unix();
      const end = start + detail.duration * 60;

      const copiedDetail = {
        host: ourNumber,
        ...pick(detail, [
          'duration',
          'recurringRule',
          'guests',
          'isAllDay',
          'attachment',
          'description',
          'receiveNotification',
        ]),
        start,
        end,
      };

      unstable_batchedUpdates(() => {
        setCurrentEid('');
        setCurrentCid('default');
        setCurrentFreeTimeId('');
        setCurrentItem(null);
        setDialogInfo(info => ({
          ...info,
          meetingName: detail.topic,
          isPreviewMode: false,
          showFindTime: false,
          currentUserId: ourNumber,
          isPrivate,
          groupInfo,
          members,
          key: Date.now(),
          detail: copiedDetail,
          scheduleType,
        }));
      });
    },
    onClose: () => {
      unstable_batchedUpdates(() => {
        setDialogInfo(data => ({
          ...data,
          visible: false,
          showFindTime: false,
          scheduleType: 'meeting',
          openType: '',
        }));
        setCurrentEid('');
        setCurrentCid('default');
        setCurrentSource('');
        setCurrentFreeTimeId('');
        setCurrentItem(null);
      });
    },
  }));

  const MyCalendar: CalendarComponent = useMemo(() => {
    const { MyCalendar } = require('@difftim/scheduler-component');
    return MyCalendar;
  }, []);

  const [currentItem, setCurrentItem] = useState<any>(null);
  const queryClient = useQueryClient();
  const { formatList } = useFormatMeetingList();
  const {
    data: events,
    loading,
    myCalendar,
    otherCalendar,
    setMyCalendar,
    setOtherCalendar,
    checkedCalendar,
    myCalendarChecked,
    setMyCalendarChecked,
    otherCalendarChecked,
    setOtherCalendarChecked,
  } = useQueryMyEvents(timeInfo, ourNumber, isForceRefreshLock);
  // 定期获取个人会议列表

  const { filterCheckedUser, filterEvents } = useFormatCalendarList(checkedCalendar);

  const myInfo = getUserBaseInfo(ourNumber);
  const myUtc = createTzDayjs().utcOffset() / 60;
  const queryKey = getQueryKey(getDate(), timeZone);

  const setDate = useCallback(
    (d: Dayjs) => {
      unstable_batchedUpdates(() => {
        d = d.startOf('day');
        setRealDate(d);
        setShowDate(d);
      });
    },
    [setRealDate, setShowDate]
  );

  const getTimeZone = (
    allCalendars: any[],
    defaultUtc: any,
    resourceId: string,
    ourNumber: string
  ) => {
    if (resourceId === ourNumber) {
      return defaultUtc;
    }

    return allCalendars.find(item => item.id === resourceId)?.timeZone ?? defaultUtc;
  };

  const getTempEventInfo = (
    list: any[],
    item: any,
    defaultUtc: string | number,
    ourNumber: string,
    allCalendars: any[]
  ) => {
    let timeZone;
    let isBusy;

    const resourceId = item.resourceId || ourNumber;

    const curUserEvents = list.filter(u => cid2uid(u.cid) === resourceId);

    timeZone = getTimeZone(allCalendars, defaultUtc, resourceId, ourNumber);

    isBusy = curUserEvents.some(u => isOverlap(item.start, item.end, u.start, u.end));

    return {
      timeZone: Number(timeZone),
      isBusy,
    };
  };

  const getNameAndInfo = (id: string) => {
    const info = getUserBaseInfo(id);
    let myName = info.name || id;

    if (myName?.includes('(')) {
      myName = myName.substring(0, myName.indexOf('('));
      myName = myName.trim();
    }

    return {
      name: myName,
      info,
    };
  };

  const getMeetingName = (time: any) => {
    const users = uniq(
      time.isBossProxy ? [time?.resourceId] : [props.ourNumber, time?.resourceId].filter(Boolean)
    );

    const [me, other] = users.map(getNameAndInfo);
    const meetingMembers = [{ ...me.info, isRemovable: false }];

    if (other) {
      meetingMembers.push(other.info);
    }
    const meetingName = `${
      !!other ? `${me.name} and ${other.name || other.info.id}` : me.name
    }'s Meeting`;

    return meetingName;
  };

  const createTemperateOperateEvent = (item: any, timeZone: number, isBusy: boolean) => {
    const renderTitleTempEventComponent = () => {
      const start = dayjs(item.start * 1000);
      const end = dayjs(item.end * 1000);
      // 这里通过 utcOffset 去设置，无需使用类型的 CreateTzDayjs
      const timeStr = getTimeFormatWithUtc(start, end, timeZone);
      const meetingName = getMeetingName(item);

      return (
        <div
          onClick={e => {
            e.stopPropagation();
            createNativeMeeting(item);
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
  };

  const listToRender = useMemo(() => {
    const myAccounts = myCalendarChecked
      .sort((a, b) => (a === ourNumber ? -1 : b === ourNumber ? 1 : 0))
      .map(uid2cid);
    return formatList(events, createTzDayjs(date).startOf('week'), myAccounts);
  }, [queryKey, events, myCalendarChecked, formatList, timeStamp, timeZone, date]);

  const { list: eventsToRender, hasCrossDayEvent } = useMemo(() => {
    if (view === 'list') {
      return {
        list: [],
        hasCrossDayEvent: false,
      };
    }

    const info = filterEvents(events);
    // 找到点击区域的event对应的人的信息
    // day 模式下 包括此人的 timeZone 和当前是否有会
    // week 模式下 则是自己的 timeZone，看自己是否有会
    if (currentItem) {
      const { timeZone, isBusy } = getTempEventInfo(events, currentItem, myUtc, props.ourNumber, [
        ...myCalendar,
        ...otherCalendar,
      ]);

      const selectedEvent = createTemperateOperateEvent(currentItem, timeZone, isBusy);

      info.list.unshift(selectedEvent);
    }

    return info;
  }, [
    events,
    filterEvents,
    currentItem,
    myUtc,
    ourNumber,
    view,
    timeZone,
    myCalendar,
    otherCalendar,
  ]);

  const mode = useTheme();

  const { eventBg, checkBoxBg, textColor } = useMemo(() => getUserBgColor(mode), [mode]);

  const eventColors: Record<string, { bgColor: string; color: string }> = useMemo(() => {
    return [...myCalendar, ...otherCalendar].reduce((sum, item, index) => {
      sum[item.id] = {
        bgColor: view === 'list' ? checkBoxBg[index] : eventBg[index],
        color: textColor[index],
      };
      return sum;
    }, {});
  }, [myCalendar, otherCalendar, eventBg, textColor, view]);

  useEffect(() => {
    setCurrentItem(null);
    // 做了永久缓存，一直不重启的话，需要清除当前周以前的数据
    queryClient.removeQueries({
      predicate: query => isPassedWeek(query.queryKey as unknown as string[]),
    });

    // 切换过来的话都设置成今天
    setDate(createTzDayjs());
  }, []);

  // 时区变化主动切换到当前时间
  useEffect(() => {
    setDate(dayjs().tz(curTimeZone));
  }, [curTimeZone]);

  useEffect(() => {
    let headerElement: Element | null = null;
    let onScroll: ((...args: any) => void) | null = null;

    if (view === 'day') {
      setTimeout(() => {
        headerElement = document.querySelector('.rbc-overflowing');
        if (headerElement) {
          onScroll = (e: any) => {
            const contentElement = document.querySelector('.rbc-time-content');
            if (e.target && contentElement) {
              contentElement.scrollLeft = e.target.scrollLeft;
            }
          };

          headerElement?.addEventListener('scroll', onScroll);
        }
      }, 500);
    }

    if (view === 'week' && !didCalendarMount.current) {
      didCalendarMount.current = true;
      setTimeout(() => {
        fixScrollToTimePosition();
      }, 100);
    }

    return () => {
      onScroll && headerElement?.removeEventListener('scroll', onScroll);
      headerElement = null;
      onScroll = null;
    };
  }, [view]);

  useEffect(() => {
    const refreshFromCache = (e: CustomEvent<any>) => {
      const { updateInMeetingBarOnly, syncFromIndependent } = e.detail || {};
      const resolve = updateInMeetingBarOnly || syncFromIndependent ? () => {} : e.detail;
      // 收到推送移除所有缓存
      const promises = [
        // diffrence: invalidateQueries only make the active query to refetch, refetchQueries means force refetch
        () => queryClient.invalidateQueries({ queryKey: ['myEvents'] }),
        () => queryClient.refetchQueries({ queryKey: ['incomingEvents'] }),
      ];

      if (syncFromIndependent) {
        promises.pop();
      } else if (updateInMeetingBarOnly) {
        promises.shift();
      }
      // 清除本地缓存，为了如果停在后面某一页就退出了，本地的缓存就不适合了, 需要重新更新
      localStorage.removeItem('myEvents');

      Promise.all(promises.map(fn => fn()))
        .then(resolve)
        .catch(resolve)
        .then(() => {
          updateTodayUnreadSchedule({
            count: getTodayListCount(ourNumber),
            isOn: true,
          });
        });
    };

    const refresh = async () => {
      try {
        const now = createTzDayjs();
        await queryClient.refetchQueries({
          queryKey: ['myEvents', getQueryKey(now, timeZone)],
        });

        updateTodayUnreadSchedule({
          count: getTodayListCount(ourNumber),
        });
      } catch (error) {
        console.error('refresh calendar dashboard error', error);
      }
    };

    window.addEventListener('refresh-calendar-dashboard', refreshFromCache as EventListener);

    // force trigger listToRender change when badage changed
    const updateTimestamp = () => {
      setTimeStamp(Date.now());
    };

    window.addEventListener('force-update-meeting-list', updateTimestamp);
    // check if cache-refresh needed everytime network recovery
    window.addEventListener('online', refresh);

    registerReadScheduleNotifyCallback(info => {
      setTimeout(() => {
        unstable_batchedUpdates(() => {
          setOpenSetting(false);
          setDate(createTzDayjs());
          setCurrentFreeTimeId('');
          setCurrentEid(info.eid);
          setCurrentSource('');
        });
      }, 100);
    });

    registerIPCScheduleWithSomeone(id => {
      if (id) {
        const start = estimateTime(dayjs().add(5, 'minute'), {
          type: 'next',
        }).unix();

        createNativeMeeting(
          {
            start,
            end: start + 30 * 60,
            resourceId: id,
          },
          true
        );
      }
    });

    return () => {
      window.removeEventListener('refresh-calendar-dashboard', refreshFromCache as EventListener);

      window.removeEventListener('force-update-meeting-list', updateTimestamp);

      window.removeEventListener('online', refresh);
    };
  }, []);

  useEffect(() => {
    let shouldRender = true;

    const getDetail = async () => {
      const getEid = (eid = '') => {
        const [realEid] = eid.split('[copy]');
        return realEid;
      };

      try {
        const res = await getWebApi().getMeetingScheduleDetail({
          eventId: getEid(currentEid),
          calendarId: currentCid,
          source: currentSource,
        });

        if (!shouldRender) {
          return;
        }

        if (res.status !== 0) {
          throw Error(res.reason || res.data);
        }

        setDetailLoading(false);

        if (!res.data) {
          toastError('Meeting has already been deleted!');
          return;
        }

        const { event, ...extraInfo } = res.data;

        const members = event.attendees
          .map((atd: any) => {
            const isAppUser = isMatchUserId(atd.uid);
            const userInfo = getUserBaseInfo(atd.uid);
            const email = isAppUser ? userInfo.email || '' : atd.email || '';
            const name = isAppUser ? userInfo.name || '' : atd.name || userInfo.name || '';

            return {
              ...atd,
              ...(userInfo || {
                id: atd.uid,
              }),
              name,
              email,
            };
          })
          .filter(Boolean);

        const duration = (event.end - event.start) / 60;

        const currentUid = cid2uid(extraInfo.cid);

        setDialogInfo(info => ({
          ...info,
          key: Date.now(),
          members,
          isPrivate: !event.isGroup,
          groupInfo: event.group || {},
          meetingName: event?.topic,
          isPreviewMode: true,
          openType: '',
          detail: {
            ...extraInfo,
            ...event,
            duration,
          },
          currentUserId: currentUid,
        }));
      } catch (error: any) {
        console.error('get meeting detail error', error);
        toastError(error?.message || 'request error');

        unstable_batchedUpdates(() => {
          setDetailLoading(false);
          setCurrentEid('');
          setCurrentSource('');
          setCurrentCid('default');
          setDialogInfo(info => ({
            ...info,
            visible: false,
            key: Date.now(),
            openType: '',
            scheduleType: 'meeting',
            showFindTime: false,
          }));
        });
      }
    };

    if (currentEid) {
      setDetailLoading(true);
      setDialogInfo(info => ({
        ...info,
        visible: true,
        showFindTime: false,
        key: Date.now(),
      }));
      getDetail();
    } else {
      setDetailLoading(false);
    }

    return () => {
      shouldRender = false;
    };
  }, [`${currentEid}_${currentCid}_${currentSource}`]);

  const isScheduleOpened = (scheduleType: 'meeting' | 'livestream' | 'event') => {
    if (
      dialogInfo.visible &&
      dialogInfo.openType === '' &&
      dialogInfo.scheduleType === scheduleType &&
      !dialogInfo.detail
    ) {
      setDialogInfo(info => ({ ...info, visible: false }));
      return true;
    }

    return false;
  };

  // 自研会议
  const createNativeMeeting = (
    time: {
      start: number;
      end?: number;
      resourceId: string;
      id?: string;
      isBossProxy?: boolean;
    } | null = null,
    showFindTime = false
  ) => {
    if (isScheduleOpened('meeting')) {
      return;
    }

    const users = time?.isBossProxy
      ? [time?.resourceId]
      : uniq([props.ourNumber, time?.resourceId].filter(Boolean));

    const [me, other] = users.map(getNameAndInfo);
    const meetingMembers = [{ ...me.info, isRemovable: false }];

    if (other) {
      meetingMembers.push(other.info);
    }

    unstable_batchedUpdates(() => {
      setCurrentFreeTimeId(time?.id || '');
      setOpenSetting(false);
      setCurrentEid('');
      setCurrentSource('');
      setCurrentCid('default');

      setDialogInfo(info => ({
        ...info,
        key: Date.now(),
        visible: true,
        scheduleType: 'meeting',
        showFindTime,
        meetingName: `${other?.name ? `${me.name} and ${other.name}` : me.name}'s Meeting`,
        detail: time?.start
          ? {
              start: time.start,
              duration: time.end ? Math.round((time.end - time.start) / 60) : 30,
            }
          : null,
        isPreviewMode: false,
        isPrivate: true,
        groupInfo: undefined,
        members: meetingMembers,
        openType: time ? 'freeTime' : '',
        currentUserId: time?.isBossProxy ? time?.resourceId || ourNumber : ourNumber,
      }));
    });
  };

  // liveStream
  const createLiveStream = () => {
    if (isScheduleOpened('livestream')) {
      return;
    }
    const members = [{ ...getNameAndInfo(ourNumber).info, canNotDelete: true }];

    unstable_batchedUpdates(() => {
      setCurrentFreeTimeId('');
      setOpenSetting(false);

      setDialogInfo(info => ({
        ...info,
        scheduleType: 'livestream',
        key: Date.now(),
        visible: true,
        showFindTime: false,
        meetingName: `Live Stream`,
        detail: null,
        isPreviewMode: false,
        isPrivate: false,
        groupInfo: undefined,
        members,
        openType: '',
        currentUserId: ourNumber,
      }));
    });
  };

  const createEvent = () => {
    if (isScheduleOpened('event')) {
      return;
    }
    const myInfo = getNameAndInfo(ourNumber);

    unstable_batchedUpdates(() => {
      setCurrentFreeTimeId('');
      setOpenSetting(false);

      setDialogInfo(info => ({
        ...info,
        scheduleType: 'event',
        key: Date.now(),
        visible: true,
        showFindTime: false,
        meetingName: `${myInfo.name}'s Event`,
        detail: null,
        isPreviewMode: false,
        isPrivate: true,
        groupInfo: undefined,
        members: [{ ...myInfo.info, canNotDelete: true }],
        openType: '',
        currentUserId: ourNumber,
      }));
    });
  };

  const scheduleLiveStream = () => {
    const getEntryOpen = () => {
      return false;
    };

    if (!getEntryOpen()) {
      toast('Coming soon');
      return;
    }

    createLiveStream();
  };

  const showDetail = async (item: any) => {
    setCurrentItem(null);
    unstable_batchedUpdates(() => {
      setCurrentFreeTimeId('');
      setCurrentEid(item.eid);
      setCurrentCid(item.cid);
      setCurrentSource(item.source);
    });
  };

  const renderLeft = () => {
    const createRoom = async (e: any) => {
      const removeQuote = (name?: string) => {
        if (name && name.includes('(')) {
          return name.slice(0, name.indexOf('(')).trim();
        }

        return name || '';
      };
      try {
        const name = removeQuote(myInfo.name) || ourNumber;
        const topic = `${name}'s Personal Meeting Room`;
        const channelName = `I-${window.btoa('myroom:user:' + ourNumber)}`;

        joinMeeting(e, {
          channelName,
          topic,
        });
      } catch (error) {
        toastError('join room error');
      }
    };

    const jumpToWebMeeting = () => {
      const win = window as any;
      const webMeetingFallbackLink = win.getWebMeetingFallbackLink?.();
      if (!webMeetingFallbackLink) {
        toastError('create web meeting failed');
        return;
      }
      win.sendBrowserOpenUrl?.(webMeetingFallbackLink);
    };

    const headerRender = ({ value /*onChange*/ }: any) => {
      // const isDisabled = value.startOf('month') <= dayjs().startOf('month');

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
      const now = createTzDayjs();
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
      <div className="left">
        {!isCurrentWindowIndependent() ? (
          <div className="title">
            <span>Calendar</span>
          </div>
        ) : null}
        <div className="main-block">
          <div
            onClick={() => {
              createNativeMeeting();
            }}
            className="meeting-block book"
          >
            <IconTablerVideo />
            <div>Meeting</div>
          </div>
          <div className="meeting-block instant" onClick={createEvent}>
            <IconCalendarEvent />
            <div>Event</div>
          </div>
          <div
            onClick={() => {
              const list = getConversations<EditAttendeeItem>().filter(
                item => item.type === 'direct'
              );

              showInstantMeetingModal({
                ourNumber,
                list: uniqBy([...list, myInfo], 'id'),
                onConfirm: ({ selected, meetingName }, close) => {
                  instantMeeting(
                    uniq([ourNumber, ...selected.map(u => u.id)]),
                    meetingName || 'Instant Meeting'
                  );
                  close();
                },
              });
            }}
            className="meeting-block instant"
          >
            <IconFlashLineF />
            <div>Instant Meet</div>
          </div>
          <div onClick={scheduleLiveStream} className="meeting-block instant">
            <IconFluentLive24Filled />
            <div>Live Stream</div>
          </div>
          <div onClick={createRoom} className="meeting-block instant">
            <IconTablerUser />
            <div>My Room</div>
          </div>
          {!isCurrentWindowIndependent() && (
            <div onClick={jumpToWebMeeting} className="meeting-block instant webCall">
              <IconTablerLink style={{ flexShrink: 0 }} />
              <div>New Web Call</div>
            </div>
          )}
        </div>
        <ConfigProvider locale={locale}>
          <Calendar
            className="left-pane-calendar"
            value={showDate.tz(timeZone).startOf('day')}
            onSelect={(curDate, { source }) => {
              if (source === 'date') {
                unstable_batchedUpdates(() => {
                  setDate(curDate);
                  setDialogInfo(data => ({ ...data, visible: false }));
                  setCurrentEid('');
                  setCurrentSource('');
                  setCurrentFreeTimeId('');
                  setCurrentItem(null);
                  setCurrentCid('default');

                  if (view === 'list' && curDate.unix() < createTzDayjs().startOf('day').unix()) {
                    setView('day');
                  }
                });
              }
            }}
            fullscreen={false}
            headerRender={headerRender}
            fullCellRender={fullCellRender}
          />
        </ConfigProvider>

        <div className="select-list-wrapper">
          <SelectList
            myId={props.ourNumber}
            listStyle={{ flexShrink: 0 }}
            list={myCalendar}
            bgColors={checkBoxBg.slice(0, myCalendar.length)}
            title="My Calendars"
            checked={myCalendarChecked}
            onChange={list => {
              localStorage.setItem('myChecked', JSON.stringify(list));
              setMyCalendarChecked(list);
              updateTodayUnreadSchedule({
                count: getTodayListCount(ourNumber),
              });
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
          ) : null}
        </div>
      </div>
    );
  };

  const renderRight = () => {
    return <div className="main">{renderMainPart()}</div>;
  };

  const renderMainPart = () => {
    const members = filterCheckedUser([...myCalendar, ...otherCalendar]);
    const scrollToTime = now.startOf('day').add(9.5, 'hour').toDate();

    return (
      <>
        {loading ? (
          <div className="loading-indicator">
            <Spin />
          </div>
        ) : null}
        {view === 'list' ? (
          <ListView
            eventColors={eventColors}
            date={date}
            setDate={setDate}
            key={`${queryKey}-${timeZone}`}
            currentEid={currentEid}
            currentCid={currentCid}
            currentFreeTimeId={currentFreeTimeId}
            doSchedule={(time: { start: Dayjs; [key: string]: any }) => {
              const now = createTzDayjs();
              const startTime =
                time.start > now
                  ? time.start
                  : estimateTime(now.add(5, 'minute'), { type: 'next' });

              const newTime = {
                ...time,
                start: startTime.unix(),
              };
              createNativeMeeting(newTime as any);
            }}
            meetings={meetings}
            ourNumber={ourNumber}
            list={listToRender}
            setView={(v: 'list' | 'day' | 'week') => {
              setView(v);
              localStorage.setItem('calendarView', v);
            }}
            i18n={i18n}
            showDetail={showDetail}
          />
        ) : null}
        <MyCalendar
          className={classNames(`${view}-mode`, {
            allDay: hasCrossDayEvent,
            'no-allday': !hasCrossDayEvent,
          })}
          view={view === 'list' ? 'week' : view}
          date={date.toDate()}
          isDisabled={() => false}
          onChange={d => {
            const day = createTzDayjs(d);
            setDate(day);
          }}
          onViewChange={v => {
            unstable_batchedUpdates(() => {
              setView(v);
              localStorage.setItem('calendarView', v);
              setCurrentItem(null);
            });
          }}
          events={eventsToRender}
          members={members}
          // @ts-ignore
          timeZone={timeZone || dayjs.tz.guess()}
          style={{
            width: `calc(100vw - ${isCurrentWindowIndependent() ? 300 : 368}px)`,
            ...(view === 'list' ? { display: 'none' } : {}),
          }}
          eventColors={eventColors}
          scrollToTime={scrollToTime}
          onRenderHeader={item => {
            const timeZoneNum = getOffset(item);
            const utcOffset =
              item.id === ourNumber
                ? getUtcOffset(timeZone)
                : `UTC${timeZoneNum >= 0 ? '+' : ''}${timeZoneNum}`;

            const totalChecked = myCalendarChecked.length + otherCalendarChecked.length;

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
            setOpenSetting(false);
            if (e.id !== props.ourNumber && !e.isBossProxy) {
              toastError('You have no access to view details');

              return;
            }
            showDetail(e);
          }}
          onSelectSlot={(slot: any) => {
            console.log('slot', slot);
            // 不能跟自己约会
            const slotInMyCalendar = myCalendar.find(item => item.id === slot.resourceId);

            const isBossProxy = slotInMyCalendar?.role === 'proxy';

            if (
              slot?.resourceId &&
              slotInMyCalendar &&
              !isBossProxy &&
              slot.resourceId !== props.ourNumber
            ) {
              toastError('You have no access to book.');
              return;
            }

            setCurrentItem({ ...slot, isBossProxy });
          }}
          onExtraHeaderRender={() => (
            <div className="setting-btn-wrapper">
              <IconTablerSetting
                onClick={() => {
                  setOpenSetting(open => !open);
                  setCurrentItem(null);
                }}
              />
            </div>
          )}
          renderCustomViewGroup={({ view, onView }) => {
            return (
              <>
                <button
                  type="button"
                  key="list"
                  onClick={() => {
                    unstable_batchedUpdates(() => {
                      setView('list');
                      const now = createTzDayjs().startOf('day');
                      if (date.isBefore(now.startOf('week'))) {
                        setDate(now);
                      }
                    });
                  }}
                >
                  List
                </button>
                <button
                  type="button"
                  key="week"
                  className={view === 'week' ? 'rbc-active' : ''}
                  onClick={() => onView('week')}
                >
                  Week
                </button>
                <button
                  type="button"
                  key="day"
                  className={view === 'day' ? 'rbc-active' : ''}
                  onClick={() => onView('day')}
                >
                  Day
                </button>
              </>
            );
          }}
        />
      </>
    );
  };

  const renderDialog = () => {
    const { visible, key, ...rest } = dialogInfo;

    if (!visible) {
      return null;
    }

    const { ScheduleMeetingDialog } = require('../ScheduleMeetingDialog');

    return <ScheduleMeetingDialog key={key} loading={detailLoading} {...rest} />;
  };

  const renderSettingDialog = () => {
    if (!openSetting) {
      return null;
    }

    const { CalendarSettingDialog } = require('./CalendarSettingDialog');

    return (
      <CalendarSettingDialog
        i18n={props.i18n}
        onClose={() => setOpenSetting(false)}
        portalClass="calendarSettingDialog"
        myList={myCalendar}
        setMy={setMyCalendar}
        setOther={setOtherCalendar}
        otherList={otherCalendar}
        ourNumber={props.ourNumber}
      />
    );
  };

  return (
    <>
      {renderLeft()}
      {renderRight()}
      {renderDialog()}
      {renderSettingDialog()}
      <div className="calendarScheduleDialog" />
      <div className="calendarSettingDialog" />
    </>
  );
};

export default CalendarList;
