//@ts-nocheck
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { Flex, Input, InputNumber, Popover, Space, Tooltip, Drawer } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import classNames from 'classnames';

import ScheduleMeetingFileManager from './FileManager';
import UserList from './UserList';
import ScheduleMeetingHeader from './ScheduleMeetingHeader';
import ScheduleMeetingTimePicker, { TimerRefFunctions } from './ScheduleMeetingTimePicker';
import ScheduleEventEndPicker from './ScheduleEventEndPicker';
import ViewSchedule from './viewSchedule/index';
import { Linkify } from './conversation/Linkify';
import { Select, Button, Checkbox, InputSelect } from './shared';
import {
  IconChevronRight,
  IconHelperF,
  IconTablerPlus,
  IconTablerDots,
  IconEditF,
  IconDeleteF,
  IconTablerCopy,
  IconCopyPlus,
  IconTablerForward,
  IconTablerTransfer,
  IconTablerInfoCircle,
} from '@shared/IconsNew';
import { useGoToGoogleMeeting } from './CalendarTab/hooks/useGoToGoogleMeeting';
import { useRadioModal } from '../hooks/useAllMeetingRadioModal';
import { sortUserList } from './utils/sortScheduleMeetingUser';

import {
  cleanUserNameForDisplay,
  estimateTime,
  formatRoundMinute,
  formatTime,
  getUtcOffset,
  isBotId,
  isMatchUserId,
  cid2uid,
  uid2cid,
  replaceMarkdownContent,
} from '@/util';
import { toastSuccess, toastError, toastWarning } from './shared/Message';
import {
  getWebApi,
  getUserBaseInfo,
  getConversations,
  sendToConversation,
  copyText,
  getDefaultTimerInterval,
} from '@/shims/globalAdapter';
import { joinMeeting } from './CalendarTab/joinMeeting';
import { useShowForwardModal } from '../bussiness/ForwardToChatModal';
import { useShowEditLiveGuestDialog } from '../bussiness/guestInviteModal';
import { useTransferScheduleModal } from '../bussiness/TransferScheduleModal';
import { throttle, uniq, uniqBy } from 'lodash';
import { useTimeZoneDayjs } from './CalendarTab/hooks/useTimeZoneDayjs';
import { getOffsetString } from '../util/formatTime';
import { CustomRepeat, ScheduleMeetingCustomRepeatModal } from './ScheduleMeetingCustomRepeatModal';
import {
  GOING,
  POPOVER_INNER_STYLE,
  PREVIEW_ITEM_STYLE,
  DURATION_OPTIONS,
  PERMISSION,
} from './ScheduleMeetingConsts';

const { isBotId } = require('../../js/modules/id');

interface ScheduleMeetingProps {
  i18n: any;
  ourNumber: string;
  currentUserId: string;
  meetingName: string;
  members: any[];
  groupInfo: { gid: string; name?: string } | undefined | null;
  isPrivate: boolean;
  // 预览模式
  isPreviewMode: boolean;
  detail?: any;
  scheduleType?: 'meeting' | 'livestream' | 'event';
  from?: 'conversation' | 'mainTab';
  loading?: boolean;
  portalClass?: string;
  isBot?: boolean;
  channelName?: string;
  privateUserId?: string;
  showFindTime?: boolean;
  // send MD to specific user， only exist when schedule in a diffrent in conversation
  sendToId?: string;
  showMeetingAttendeeDialog: (items: any[], gid: string) => Promise<any[]>;
  onClose: () => void;
  onChangeToCreate: (detail: any) => void;
}

const getRepeatValue = (recurringRule: any) => recurringRule?.rrule || 'Never';
const getRepeatOption = (detail: any) => {
  if (!detail?.recurringRule?.repeatOptions) {
    return [
      { value: 'Never', label: 'Never' },
      {
        value: 'FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,TU,WE,TH,FR',
        label: 'Weekdays',
      },
      { value: 'FREQ=DAILY;INTERVAL=1', label: 'Daily' },
      { value: 'FREQ=WEEKLY;INTERVAL=1', label: 'Weekly' },
      {
        value: 'FREQ=WEEKLY;INTERVAL=2',
        label: 'Biweekly',
      },
      {
        value: 'FREQ=MONTHLY;INTERVAL=1',
        label: 'Monthly',
      },
    ];
  }

  return detail.recurringRule.repeatOptions;
};

export const ScheduleMeetingDialog = (props: ScheduleMeetingProps) => {
  const {
    from = 'conversation',
    onClose,
    i18n,
    isPrivate,
    meetingName,
    members,
    groupInfo,
    showMeetingAttendeeDialog,
    isPreviewMode = false,
    portalClass = '',
    loading = false,
    isBot = false,
    currentUserId,
    privateUserId = null,
    ourNumber,
  } = props;
  const detail = props.detail || {};
  const [meetingOption, setMeetingOption] = useState({
    everyoneCanInviteOthers: true,
    everyoneCanModify: false,
    sendToChatRoom: true,
    syncToGoogle: false,
    timerOption: {
      enabled: false,
      duration: null as number | null,
    },
  });
  const { showForwardModal } = useShowForwardModal();
  const messaging = getWebApi();
  const my = getUserBaseInfo(ourNumber);
  const [customRepeat, setCustomRepeat] = useState<CustomRepeat>({
    options: [{ label: 'Custom...', value: 'custom' }],
    show: false,
  });

  const { showEditLiveGuestDialog } = useShowEditLiveGuestDialog();
  const { showTransferScheduleModal } = useTransferScheduleModal();

  const getDateFromDetail = () => {
    const now = createTzDayjs();
    if (detail.start) {
      const d = createTzDayjs(detail.start * 1000);

      return d;
    }

    return estimateTime(now.add(5, 'minute'), { type: 'next' });
  };

  const fixAllDayStartAndDuration = (detail: any) => {
    if (detail.isAllDay && detail.allDayStart && detail.allDayEnd) {
      detail.start = dayjs(detail.allDayStart, 'YYYYMMDD').tz(myTimeZone, true).unix();

      detail.duration =
        dayjs(detail.allDayEnd, 'YYYYMMDD').diff(dayjs(detail.allDayStart, 'YYYYMMDD'), 'minutes') -
        1;
    }
  };

  const { openModal } = useRadioModal();

  const getTitleFromDetail = (type: 'liveStream' | 'meeting' | 'event') => {
    const isHost = detail.host === cid2uid(detail.cid);
    // live stream
    if (type === 'liveStream') {
      return isHost ? i18n('schedule.cancelLive') : i18n('schedule.dontAttendLive');
    }

    // event
    if (type === 'event') {
      if (isHost) {
        return detail.isRecurring
          ? i18n('schedule.cancelRecurringEvent')
          : i18n('schedule.cancelSingleEvent');
      }
      return detail.isRecurring
        ? i18n('schedule.dontAttentRecurringEvent')
        : i18n('schedule.dontAttentEvent');
    }

    // meeting
    if (isHost) {
      return detail.isRecurring
        ? i18n('schedule.cancelRecurringMeet')
        : i18n('schedule.cancelSingleMeet');
    }

    return detail.isRecurring
      ? i18n('schedule.dontAttentRecurringMeet')
      : i18n('schedule.dontAttentMeet');
  };

  const [isViewSchedule, setIsViewSchedule] = useState(false);
  const [isLiveStream, setIsLiveStream] = useState<boolean>(props.scheduleType === 'livestream');
  const [isEvent, setIsEvent] = useState<boolean>(props.scheduleType === 'event');

  const [previewMode, setPreviewMode] = useState(isPreviewMode);
  const [items, setItems] = useState<any[]>(members);
  const [repeat, setRepeat] = useState(() => getRepeatValue(detail.recurringRule));
  const [guestInfo, setGuestInfo] = useState<{
    allStaff: boolean;
    users: string[];
    total: number;
  }>(
    detail.guests || {
      allStaff: false,
      users: [],
      total: 0,
    }
  );

  const getTimeZoneFromCalendarId = () => {
    const defaultTimezone = myTimeZone || dayjs.tz.guess();
    if (calendarId === uid2cid(ourNumber)) {
      return defaultTimezone;
    }

    const item = calendarList.find(item => item.cid === calendarId);

    if (item?.timeZone) {
      return item.timeZone;
    }

    return defaultTimezone;
  };

  const showGoogleSync = isPreviewMode ? detail.source === 'google' : meetingOption.syncToGoogle;
  const { createTzDayjs, timeZone: myTimeZone } = useTimeZoneDayjs();
  const [duration, setDuration] = useState(detail.duration || 30);
  const [_meetingName, setMeetingName] = useState(meetingName);
  const [showMore, setShowMore] = useState(false);
  const [showGoogleSyncOption, setShowGoogleSyncOption] = useState(false);
  console.log('duration', duration);

  // 日期
  const [_date, setDate] = useState<Dayjs>(getDateFromDetail);

  // 时间
  const [_time, setTime] = useState<Dayjs>(getDateFromDetail);
  // Boss 代理约会
  const [calendarId, setCalenderId] = useState(() => uid2cid(currentUserId));
  const [desc, setDesc] = useState<string>(detail.description || '');
  const [files, setFile] = useState<any[]>(detail.attachment || []);
  const [isInAttendeeDetail, setIsInAttendeeDetail] = useState(false);
  const [isAllDay, setIsAllDay] = useState(detail.isAllDay || false);
  const [detailOpenType, setDetailOpenType] = useState<'attendee' | 'guest'>('attendee');
  const [receiveNotification, setReceiveNotification] = useState(detail.receiveNotification);
  const [postLoading, setPostLoading] = useState(false);
  const [going, setGoing] = useState<GOING>(detail.going || GOING.MAYBE);
  const [operateOpen, setOperateOpen] = useState(false);
  const goingBtnLoading = useRef(false);
  const receiveLoading = useRef(false);
  const timerPickerRef = useRef<TimerRefFunctions>(null);
  const googleCalendarLock = useRef<boolean>(false);
  const membersMap = useRef(new Map());
  const [changableGroupInfo, setChangableGroupInfo] = useState(() => {
    return {
      gid: groupInfo?.gid || '',
      name: groupInfo?.name || '',
    };
  });
  const { goToGoogleMeeting } = useGoToGoogleMeeting();
  const [bossCalendarList] = useState(() => {
    let result = [];
    try {
      result = JSON.parse(localStorage.getItem('bossCalendar') || '[]');
    } catch (e) {
      console.log('get boss proxy list error', e);
    }
    return result;
  });

  const calendarList = [
    { cid: uid2cid(ourNumber), timeZone: myTimeZone || dayjs.tz.guess() },
    ...(isLiveStream ? [] : bossCalendarList),
  ];

  const timeZone = getTimeZoneFromCalendarId();
  const date = useMemo(() => _date?.tz(timeZone), [_date, timeZone]);
  const time = useMemo(() => _time?.tz(timeZone), [_time, timeZone]);

  const [queryDate, setQueryDate] = useState(date.format('YYYY-MM-DD'));

  const wantDate = useMemo(() => {
    const startDate = date!.format('YYYY-MM-DD');
    const startTime = time!.format('HH:mm');
    const start = dayjs(
      `${startDate} ${startTime} ${getOffsetString(timeZone)}`,
      'YYYY-MM-DD HH:mm Z'
    ).unix();

    const end = dayjs(start * 1000)
      .add(duration, 'minutes')
      .unix();

    return {
      topic: _meetingName,
      start,
      end,
      eid: 'isWant',
      isWant: true,
    };
  }, [_meetingName, date, time, duration, timeZone]);

  useLayoutEffect(() => {
    setQueryDate(date.format('YYYY-MM-DD'));
  }, [date.format('YYYY-MM-DD')]);

  useEffect(() => {
    window.addEventListener('conversation-close-create-poll-dialog', onClose);
    return () => {
      googleCalendarLock.current = false;
      membersMap.current.clear();
      window.removeEventListener('conversation-close-create-poll-dialog', onClose);
    };
  }, []);

  useEffect(() => {
    if (props.showFindTime) {
      setIsViewSchedule(true);
    }
  }, [props.showFindTime]);

  useLayoutEffect(() => {
    let shouldSetShowGoogleSyncOption = true;
    const fetchGoogleSyncConfig = async () => {
      try {
        const res = await messaging.getCreateCalendarConfig({
          calendarId,
          features: ['canSyncGoogle'],
        });
        if (res.status !== 0) {
          console.error('fetch google sync config error', res.reason);
          throw Error('fetch google sync config error');
        }
        const config = res.data || {};
        if (shouldSetShowGoogleSyncOption) {
          setShowGoogleSyncOption(config.canSyncGoogle || false);
        }
      } catch {
        setShowGoogleSyncOption(false);
      }
    };

    if (isPreviewMode) {
      shouldSetShowGoogleSyncOption = false;
      setShowGoogleSyncOption(true);
    } else {
      fetchGoogleSyncConfig();
    }

    return () => {
      shouldSetShowGoogleSyncOption = false;
    };
  }, [isPreviewMode, calendarId]);

  // loading做在了组件里，在loading后如果组件没销毁，需要重新同步props里的值
  useLayoutEffect(() => {
    if (isPreviewMode && previewMode && !loading) {
      unstable_batchedUpdates(() => {
        fixAllDayStartAndDuration(detail);
        const date = getDateFromDetail();
        const withoutBotMembers = members.filter(item => !isBotId(item.uid));

        membersMap.current.clear();
        withoutBotMembers.forEach(item => {
          if (item.isGroupUser) {
            membersMap.current.set(item.id, true);
          }
        });

        setItems(withoutBotMembers);
        setMeetingName(meetingName);
        setReceiveNotification(detail.receiveNotification);
        setGoing(detail.going || GOING.MAYBE);
        setCalenderId(detail.cid);
        setIsAllDay(detail.isAllDay);
        setDesc(detail.description?.trim());
        setDuration(detail.duration);
        setRepeat(getRepeatValue(detail.recurringRule));
        setGuestInfo(detail.guests || { allStaff: false, users: [], total: 0 });
        setFile(detail.attachment || []);
        setDate(date);
        setQueryDate(date?.format('YYYY-MM-DD')!);
        setTime(date);
        setChangableGroupInfo(detail.group || {});
        setMeetingOption(opt => {
          const speechDuration =
            typeof detail.speechTimer?.duration === 'number'
              ? Math.round(detail.speechTimer?.duration / 60)
              : null;

          return {
            ...opt,
            everyoneCanInviteOthers: detail.everyoneCanInviteOthers,
            everyoneCanModify: detail.everyoneCanModify,
            syncToGoogle: detail.syncToGoogle,
            timerOption: {
              duration: speechDuration,
              enabled: detail.speechTimerEnabled ?? false,
            },
          };
        });
        setIsLiveStream(detail.isLiveStream || false);
        setIsEvent(detail.category === 'event');
        // setUserListOpen(hasOutGroupUser);
      });
    }
  }, [detail, isPreviewMode, previewMode, loading, meetingName, members]);

  const fetchMyOrgInfo = useCallback(
    throttle(
      async () => {
        try {
          const res = await messaging.getSchedulerOrgInfo();
          if (res?.status === 0 && typeof res.data?.total === 'number') {
            setGuestInfo(info => ({ ...info, total: res.data.total }));
          }
        } catch (error) {
          console.log('fetch my org error', error);
        }
      },
      60 * 1000,
      { leading: true }
    ),
    []
  );

  const onDeleteUser = useCallback(userId => {
    setItems(items => items.filter(u => u.id !== userId));
  }, []);

  const setOptions = (type: string) => (e: any) => {
    const value = e.target.checked;
    const payload =
      type === 'everyoneCanModify' && value
        ? {
            everyoneCanInviteOthers: true,
          }
        : {};

    setMeetingOption(v => ({ ...v, [type]: value, ...payload }));
  };

  const addAttendeeFromDialog = async () => {
    const membersToAdd = await showMeetingAttendeeDialog(items, changableGroupInfo?.gid);
    if (!membersToAdd.length) {
      return;
    }

    // 如果加入的这个人在约会之后在群里，不应该当作群外的人了, 需要更新群组成员
    // await updateLatestGroupMemeber();

    setItems(items => [
      ...items,
      // 后面添加进来不在会里的群成员得保持 isGroupUser 为 true
      ...membersToAdd.map(m => {
        const isGroupUser = membersMap.current.has(m.id);
        return {
          ...m,
          isGroupUser,
          isRemovable: !isGroupUser,
        };
      }),
    ]);
  };

  const addGuestFromDialog = () => {
    const list = getConversations().filter((item: any) => !isBotId(item.id));

    showEditLiveGuestDialog({
      list,
      disabledList: list.filter((u: any) => u.id === ourNumber),
      onConfirm: async ({ selected }, close) => {
        const result: string[] = [];
        selected.forEach(item => {
          if (item.type === 'group') {
            if (item.members?.length > 0) {
              item.members.forEach((id: string) => {
                if (!isBotId(id) && id !== ourNumber) {
                  result.push(id);
                }
              });
            }
          } else {
            result.push(item.id);
          }
        });
        setGuestInfo(info => ({
          ...info,
          users: uniq([...info.users, ...result]),
        }));
        close();
      },
    });
  };

  const showTransferScheduleDialog = () => {
    showTransferScheduleModal({
      zIndex: 999,
      list: items.filter(item => item.going !== GOING.NO),
      host: detail.host || ourNumber,
      onConfirm: async ({ selected }, close) => {
        try {
          const host = selected[0].id;
          const { ok } = await openModal({
            title: i18n('schedule.tansferConfirm', [
              selected[0].name || getUserBaseInfo(host)?.name || 'this person',
            ]),
            hideRadio: true,
            okText: 'Transfer',
            cancelText: 'Cancel',
          });
          if (ok) {
            close();

            const res = await messaging.transferScheduleHost({
              calendarId,
              host,
              eventId: detail.eid,
            });

            if (res?.status !== 0) {
              throw Error(res);
            }

            toastSuccess('transfer successfully!');
            onClose();
          }
        } catch (error) {
          toastError('transfer error, please try again later');
          console.log('transfer error', error);
        }
      },
    });
  };

  const deleteMeeting = async () => {
    setOperateOpen(false);
    const { ok, allEvent } = await openModal({
      title: getTitleFromDetail(isLiveStream ? 'liveStream' : isEvent ? 'event' : 'meeting'),
      okText: 'Yes',
      cancelText: 'No',
      hideRadio: !detail?.isRecurring,
      isEvent,
    });

    if (!ok) {
      return;
    }

    try {
      const res = await messaging.deleteMeetingSchedule({
        isAllEvent: allEvent,
        isRecurring: detail.isRecurring || false,
        eventId: detail.eid,
        calendarId: detail.cid,
      });

      if (res.status === 0) {
        toastSuccess('Canceled!');
      } else {
        throw Error(res.reason);
      }
    } catch (error: any) {
      toastError(error?.message || 'cancel failed');
    } finally {
      setTimeout(() => {
        onClose();
      }, 500);
    }
  };

  const stopClick = (e: React.MouseEvent) => {
    e.stopPropagation?.();
    e.preventDefault?.();
  };

  const copyEvent = () => {
    props.onChangeToCreate(detail);
  };

  const canNotEdit = isPreviewMode && !detail.canModify;

  const renderMeetingTitle = () => (
    <>
      {showGoogleSync && (
        <Flex
          align="center"
          gap={4}
          justify="center"
          className="google-tooltip"
          onClick={e => {
            e.stopPropagation();
            setTimeout(() => {
              const container = document.querySelector('.meeting-schedule-dialog');
              container?.scrollTo({
                top: 600,
                behavior: 'smooth',
              });
            }, 50);
          }}
        >
          <Tooltip
            mouseEnterDelay={0.5}
            overlayClassName={'antd-tooltip-cover antd-tooltip-cover-left virtual-room-tooltip'}
            placement="bottom"
            title={i18n('schedule.syncToGoogleContent')}
          >
            <IconTablerInfoCircle />
          </Tooltip>
          <div>{i18n('schedule.syncToGoogle')}</div>
        </Flex>
      )}
      <div className="item">
        <div className="item-title">{i18n('schedule.topic')}</div>
        {previewMode ? (
          <div style={{ ...PREVIEW_ITEM_STYLE, height: 'auto' }}>{_meetingName}</div>
        ) : (
          <Input
            max={2000}
            size="large"
            placeholder={i18n('schedule.addTopic')}
            value={_meetingName}
            allowClear
            disabled={canNotEdit}
            onChange={e => {
              const meetingName = e.target.value?.slice(0, 80);
              setMeetingName(meetingName);
            }}
          />
        )}
      </div>
    </>
  );

  const renderTimerPicker = () => {
    if (previewMode) {
      return (
        <div className="item">
          <div className="item-title mt-2">
            <div style={{ lineHeight: '20px' }}>{i18n('schedule.start')}</div>
            <div className="timezone">{getUtcOffset(timeZone)}</div>
          </div>
          <div style={{ ...PREVIEW_ITEM_STYLE, minHeight: '40px', height: 'auto' }}>{`${formatTime(
            detail.start * 1000,
            {
              withRelativeTime: true,
              locale: 'en',
              tz: timeZone,
              showToday: calendarId === uid2cid(ourNumber),
              ignoreTime: isEvent && isAllDay,
            }
          )}`}</div>
        </div>
      );
    }

    return (
      <ScheduleMeetingTimePicker
        showToday={calendarId === uid2cid(ourNumber)}
        timeZone={timeZone}
        date={date!}
        time={time!}
        disabled={canNotEdit}
        setTime={setTime}
        setDate={setDate}
        quickSort={isEvent ? [] : undefined}
        ignoreTime={isAllDay}
        ref={timerPickerRef}
      />
    );
  };

  const renderDuration = () => {
    if (previewMode) {
      return (
        <div className="item">
          <div className="item-title">{i18n('schedule.duration')}</div>
          <div style={PREVIEW_ITEM_STYLE}>{formatRoundMinute(duration)}</div>
        </div>
      );
    }

    const _setDuration = (time: number) => {
      if (canNotEdit) {
        return;
      }
      setDuration(time);
    };

    const onCheckValid = (
      v: string
    ): {
      valid: boolean;
      value?: any;
      label?: string;
    } => {
      v = v.trim();

      if (!v) {
        return {
          valid: false,
        };
      }

      const hint = DURATION_OPTIONS.find(item => item.label === v);

      if (hint) {
        return {
          valid: true,
          ...hint,
        };
      }

      if (!Number.isNaN(Number(v))) {
        const value = Math.round(Number(v));
        return {
          valid: true,
          value,
          label: `${value} ${value > 1 ? 'minutes' : 'minute'}`,
        };
      }

      if (v?.endsWith('day') || v?.endsWith('days')) {
        const _v = v.split('day')[0]?.trim();

        if (!_v || Number.isNaN(Number(_v))) {
          return {
            valid: false,
          };
        }

        const value = Math.round(Number(_v));

        return {
          valid: true,
          value: value * 1440,
          label: `${value} ${value > 1 ? 'days' : 'day'}`,
        };
      }

      if (v?.endsWith('hour') || v?.endsWith('hours')) {
        const _v = v.split('hour')[0]?.trim();

        if (!_v || Number.isNaN(Number(_v))) {
          return {
            valid: false,
          };
        }

        const value = Math.round(Number(_v));

        return {
          valid: true,
          value: value * 60,
          label: `${value} ${value > 1 ? 'hours' : 'hour'}`,
        };
      }

      if (v?.endsWith('minute') || v?.endsWith('minutes')) {
        const _v = v.split('minute')[0]?.trim();

        if (!_v || Number.isNaN(Number(_v))) {
          return {
            valid: false,
          };
        }

        const value = Math.round(Number(_v));

        return {
          valid: true,
          value: value,
          label: `${value} ${value > 1 ? 'minutes' : 'minute'}`,
        };
      }

      return {
        valid: false,
      };
    };

    return (
      <div className="item">
        <div className="item-title">{i18n('schedule.duration')}</div>
        <div>
          <InputSelect
            disabled={canNotEdit}
            variant="outlined"
            size="large"
            value={duration}
            onChange={setDuration}
            options={DURATION_OPTIONS}
            popupClassName="schedule-selector"
            virtual={false}
            onCheckValid={onCheckValid}
            labelRender={formatRoundMinute}
          />
          <div className={classNames('quick-mins', { disabled: canNotEdit })}>
            <span onClick={() => _setDuration(15)}>15 mins</span>
            <span onClick={() => _setDuration(30)}>30 mins</span>
            <span onClick={() => _setDuration(60)}>1 hr</span>
          </div>
        </div>
      </div>
    );
  };

  const renderEventEnd = () => {
    if (previewMode) {
      return (
        <div className="item">
          <div className="item-title">{i18n('schedule.end')}</div>
          <div style={{ ...PREVIEW_ITEM_STYLE, minHeight: '40px', height: 'auto' }}>
            {formatTime(detail.start * 1000 + duration * 60 * 1000, {
              withRelativeTime: true,
              locale: 'en',
              tz: timeZone,
              showToday: calendarId === uid2cid(ourNumber),
              ignoreTime: isEvent && isAllDay,
            })}
          </div>
        </div>
      );
    }

    return (
      <>
        <ScheduleEventEndPicker
          disabled={canNotEdit}
          startDate={date}
          startTime={time}
          timeZone={timeZone}
          duration={duration}
          setDuration={setDuration}
          showToday={calendarId === uid2cid(ourNumber)}
          ignoreTime={isAllDay}
        />
        <div style={{ marginBottom: '10px', marginLeft: '80px' }}>
          <Checkbox
            checked={isAllDay}
            disabled={canNotEdit}
            onChange={e => {
              const allDay = e.target.checked;
              setIsAllDay(allDay);
            }}
          >
            All day
          </Checkbox>
        </div>
      </>
    );
  };

  const renderRepeatOption = () => {
    if (isLiveStream) {
      return null;
    }

    // view
    if (previewMode) {
      const getRepeatStr = (detail: any) => {
        if (!detail.isRecurring) {
          return i18n('schedule.never');
        }
        if (detail.recurringRule?.repeat) {
          return detail.recurringRule.repeat;
        }

        const repeatOptions = getRepeatOption(detail) as Array<{
          label: string;
          value: string;
        }>;

        return repeatOptions.find(item => item.value === repeat)?.label || repeat;
      };

      return (
        <div className="item">
          <div className="item-title">{i18n('schedule.repeat')}</div>
          <div style={{ ...PREVIEW_ITEM_STYLE, height: 'auto' }}>{getRepeatStr(detail)}</div>
        </div>
      );
    }

    // edit
    const repeatOptions = getRepeatOption(detail);

    return (
      <div className="item">
        <div className="item-title">{i18n('schedule.repeat')}</div>
        <div style={{ maxWidth: '248px' }}>
          <Select
            disabled={canNotEdit}
            variant="outlined"
            size="large"
            value={repeat}
            listHeight={300}
            onChange={v => {
              if (v === 'custom') {
                setCustomRepeat(prev => ({ ...prev, show: true }));
                return;
              }
              setRepeat(v);
            }}
            options={uniqBy([...repeatOptions, ...customRepeat.options], 'value')}
            popupClassName="schedule-selector"
            virtual={false}
          />
        </div>
      </div>
    );
  };

  const renderAttendees = () => {
    const renderInOutGroup = () => {
      if (isPrivate || isLiveStream || showGoogleSync) {
        return null;
      }

      return (
        <div
          style={{
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            lineHeight: '20px',
          }}
        >
          <Tooltip
            mouseEnterDelay={0.2}
            overlayClassName={'antd-tooltip-cover'}
            placement="top"
            title={i18n('schedule.groupNotice')}
          >
            <IconHelperF className="helper-icon" />
          </Tooltip>
        </div>
      );
    };

    const hasGroupName = !isPrivate && changableGroupInfo?.name && !showGoogleSync;

    if (previewMode) {
      return (
        <div className="item">
          <div className="item-title">{i18n('schedule.attendee')}</div>
          <div
            className="hover"
            onClick={() => {
              setIsInAttendeeDetail(true);
              setDetailOpenType('attendee');
            }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              ...PREVIEW_ITEM_STYLE,
              height: hasGroupName ? '60px' : '40px',
            }}
          >
            <div style={{ maxWidth: '196px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <div>{items.length}</div>
                {renderInOutGroup()}
              </div>
              {hasGroupName ? (
                <div className="from-group">{`From group ${changableGroupInfo?.name}`}</div>
              ) : null}
            </div>
            <IconChevronRight style={{ color: 'var(--dsw-color-text-third)' }} />
          </div>
        </div>
      );
    }

    const renderEditAction = () => {
      if (isPreviewMode && !detail.canInvite) {
        return null;
      }

      return (
        <div className="edit-action" onClick={addAttendeeFromDialog}>
          <IconTablerPlus
            style={{
              width: '16px',
              height: '16px',
            }}
          />
          <span>Add</span>
        </div>
      );
    };

    return (
      <div className="item">
        <div className="item-title">{i18n('schedule.attendee')}</div>
        <div style={{ overflow: 'hidden' }}>
          {renderEditAction()}
          <Flex
            className="hover"
            onClick={() => {
              setIsInAttendeeDetail(true);
              setDetailOpenType('attendee');
            }}
            align="center"
            justify="space-between"
            style={{ cursor: 'pointer', padding: '2px 4px' }}
          >
            <div style={{ maxWidth: '220px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <div style={{ lineHeight: '20px' }}>{items.length}</div>
                {renderInOutGroup()}
              </div>
              {hasGroupName ? (
                <div className="from-group">{`From group ${changableGroupInfo?.name}`}</div>
              ) : null}
            </div>
            <IconChevronRight style={{ color: 'var(--dsw-color-text-third)' }} />
          </Flex>
        </div>
      </div>
    );
  };

  const renderGuest = () => {
    if (!isLiveStream) {
      return null;
    }
    // view
    if (previewMode) {
      if (!guestInfo || (!guestInfo.allStaff && guestInfo.users.length === 0)) {
        return null;
      }

      if (guestInfo.allStaff) {
        return (
          <>
            <div className="item">
              <div
                className="item-title"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '2px',
                  height: '40px',
                }}
              >
                <span>Guest</span>
                <Tooltip
                  mouseEnterDelay={0.2}
                  overlayClassName={'antd-tooltip-cover'}
                  placement="top"
                  title={i18n('schedule.guestsTip')}
                >
                  <IconHelperF className="helper-icon" onClick={stopClick} />
                </Tooltip>
              </div>
              <div style={{ ...PREVIEW_ITEM_STYLE }}>
                {i18n('schedule.allStaffNum', [guestInfo.total > 0 ? ` (${guestInfo.total})` : ''])}
              </div>
            </div>
          </>
        );
      }

      return (
        <div className="item">
          <div
            className="item-title"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: '2px',
              height: '40px',
            }}
          >
            <span>{i18n('schedule.guest')}</span>
            <Tooltip
              mouseEnterDelay={0.2}
              overlayClassName={'antd-tooltip-cover'}
              placement="top"
              title={i18n('schedule.guestsTip')}
            >
              <IconHelperF className="helper-icon" onClick={stopClick} />
            </Tooltip>
          </div>
          <div>
            <Flex
              className="hover"
              align="center"
              justify="space-between"
              style={{
                cursor: 'pointer',
                ...PREVIEW_ITEM_STYLE,
              }}
              onClick={() => {
                setIsInAttendeeDetail(true);
                setDetailOpenType('guest');
              }}
            >
              <div>{guestInfo.users.length}</div>
              <IconChevronRight style={{ color: 'var(--dsw-color-text-third)' }} />
            </Flex>
          </div>
        </div>
      );
    }

    const guestTipKey = isPreviewMode
      ? 'schedule.updateStaffTipWithTotal'
      : 'schedule.allStaffTipWithTotal';

    // edit
    return (
      <div className="item">
        <div
          className="item-title"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: '2px',
            height: '40px',
          }}
        >
          <span>Guest</span>
          <Tooltip
            mouseEnterDelay={0.2}
            overlayClassName={'antd-tooltip-cover'}
            placement="top"
            title={i18n('schedule.guestsTip')}
          >
            <IconHelperF className="helper-icon" onClick={stopClick} />
          </Tooltip>
        </div>
        <div style={{ maxWidth: '248px' }}>
          <Select
            onSelect={value => {
              if (value === 'allStaff') {
                setGuestInfo(info => ({
                  ...info,
                  allStaff: true,
                }));
                fetchMyOrgInfo();
              } else {
                setGuestInfo(info => ({
                  ...info,
                  allStaff: false,
                }));
                addGuestFromDialog();
              }
            }}
            disabled={canNotEdit}
            variant="outlined"
            size="large"
            value={guestInfo.allStaff ? 'allStaff' : 'selectedGuest'}
            options={[
              {
                label: `All staff${guestInfo.total > 0 ? ` (${guestInfo.total})` : ''}`,
                value: 'allStaff',
              },
              {
                label: 'Select guests',
                value: 'selectedGuest',
              },
            ]}
            popupClassName="schedule-selector"
            virtual={false}
          />
          {!guestInfo.allStaff && guestInfo.users.length > 0 ? (
            <Flex
              className="hover"
              justify="space-between"
              align="center"
              style={{
                cursor: 'pointer',
                padding: '2px 4px',
                marginTop: '8px',
              }}
              onClick={() => {
                setDetailOpenType('guest');
                setIsInAttendeeDetail(true);
              }}
            >
              <span>{guestInfo.users.length}</span>
              <IconChevronRight style={{ color: 'var(--dsw-color-text-third)' }} />
            </Flex>
          ) : null}
          {guestInfo.allStaff ? (
            <div
              className="dsw-shared-typography-p4"
              style={{
                color: 'var(--dsw-color-text-third)',
                marginTop: '10px',
              }}
            >
              {guestInfo.total > 0
                ? i18n(guestTipKey, [`${guestInfo.total}`])
                : i18n(`schedule.allStaffTip`)}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderHost = () => {
    // view / update
    if (isPreviewMode && detail.host) {
      const getHostName = () => {
        if (detail.hostInfo?.uid && !isMatchUserId(detail.hostInfo.uid) && detail.hostInfo.name) {
          return detail.hostInfo.name;
        }

        const hostItem = items?.find(item => item.id === detail.host);

        if (hostItem?.name) {
          return cleanUserNameForDisplay(hostItem);
        }

        return cleanUserNameForDisplay(getUserBaseInfo(detail.host));
      };

      const renderCreator = (creator: { uid: string; name?: string }) => {
        if (creator.name) {
          return `Created by ${creator.name}`;
        }

        const creatorInfo = getUserBaseInfo(creator.uid);

        return `Created by ${creatorInfo?.name || creator.uid}`;
      };

      return (
        <>
          <div className="item">
            <div className="item-title">Host</div>
            <div
              className="ellipsis-1"
              style={{
                ...PREVIEW_ITEM_STYLE,
                ...(previewMode ? {} : { borderColor: 'var(--dsw-color-line)' }),
              }}
            >
              {getHostName()}
            </div>
          </div>
          {detail.creator?.uid && detail.creator?.uid !== detail.host ? (
            <div
              className="dsw-shared-typography-p4"
              style={{
                color: 'var(--dsw-color-text-third)',
                margin: '4px 0 4px 80px',
              }}
            >
              {renderCreator(detail.creator)}
            </div>
          ) : null}
        </>
      );
    }

    // create
    if (!isPreviewMode) {
      const hostOptions = calendarList.filter(Boolean).map(cItem => {
        const item = getUserBaseInfo(cid2uid(cItem.cid));
        return {
          label: cItem.name || cleanUserNameForDisplay(item),
          value: cItem.cid,
        };
      });

      const setNewItems = (cid: string) => (items: any[]) => {
        const curUid = cid2uid(cid);
        const groupMembers = groupInfo?.gid ? (getUserBaseInfo(groupInfo.gid)?.members ?? []) : [];

        const isGroupUser = !privateUserId && groupMembers.includes(curUid);

        const calendarUser = {
          ...getUserBaseInfo(curUid),
          isRemovable: false,
          isGroupUser,
        };
        const newItems = uniqBy([calendarUser, ...items], 'id');

        if (privateUserId) {
          const privateTwoUser =
            privateUserId === curUid ? [ourNumber, privateUserId] : [curUid, privateUserId];

          return newItems
            .filter(item => privateTwoUser.includes(item.id))
            .map(item => ({
              ...item,
              isRemovable: item.id !== curUid,
            }));
        }

        return newItems.filter(item => {
          if (cid2uid(cid) === item.id) {
            return true;
          }
          const itemIsHost = hostOptions.some(o => cid2uid(o.value) === item.id);
          // 不是群成员则移除
          if (itemIsHost) {
            return groupMembers.includes(item.id);
          }

          return true;
        });
      };

      return (
        <div className="item">
          <div className="item-title">Host</div>
          <Select
            style={{ maxWidth: '248px' }}
            disabled={canNotEdit}
            variant="outlined"
            size="large"
            value={calendarId}
            onChange={cid => {
              setCalenderId(cid);
              setItems(setNewItems(cid));
            }}
            options={hostOptions}
            popupClassName="schedule-selector"
            virtual={false}
          />
        </div>
      );
    }

    return null;
  };

  const renderDesc = () => {
    if (previewMode) {
      if (!desc) {
        return null;
      }

      return (
        <div className="item">
          <div className="item-title">Desc.</div>
          <div
            style={{
              ...PREVIEW_ITEM_STYLE,
              wordBreak: 'break-word',
              marginBottom: '20px',
              minHeight: '40px',
              height: 'auto',
              whiteSpace: 'break-spaces',
            }}
          >
            <Linkify text={desc} getUrlCheckResult={() => ({ status: 1 })} i18n={i18n} />
          </div>
        </div>
      );
    }

    if (!isPreviewMode && !showMore) {
      return null;
    }

    if (isPreviewMode && canNotEdit && !desc) {
      return null;
    }

    return (
      <div className="item">
        <div className="item-title">Desc.</div>
        <div>
          <Input.TextArea
            disabled={canNotEdit}
            placeholder="Write some notes"
            maxLength={2000}
            value={desc}
            autoSize={{ minRows: 4 }}
            onChange={e => setDesc(e.target.value)}
          />
        </div>
      </div>
    );
  };

  const renderFileManager = () => {
    if (isPreviewMode) {
      // 预览模式
      if (previewMode) {
        if (!files.length) {
          return null;
        }

        return <ScheduleMeetingFileManager files={files} setFile={setFile} i18n={i18n} preview />;
      }

      // 编辑模式
      return (
        <ScheduleMeetingFileManager
          i18n={i18n}
          disabled={canNotEdit}
          files={files}
          setFile={setFile}
        />
      );
    }

    if (!showMore) return null;

    return <ScheduleMeetingFileManager i18n={i18n} files={files} setFile={setFile} />;
  };

  const renderPermit = () => {
    if (previewMode) {
      return null;
    }

    if (!isPreviewMode && !showMore) {
      return null;
    }

    const hostByOwner = !isPreviewMode ? true : detail?.host === cid2uid(detail.cid);

    return (
      <div className="item">
        <div className="item-title" style={{ lineHeight: '22px' }}>
          Setting
        </div>
        <Space direction="vertical" style={{ width: '100%' }} size={0}>
          {hostByOwner && (
            <>
              <Flex align="start" style={{ height: '32px' }}>
                <Checkbox
                  checked={meetingOption.everyoneCanModify}
                  onChange={setOptions('everyoneCanModify')}
                >
                  {i18n(
                    isLiveStream
                      ? 'schedule.liveModifyTip'
                      : isEvent
                        ? 'schedule.eventModifyTip'
                        : 'schedule.meetModifyTip'
                  )}
                  <Tooltip
                    mouseEnterDelay={0.2}
                    overlayClassName={'antd-tooltip-cover'}
                    placement="top"
                    title={i18n(
                      isLiveStream
                        ? 'schedule.liveModifyTipDetail'
                        : isEvent
                          ? 'schedule.eventModifyTipDetail'
                          : 'schedule.meetModifyTipDetail'
                    )}
                  >
                    <IconHelperF className="helper-icon" onClick={stopClick} />
                  </Tooltip>
                </Checkbox>
              </Flex>
              <Flex align="start" style={{ height: '32px' }}>
                <Checkbox
                  disabled={meetingOption.everyoneCanModify}
                  checked={meetingOption.everyoneCanInviteOthers}
                  onChange={setOptions('everyoneCanInviteOthers')}
                >
                  {isLiveStream ? `Attendee can invite others` : `Everyone can invite others `}
                  <Tooltip
                    mouseEnterDelay={0.2}
                    overlayClassName={'antd-tooltip-cover'}
                    placement="top"
                    title={i18n(
                      isLiveStream
                        ? 'schedule.liveUncheckTip'
                        : isEvent
                          ? 'schedule.eventUncheckTip'
                          : 'schedule.meetUncheckTip'
                    )}
                  >
                    <IconHelperF className="helper-icon" onClick={stopClick} />
                  </Tooltip>
                </Checkbox>
              </Flex>
            </>
          )}
          {googleSyncEnabled && !isLiveStream && showGoogleSyncOption && !isPreviewMode && (
            <Flex align="start" style={{ height: '32px' }}>
              <Checkbox checked={meetingOption.syncToGoogle} onChange={setOptions('syncToGoogle')}>
                {i18n('schedule.syncToGoogle')}
              </Checkbox>
            </Flex>
          )}
          {!isEvent && (
            <Flex align="center" style={{ height: '32px', marginTop: '-4px' }}>
              <Checkbox
                disabled={!hostByOwner && !meetingOption.everyoneCanModify}
                checked={meetingOption.timerOption.enabled}
                onChange={async e => {
                  const checked = e.target.checked;
                  let duration = meetingOption.timerOption.duration;
                  if (checked && !duration) {
                    duration = await getDefaultTimerInterval();
                  }
                  setMeetingOption(option => ({
                    ...option,
                    timerOption: {
                      enabled: checked,
                      duration,
                    },
                  }));
                }}
              >
                <Flex align="center">
                  <span>Enable timer{meetingOption.timerOption.enabled ? ':' : ''}</span>
                  {meetingOption.timerOption.enabled && (
                    <>
                      <InputNumber
                        disabled={!hostByOwner && !meetingOption.everyoneCanModify}
                        size="small"
                        className="custom-time-input small"
                        min={1}
                        max={60}
                        placeholder="1-60"
                        style={{
                          margin: '0 6px',
                          width: '48px',
                          height: '28px',
                          borderRadius: '6px',
                        }}
                        value={meetingOption.timerOption.duration}
                        onChange={value => {
                          if (value) {
                            setMeetingOption(option => ({
                              ...option,
                              timerOption: {
                                ...option.timerOption,
                                duration: value,
                              },
                            }));
                          }
                        }}
                        precision={0}
                        step={1}
                      />
                      <span>mins</span>
                    </>
                  )}
                  <Tooltip
                    mouseEnterDelay={0.2}
                    overlayClassName={'antd-tooltip-cover'}
                    placement="top"
                    title={'Start timer automatically when attendees unmute'}
                  >
                    <IconHelperF className="helper-icon" onClick={stopClick} />
                  </Tooltip>
                </Flex>
              </Checkbox>
            </Flex>
          )}
        </Space>
      </div>
    );
  };

  const renderViewSchedule = () => {
    if (canNotEdit || previewMode) {
      return null;
    }

    return (
      <div className="item">
        <div className="item-title" />
        <div
          className="text-button"
          onClick={() => {
            setIsViewSchedule(true);
          }}
        >
          {i18n('schedule.findATime')}
        </div>
      </div>
    );
  };

  const renderShowMoreButton = () => {
    if (isPreviewMode || showMore) {
      return null;
    }

    return (
      <div
        onClick={() => setShowMore(true)}
        style={{
          marginTop: '16px',
          color: 'var(--dsw-color-bg-primary)',
          cursor: 'pointer',
        }}
      >
        More
      </div>
    );
  };

  const renderGoToGoogle = () => {
    if (isPreviewMode || !showMore || isEvent || isLiveStream) {
      return null;
    }

    const goToGoogleCalendar = async () => {
      await goToGoogleMeeting({
        isPrivate,
        meetingName,
        channelName: props.channelName,
        i18n,
        members,
      });
    };

    return (
      <Button type="default" onClick={goToGoogleCalendar} style={{ marginTop: '12px' }}>
        To Google Calendar
      </Button>
    );
  };

  const renderBottomBtn = () => {
    if (previewMode) {
      const addToCalendarPermission = detail.permissions.viewMode.buttonAddLiveStream;
      const buttonEdit = detail.permissions.viewMode.buttonEdit;
      const buttonCopy = detail.permissions.viewMode.buttonCopy;
      const buttonCopyEvent = detail.permissions.viewMode.buttonDuplicate;
      const buttonTransfer = detail.permissions.viewMode.buttonTransferHost;
      const buttonCopyLiveStream = detail.permissions.viewMode.buttonCopyLiveStream;
      const buttonDelete = detail.permissions.viewMode.buttonDelete;
      const buttonJoin = detail.permissions.viewMode.buttonJoin;
      const editBtnDisabled = buttonEdit !== PERMISSION.ReadWrite;
      const showToggleGoingOrNot =
        detail.permissions.viewMode.toggleGoingOrNot === PERMISSION.ReadWrite;
      const showReceiveNotification =
        detail.permissions.viewMode.checkboxReceiveNotification !== PERMISSION.Hide;

      const toggleGoing = async (_going: GOING) => {
        if (goingBtnLoading.current) return;

        if (going === _going) {
          // setGoing(Going.MAYBE);
          return;
        }

        goingBtnLoading.current = true;

        let isAllEvent = false;

        if (detail.isRecurring) {
          const { ok, allEvent } = await openModal({
            title: i18n('schedule.RSVP'),
            okText: 'Yes',
            cancelText: 'No',
            isEvent,
          });

          if (!ok) {
            goingBtnLoading.current = false;

            return;
          }

          isAllEvent = allEvent!;
        }

        try {
          const res = await messaging.goingScheduleMeeting({
            eventId: detail.eid,
            calendarId: detail.cid,
            going: _going,
            isRecurring: detail.isRecurring,
            isAllEvent,
          });

          if (res.status === 0) {
            if (
              _going === GOING.YES &&
              detail.permissions?.viewMode.checkboxReceiveNotification === PERMISSION.ReadOnly
            ) {
            }
            setGoing(_going);
            setReceiveNotification(_going === GOING.YES);
            goingBtnLoading.current = false;
            toastSuccess(
              `Respond "${_going == GOING.YES ? 'Yes' : 'No'}" to "${_meetingName || 'No topic'}"`
            );
          } else {
            res.reason && toastError(res.reason);
            throw Error(res.reason);
          }
        } catch (error) {
          goingBtnLoading.current = false;
          console.log('set going error', error);
        }
      };

      const toggleReceiveNotify = async (e: any) => {
        if (going === GOING.NO) {
          return;
        }

        if (receiveLoading.current) return;

        const receiveNotification = e.target.checked;

        receiveLoading.current = true;

        let isAllEvent = false;
        if (detail?.isRecurring) {
          const { ok, allEvent } = await openModal({
            title: i18n('schedule.updateDetail'),
            okText: 'Yes',
            cancelText: 'No',
            isEvent,
          });
          if (!ok) {
            receiveLoading.current = false;
            return;
          }
          if (allEvent) {
            isAllEvent = true;
          }
        }

        try {
          const res = await messaging.scheduleMeetingReceiveNotify({
            isRecurring: detail.isRecurring,
            eventId: detail.eid,
            calendarId: detail.cid,
            receiveNotification,
            isAllEvent,
          });

          if (res.status === 0) {
            receiveLoading.current = false;
          } else {
            throw Error(`${res.status}__${res.reason}`);
          }
        } catch (error) {
          receiveLoading.current = false;
          console.log('set receive notify error', error);
        }

        setReceiveNotification(receiveNotification);
      };

      const copyItem = async (action: 'copy' | 'share') => {
        try {
          const res = await messaging.copyScheduleMeetingInfo({
            eventId: detail.eid,
            calendarId: detail.cid,
            action,
          });

          const content = res?.data?.content;

          if (!content || res?.status !== 0) {
            throw Error(res?.reason || res?.status);
          }

          if (action == 'share') {
            showForwardModal({
              list: getConversations(),
              onConfirm: ({ selected }, close) => {
                sendToConversation(
                  selected.map(u => u.id),
                  { content }
                );
                close();
              },
            });
            return;
          }

          copyText(replaceMarkdownContent(content));
          toastSuccess(`Copied!`);
        } catch (error: any) {
          toastError(error?.message || `copy failed`);
        } finally {
          setOperateOpen(false);
        }
      };

      if (isLiveStream) {
        const renderLiveItem = () => {
          return (
            <div className="meeting-operate-list">
              {editBtnDisabled ? null : (
                <div
                  className="item"
                  onClick={() => {
                    setPreviewMode(false);
                  }}
                >
                  <IconEditF width={16} height={16} /> <span>Edit</span>
                </div>
              )}
              {buttonCopy === PERMISSION.ReadWrite ? (
                <div className="item" onClick={() => copyItem('copy')}>
                  <IconTablerCopy />
                  <span>{i18n('schedule.copyMeetingInfo')}</span>
                </div>
              ) : null}
              {buttonCopyLiveStream === PERMISSION.ReadWrite ? (
                <div className="item" onClick={() => copyItem('share')}>
                  <IconTablerForward width={16} height={16} />
                  <span>{i18n('schedule.shareLiveTo')}</span>
                </div>
              ) : null}

              {buttonCopyEvent === PERMISSION.ReadWrite ? (
                <div className="item" onClick={copyEvent}>
                  <IconCopyPlus style={{ width: '16px', height: '16px' }} />
                  <Flex vertical>
                    <span>{i18n('schedule.copyEvent')}</span>
                    <span
                      className="dsw-shared-typography-p4"
                      style={{
                        fontSize: '10px',
                        color: `var(--dsw-color-text-third)`,
                      }}
                    >
                      {i18n('schedule.copyEventSubtitle', [
                        isLiveStream ? 'Live' : isEvent ? 'Event' : 'Meeting',
                      ])}
                    </span>
                  </Flex>
                </div>
              ) : null}

              {buttonTransfer === PERMISSION.ReadWrite ? (
                <div
                  className="item"
                  onClick={() => {
                    showTransferScheduleDialog();
                    setOperateOpen(false);
                  }}
                >
                  <IconTablerTransfer style={{ width: '16px', height: '16px' }} />
                  <span>{i18n('schedule.transfer')}</span>
                </div>
              ) : null}

              {buttonDelete === PERMISSION.ReadWrite ? (
                <div className="item" onClick={deleteMeeting}>
                  <IconDeleteF width={16} height={16} />
                  <span>Cancel</span>
                </div>
              ) : null}
            </div>
          );
        };

        if (addToCalendarPermission !== PERMISSION.Hide) {
          const addToCalendar = async () => {
            try {
              if (postLoading) {
                return;
              }
              setPostLoading(true);

              const res = await messaging.addLiveStreamToCalendar({
                eid: detail.eid,
              });

              if (res.status !== 0) {
                toastError(res.reason || 'operate failed!');
              } else {
                toastSuccess('operate success!');
                onClose();
              }
            } catch (e) {
              toastError('operate failed!');
              console.log('add live stream to calendar error', e);
            } finally {
              setPostLoading(false);
            }
          };

          return (
            <div className={classNames('save-btn-wrapper')}>
              <div className="edit-wrapper">
                <Button
                  style={{ flexGrow: 1 }}
                  loading={postLoading}
                  disabled={addToCalendarPermission === PERMISSION.ReadOnly}
                  size="large"
                  type="primary"
                  onClick={addToCalendar}
                >
                  {i18n('schedule.addToCalendar')}
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div className="save-btn-wrapper">
            <div className="edit-wrapper">
              {buttonJoin === PERMISSION.ReadWrite ? (
                <Button
                  type="primary"
                  className="edit-btn"
                  size="large"
                  onClick={e => joinMeeting(e, detail)}
                >
                  Join
                </Button>
              ) : (
                <div className="going-wrapper">
                  {showToggleGoingOrNot ? (
                    <>
                      <div>Attend?&nbsp;&nbsp;</div>
                      <div
                        className={classNames('going-btn', {
                          active: going === GOING.YES,
                        })}
                        onClick={() => toggleGoing(GOING.YES)}
                      >
                        {GOING.YES}
                      </div>
                      <div>&nbsp;/&nbsp;</div>
                      <div
                        className={classNames('going-btn', {
                          active: going === GOING.NO,
                        })}
                        style={{ marginRight: '20px' }}
                        onClick={() => toggleGoing(GOING.NO)}
                      >
                        {GOING.NO}
                      </div>
                    </>
                  ) : null}
                  {showReceiveNotification ? (
                    <Checkbox
                      disabled={
                        going === GOING.NO ||
                        detail.permissions?.viewMode.checkboxReceiveNotification ===
                          PERMISSION.ReadOnly
                      }
                      checked={going === GOING.NO ? false : receiveNotification}
                      onChange={toggleReceiveNotify}
                    >
                      <span>Notification</span>
                      <Tooltip
                        mouseEnterDelay={0.2}
                        overlayClassName={'antd-tooltip-cover antd-tooltip-cover-left'}
                        placement="top"
                        title={
                          <span style={{ display: 'block', paddingLeft: '8px' }}>
                            {i18n('schedule.notificationTipTitle')}
                            <br />
                            {i18n('schedule.notificationTipLive1')}
                            <br />
                            {i18n('schedule.notificationTipLive2')}
                            <br />
                            {i18n('schedule.notificationTipLive3')}
                          </span>
                        }
                      >
                        <IconHelperF className="helper-icon" onClick={stopClick} />
                      </Tooltip>
                    </Checkbox>
                  ) : null}
                </div>
              )}
              <Popover
                open={operateOpen}
                onOpenChange={setOperateOpen}
                trigger="click"
                arrow={false}
                content={renderLiveItem()}
                style={{ cursor: 'pointer' }}
                placement="topLeft"
                overlayStyle={{ width: '220px' }}
                overlayInnerStyle={POPOVER_INNER_STYLE}
              >
                <IconTablerDots
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                  }}
                />
              </Popover>
            </div>
          </div>
        );
      }

      const renderContent = () => {
        const getCopySubtitle = () => {
          if (!detail.channelName) {
            if (detail.googleMeetingLink) {
              return i18n('schedule.fromGoogle');
            }
            if (detail.outlookMeetingLink) {
              return i18n('schedule.fromOutlook');
            }
          }
          return i18n('schedule.externalOnly');
        };
        return (
          <div className="meeting-operate-list">
            {editBtnDisabled ? null : (
              <div
                className="item"
                onClick={() => {
                  setPreviewMode(false);
                }}
              >
                <IconEditF width={16} height={16} />
                <span>{i18n('schedule.edit')}</span>
              </div>
            )}
            {buttonCopy === PERMISSION.ReadWrite ? (
              <div className="item" onClick={() => copyItem('copy')}>
                <IconTablerCopy />
                <Flex vertical>
                  <span>{i18n('schedule.copyMeetingInfo')}</span>
                  <span
                    className="dsw-shared-typography-p4"
                    style={{
                      fontSize: '10px',
                      color: `var(--dsw-color-text-third)`,
                    }}
                  >
                    {getCopySubtitle()}
                  </span>
                </Flex>
              </div>
            ) : null}
            {buttonCopyEvent === PERMISSION.ReadWrite ? (
              <div className="item" onClick={copyEvent}>
                <IconCopyPlus style={{ width: '16px', height: '16px' }} />
                <Flex vertical>
                  <span>{i18n('schedule.copyEvent')}</span>
                  <span
                    className="dsw-shared-typography-p4"
                    style={{
                      fontSize: '10px',
                      color: `var(--dsw-color-text-third)`,
                    }}
                  >
                    {i18n('schedule.copyEventSubtitle', [
                      isLiveStream ? 'Live' : isEvent ? 'Event' : 'Meeting',
                    ])}
                  </span>
                </Flex>
              </div>
            ) : null}
            {buttonTransfer === PERMISSION.ReadWrite ? (
              <div
                className="item"
                onClick={() => {
                  showTransferScheduleDialog();
                  setOperateOpen(false);
                }}
              >
                <IconTablerTransfer style={{ width: '16px', height: '16px' }} />
                <span>{i18n('schedule.transfer')}</span>
              </div>
            ) : null}
            {buttonDelete === PERMISSION.ReadWrite ? (
              <div className="item" onClick={deleteMeeting}>
                <IconDeleteF width={16} height={16} />
                <span>{i18n('schedule.cancel')}</span>
              </div>
            ) : null}
          </div>
        );
      };

      return (
        <div className="save-btn-wrapper">
          <div className="edit-wrapper">
            {buttonJoin === PERMISSION.ReadWrite ? (
              <Button
                type="primary"
                className="edit-btn"
                size="large"
                onClick={e => joinMeeting(e, detail)}
              >
                Join
              </Button>
            ) : (
              <div className="going-wrapper">
                {showToggleGoingOrNot ? (
                  <>
                    <div>Attend?&nbsp;&nbsp;</div>
                    <div
                      className={classNames('going-btn', {
                        active: going === GOING.YES,
                      })}
                      onClick={() => toggleGoing(GOING.YES)}
                    >
                      {GOING.YES}
                    </div>
                    <div>&nbsp;/&nbsp;</div>
                    <div
                      className={classNames('going-btn', {
                        active: going === GOING.NO,
                      })}
                      style={{ marginRight: '20px' }}
                      onClick={() => toggleGoing(GOING.NO)}
                    >
                      {GOING.NO}
                    </div>
                  </>
                ) : null}
                {showReceiveNotification ? (
                  <Checkbox
                    disabled={going === GOING.NO}
                    checked={going === GOING.NO ? false : receiveNotification}
                    onChange={toggleReceiveNotify}
                  >
                    Notification
                    <Tooltip
                      mouseEnterDelay={0.2}
                      overlayClassName={'antd-tooltip-cover antd-tooltip-cover-left'}
                      placement="top"
                      title={
                        <span style={{ display: 'block', paddingLeft: '8px' }}>
                          {isEvent ? (
                            i18n('schedule.notificationTipEvent')
                          ) : (
                            <>
                              {i18n('schedule.notificationTipTitle')}
                              <br />
                              {i18n('schedule.notificationTipMeet1')}
                              <br />
                              {i18n('schedule.notificationTipMeet2')}
                              <br />
                              {i18n('schedule.notificationTipMeet3')}
                            </>
                          )}
                        </span>
                      }
                    >
                      <IconHelperF className="helper-icon" onClick={stopClick} />
                    </Tooltip>
                  </Checkbox>
                ) : null}
              </div>
            )}
            <Popover
              open={operateOpen}
              onOpenChange={setOperateOpen}
              trigger="click"
              arrow={false}
              content={renderContent()}
              style={{ cursor: 'pointer' }}
              placement="topLeft"
              overlayStyle={{ width: '220px' }}
              overlayInnerStyle={POPOVER_INNER_STYLE}
            >
              <IconTablerDots
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                }}
              />
            </Popover>
          </div>
        </div>
      );
    }

    const getBtnDisabled = () => items.length === 0 || !date || !time;

    return (
      <div
        className={classNames('save-btn-wrapper', {
          'save-btn-wrapper-google': !isPreviewMode,
        })}
      >
        <Button
          loading={postLoading}
          disabled={getBtnDisabled()}
          size="large"
          type="primary"
          onClick={createOrUpdateMeeting}
        >
          {isPreviewMode ? 'Update' : 'Schedule'}
        </Button>
      </div>
    );
  };

  const renderInDetailList = () => {
    if (detailOpenType === 'guest' && guestInfo.users.length) {
      return (
        <>
          <div
            className="dsw-shared-typography-p4"
            style={{
              color: 'var(--dsw-color-text-third)',
              margin: '10px 16px 4px 16px',
            }}
          >
            {i18n('schedule.guestsTip')}
          </div>
          <UserList
            ourNumber={ourNumber}
            onDelete={id => {
              const newList = guestInfo.users.filter(itemId => itemId !== id);

              if (!newList.length) {
                setIsInAttendeeDetail(false);
                setDetailOpenType('attendee');
              }

              setGuestInfo(info => ({
                ...info,
                users: newList,
              }));
            }}
            type={isPreviewMode && previewMode ? 'preview' : 'create'}
            host={isPreviewMode ? detail.host : cid2uid(calendarId)}
            i18n={i18n}
            list={guestInfo.users.map(id => ({
              ...getUserBaseInfo(id),
              isRemovable: true,
            }))}
            itemStyle={{
              padding: '12px 16px',
            }}
            style={{ flexGrow: 1, flexShrink: 0 }}
          />
        </>
      );
    }

    const [inGroup, outGroup] = items
      .reduce(
        (sum, item) => {
          if (isPrivate || isLiveStream || item.isGroupUser || showGoogleSync) {
            sum[0].push(item);
          } else {
            sum[1].push(item);
          }

          return sum;
        },
        [[], []]
      )
      .map(sortUserList);

    const outHeight = outGroup?.length
      ? Math.min(outGroup.length * 60, window.innerHeight / 2 - 74)
      : 0;

    const userListType = isPreviewMode && previewMode ? 'preview' : 'create';

    return (
      <>
        {isPrivate || isLiveStream || showGoogleSync ? null : (
          <>
            <div className="memeber-change-tip">
              <div>{i18n('schedule.groupMeetingTip')}</div>
              <div className="second">
                <span>change</span>
                <Tooltip
                  mouseEnterDelay={0.2}
                  overlayClassName={'antd-tooltip-cover'}
                  placement="top"
                  title={i18n('schedule.groupMeetingTipDetail')}
                >
                  <IconHelperF className="helper-icon" onClick={stopClick} />
                </Tooltip>
              </div>
            </div>
          </>
        )}
        {outGroup?.length > 0 ? (
          <>
            <div className="group-tip">{`${outGroup.length} Out of Group`}</div>
            <UserList
              ourNumber={ourNumber}
              type={userListType}
              host={isPreviewMode ? detail.host : cid2uid(calendarId)}
              i18n={i18n}
              list={outGroup}
              style={{ height: outHeight }}
              onDelete={onDeleteUser}
              itemStyle={{
                padding: '12px 16px',
              }}
            />
          </>
        ) : null}
        {isPrivate || isLiveStream || showGoogleSync ? null : (
          <div className="group-tip">
            <span style={{ flexShrink: 0 }}>{`${inGroup.length} In Group`}</span>
            {changableGroupInfo.name ? (
              <div className="ellipsis">
                <span>&nbsp;{`- ${changableGroupInfo.name}`}</span>
              </div>
            ) : null}
          </div>
        )}
        <UserList
          ourNumber={ourNumber}
          onDelete={onDeleteUser}
          type={isPreviewMode && previewMode ? 'preview' : 'create'}
          host={isPreviewMode ? detail.host : cid2uid(calendarId)}
          i18n={i18n}
          list={inGroup}
          itemStyle={{
            padding: '12px 16px',
          }}
          style={{ flexGrow: 1, flexShrink: 0 }}
        />
      </>
    );
  };

  const createOrUpdateMeeting = async () => {
    if (postLoading) {
      return;
    }

    const buildRRule = (repeat: string) => {
      if (repeat === 'Never') {
        return null;
      }

      return {
        rrule: repeat,
      };
    };

    const formatTZ = (tz = '') => {
      try {
        tz = tz.trim();
        if (!tz) {
          return '';
        }

        const num = tz.startsWith('+') || tz.startsWith('-') ? tz.slice(1) : tz;
        let digital: number | string = Number(num) - Math.floor(Number(num));

        if (Number.isNaN(digital)) {
          throw Error();
        }

        digital = `00${Math.round(60 * digital)}`.slice(-2);

        return `${tz.split('.')[0]}:${digital}`;
      } catch (error) {
        console.log('[timezone format error]', tz);
        return tz;
      }
    };

    try {
      if (!date || !time) {
        return;
      }

      let start = timerPickerRef.current?.getStartTimestamp(date, time);
      if (!start) {
        start = detail.start;
      }
      let end = start! + Math.round(duration) * 60;

      let allDayStart = null;
      let allDayEnd = null;

      if (isEvent && isAllDay) {
        const startDay = date.startOf('day');
        const days = Math.round(duration / 1440);
        allDayStart = startDay.format('YYYYMMDD');
        allDayEnd = startDay.add(days, 'days').format('YYYYMMDD');
        start = startDay.unix();
        end = startDay
          .add(Math.max(days - 1, 0), 'days')
          .endOf('day')
          .unix();
      }

      if (!isEvent && start! * 1000 < Date.now()) {
        toastError('The start time cannot be earlier than current time. Please select again.');

        return;
      }

      setPostLoading(true);

      // validUser must equal false
      const notValidUser = items.filter(
        item => item.validUser === false && item.email?.includes('@')
      );

      const showUsers = notValidUser.slice(0, 5);

      if (notValidUser.length) {
        const { ok: stillPost } = await openModal({
          title: (
            <div>
              The following attendee(s) are from outside your organization:
              {showUsers.map(item => (
                <span key={item.email} style={{ color: 'var(--dsw-color-bg-primary)' }}>
                  {' ' + item.email}
                </span>
              ))}
              {notValidUser.length > 5 ? ' etc. ' : ' '}
              Will send invitation emails to external attendees.
            </div>
          ),
          okText: 'Got it',
          cancelText: ' Continue editing',
          hideRadio: true,
        });
        if (!stillPost) {
          setPostLoading(false);
          return;
        }
      }

      // Create Mode
      if (!isPreviewMode) {
        const STEPS = [
          {
            api: () =>
              messaging.scheduleMeetingGetFreeTime({
                start,
                end,
                uid: cid2uid(calendarId) || ourNumber,
              }),
            modalParam: {
              title: 'There is already an event at the time. Are you sure to continue?',
            },
          },
        ];

        if (!isPrivate) {
          STEPS.unshift({
            api: () =>
              messaging.scheduleMeetingGetGroupFreeTime({
                start,
                end,
                gid: changableGroupInfo.gid,
              }),
            modalParam: {
              title:
                'There is already an event FROM THIS GROUP at the time. Are you sure to continue?',
            },
          });
        }

        const shouldAlert = (res: any) => res?.status === 0 && res.data?.freebusy === 'busy';

        for (let { api, modalParam } of STEPS) {
          const freebusyRes = await api().catch(() => ({ status: -1 }));
          // 找到一个需要弹窗就 break
          if (shouldAlert(freebusyRes)) {
            const { ok: stillPost } = await openModal({
              okText: 'Yes',
              cancelText: 'No',
              hideRadio: true,
              ...modalParam,
            });
            if (!stillPost) {
              setPostLoading(false);
              return;
            }

            break;
          }
        }
      }

      const getAttendees = () => {
        // 更新
        if (isPreviewMode) {
          return items.map(item => ({
            uid: item.extUser && item.email ? '' : item.id,
            name: item.name,
            email: item.email || '',
            role: item.role || 'attendee',
            going: item.going || 'maybe',
            isGroupUser: item.isGroupUser,
          }));
        }

        // create
        return items
          .filter((u: any) => {
            if (isPrivate) {
              return true;
            }

            return u.isRemovable;
          })
          .map((item: any) => {
            return {
              uid: item.extUser && item.email ? '' : item.id,
              name: item.name,
              email: item.email || '',
              role: item.id === ourNumber ? 'host' : 'attendee',
            };
          });
      };

      let defaultTimeZone = formatTZ(my?.timeZone || '+8.00');

      let guestsPayload = {};
      if (isLiveStream) {
        const guests = guestInfo.allStaff ? { allStaff: true, users: [] } : guestInfo;

        guestsPayload = { guests };
      }

      const isMyCalendar = calendarId === uid2cid(ourNumber);

      const { timerOption, ...rest } = meetingOption;
      const speechTimerOption = {
        speechTimerEnabled: timerOption.enabled,
        ...(timerOption.enabled
          ? {
              speechTimer: {
                duration: Math.round(timerOption.duration || 2) * 60,
              },
            }
          : {}),
      };

      let postData: any = {
        topic: _meetingName,
        description: desc || '',
        start,
        end,
        allDayStart,
        allDayEnd,
        timezone: isMyCalendar ? dayjs.tz.guess() : timeZone || defaultTimeZone,
        calendarId: isMyCalendar ? 'default' : calendarId,
        // only use in event
        isAllDay: isEvent && isAllDay,
        isRecurring: repeat !== 'Never',
        recurringRule: buildRRule(repeat),
        host: isPreviewMode ? detail.host : cid2uid(calendarId),
        attendees: getAttendees(),
        isGroup: !isPrivate && !isLiveStream,
        group: isPrivate || isLiveStream ? null : changableGroupInfo,
        attachment: files,
        ...rest,
        isLiveStream,
        category: isEvent ? 'event' : 'meeting',
        ...guestsPayload,
        ...speechTimerOption,
      };

      if (isPreviewMode) {
        let isAllEvent = false;
        // 周期会议
        if (detail.isRecurring) {
          // 周期是否改变
          const isRepeatChanged = repeat !== detail.recurringRule?.rrule;

          if (!isRepeatChanged) {
            // 未改变周期: 弹窗
            const { ok, allEvent } = await openModal({
              title: i18n(isEvent ? 'schedule.updateEventDetail' : 'schedule.updateDetail'),
              isEvent,
              okText: 'Yes',
              cancelText: 'No',
            });
            if (!ok) {
              setPostLoading(false);
              return;
            }
            isAllEvent = allEvent!;
          } else {
            // 改变周期: 直接设置 isAllEvent
            isAllEvent = true;
          }
        }
        postData.syncToGoogle = detail.source === 'google';

        postData = {
          event: postData,
          isRecurring: detail.isRecurring,
          isAllEvent,
          eventId: detail.eid,
          calendarId: detail.cid || 'default',
        };
      }

      console.log('postData', postData);

      const res = isPreviewMode
        ? await messaging.updateMeetingSchedule(postData)
        : await messaging.createMeetingSchedule(postData);

      if (res?.status !== 0) {
        throw Error(res?.reason);
      }

      if (res?.reason && res.reason !== 'success') {
        toastWarning(res.reason);
      } else {
        toastSuccess(
          `${isPreviewMode ? 'update' : 'create'} ${
            isLiveStream ? 'livestream' : isEvent ? 'event' : 'meeting'
          } successfully!`
        );
      }

      setPostLoading(false);
      onClose();
    } catch (error: any) {
      setPostLoading(false);
      toastError(error?.message || 'network error');
    }
  };

  const renderLoading = () => (
    <div className="loading-wrapper" style={{ left: '2px' }}>
      <div className="waiting" style={{ width: 40, height: 40, margin: 10 }} />
    </div>
  );

  const onConfirmAddMember = ({ newMembers }: { newMembers: any[] }) => {
    setItems(items =>
      uniqBy(
        [
          ...items,
          ...newMembers.map(member => {
            const isGroupUser = membersMap.current.has(member.id);
            return {
              ...member,
              isGroupUser,
              isRemovable: !isGroupUser,
            };
          }),
        ],
        'id'
      )
    );
  };

  return (
    <Drawer
      onClose={onClose}
      className={portalClass}
      style={{ borderLeft: '0.5px solid var(--dsw-color-line-1)' }}
    >
      <div
        className="meeting-schedule-dialog"
        style={isInAttendeeDetail || isViewSchedule ? { paddingBottom: 0 } : {}}
      >
        <ScheduleMeetingHeader
          isInAttendeeDetail={isInAttendeeDetail}
          isPreviewMode={isPreviewMode}
          previewMode={previewMode}
          total={items.length}
          guestTotal={guestInfo.users.length}
          setIsInAttendeeDetail={setIsInAttendeeDetail}
          detailOpenType={detailOpenType}
          onClose={onClose}
          isGroup={!isPrivate}
          isLiveStream={isLiveStream}
          isEvent={isEvent}
          onAddMember={
            detailOpenType === 'guest' && isLiveStream ? addGuestFromDialog : addAttendeeFromDialog
          }
          isViewSchedule={isViewSchedule}
          setIsViewSchedule={setIsViewSchedule}
          queryDate={queryDate}
          setQueryDate={setQueryDate}
          timeZone={timeZone}
        />
        {isViewSchedule ? (
          <div className="find-a-time-container">
            <ViewSchedule
              queryDate={queryDate}
              wantDate={wantDate}
              i18n={i18n}
              ourNumber={ourNumber}
              timeZone={timeZone}
              members={items}
              showMeetingAttendeeDialog={showMeetingAttendeeDialog}
              onConfirmAddMember={onConfirmAddMember}
              onConfirm={({ newWantDate }) => {
                unstable_batchedUpdates(() => {
                  const newDate = dayjs(newWantDate.start * 1000);
                  setIsViewSchedule(false);
                  setDate(newDate);
                  setTime(newDate);
                });
              }}
            />
          </div>
        ) : (
          <>
            <div
              className={classNames('meeting-main', {
                inDetail: isInAttendeeDetail,
                hideScrollBar: true,
                hasTooltip: showGoogleSync,
              })}
            >
              {loading && renderLoading()}
              {isInAttendeeDetail ? (
                renderInDetailList()
              ) : (
                <>
                  {renderMeetingTitle()}
                  {renderTimerPicker()}
                  {isEvent ? renderEventEnd() : renderDuration()}
                  {renderAttendees()}
                  {renderViewSchedule()}
                  {renderGuest()}
                  {renderHost()}
                  {renderRepeatOption()}
                  {renderFileManager()}
                  {renderDesc()}
                  {renderPermit()}
                  {renderShowMoreButton()}
                  {renderGoToGoogle()}
                  {!loading && renderBottomBtn()}
                </>
              )}
              <ScheduleMeetingCustomRepeatModal
                customRepeat={customRepeat}
                setCustomRepeat={setCustomRepeat}
                repeat={repeat}
                setRepeat={setRepeat}
                date={date}
              />
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
};
