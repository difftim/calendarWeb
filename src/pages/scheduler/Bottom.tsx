import React, { useMemo, useRef, useState } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { Button, Checkbox, Flex, Popover, Tooltip } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';

import { userIdAtom } from '@/atoms';
import { Permission, showPannelAtom } from '@/atoms/detail';
import {
  IconCopyPlus,
  IconDeleteF,
  IconEditF,
  IconHelperF,
  IconTablerCopy,
  IconTablerDots,
  IconTablerForward,
  IconTablerTransfer,
} from '@/shared/IconsNew';
import { toastError, toastSuccess, toastWarning } from '@/shared/Message';
import { POPOVER_INNER_STYLE } from '@/constants';
import { useSetDetailData } from '@/hooks/useDetailData';
import {
  useCurrentTimeZone,
  useDetailDataValueWithTimeZone as useDetailData,
} from '@/hooks/useCurrentTimeZone';
import { useI18n } from '@/hooks/useI18n';
import { useRadioModal } from '@/hooks/useRadioModal';
import { cid2uid, copyText, formatTZ, stopClick, uid2cid } from '@/util';
import {
  addLiveStreamToCalendar,
  copyScheduleMeetingInfo,
  createMeetingSchedule,
  deleteMeetingSchedule,
  goingScheduleMeeting,
  scheduleMeetingGetFreeTime,
  scheduleMeetingGetGroupFreeTime,
  scheduleMeetingReceiveNotify,
  updateMeetingSchedule,
} from '@/api';

enum GOING {
  YES = 'yes',
  NO = 'no',
  MAYBE = 'maybe',
}

function Bottom() {
  const {
    mode,
    permissions,
    members,
    receiveNotification,
    googleMeetingLink,
    outlookMeetingLink,
    channelName,
    isLiveStream,
    isRecurring = false,
    isAllDay,
    start,
    duration = 30,
    host,
    category,
    calendarId,
    eid,
    going,
    topic,
    date,
    time,
    description,
    attachment = [],
    recurringRule,
    group,
    guests,
    source,
    syncToGoogle,
    everyoneCanModify,
    everyoneCanInviteOthers,
    speechTimerEnabled,
    speechTimerDuration,
  } = useDetailData();
  const { timeZone } = useCurrentTimeZone();
  const { i18n } = useI18n();
  const myId = useAtomValue(userIdAtom);
  const goingBtnLoading = useRef(false);
  const receiveLoading = useRef(false);
  const isEvent = category === 'event';
  const setShowPanel = useSetAtom(showPannelAtom);
  const setData = useSetDetailData();
  const { openModal } = useRadioModal();

  const [operateOpen, setOperateOpen] = useState(false);
  const [postLoading, setPostLoading] = useState(false);

  const radioModalTitle = useMemo(() => {
    const isHost = host === cid2uid(calendarId);
    if (isLiveStream) {
      return isHost ? i18n('schedule.cancelLive') : i18n('schedule.dontAttendLive');
    }
    if (isEvent) {
      if (isHost) {
        return isRecurring
          ? i18n('schedule.cancelRecurringEvent')
          : i18n('schedule.cancelSingleEvent');
      }
      return isRecurring
        ? i18n('schedule.dontAttentRecurringEvent')
        : i18n('schedule.dontAttentEvent');
    }
    if (isHost) {
      return isRecurring ? i18n('schedule.cancelRecurringMeet') : i18n('schedule.cancelSingleMeet');
    }
    return isRecurring ? i18n('schedule.dontAttentRecurringMeet') : i18n('schedule.dontAttentMeet');
  }, [isLiveStream, isEvent, host, isRecurring]);

  if (mode === 'view') {
    const { viewMode } = permissions!;
    const addToCalendarPermission = viewMode.buttonAddLiveStream;
    const buttonEdit = viewMode.buttonEdit!;
    const buttonCopy = viewMode.buttonCopy;
    const buttonCopyEvent = viewMode.buttonDuplicate;
    const buttonTransfer = viewMode.buttonTransferHost;
    const buttonCopyLiveStream = viewMode.buttonCopyLiveStream;
    const buttonDelete = viewMode.buttonDelete;
    const buttonJoin = viewMode.buttonJoin;

    const editBtnDisabled = buttonEdit !== Permission.ReadWrite;
    const showToggleGoingOrNot = viewMode.toggleGoingOrNot === Permission.ReadWrite;
    const showReceiveNotification = viewMode.checkboxReceiveNotification !== Permission.NONE;

    const toggleGoing = async (_going: GOING) => {
      if (goingBtnLoading.current) return;

      if (going === _going) {
        return;
      }

      goingBtnLoading.current = true;

      let isAllEvent = false;

      if (isRecurring) {
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
        await goingScheduleMeeting({
          eventId: eid,
          calendarId,
          going: _going,
          isRecurring: isRecurring,
          isAllEvent,
        });
        setData({ going: _going, receiveNotification: _going === GOING.YES });
        goingBtnLoading.current = false;
        toastSuccess(`Respond "${_going == GOING.YES ? 'Yes' : 'No'}" to "${topic || 'No topic'}"`);
      } catch (error: any) {
        toastError(error?.message || 'set going failed!');
        goingBtnLoading.current = false;
        console.log('set going error', error);
      }
    };

    const toggleReceiveNotify = async (e: any) => {
      if (going === GOING.NO || receiveLoading.current) {
        return;
      }
      const receiveNotification = e.target.checked;
      receiveLoading.current = true;
      let isAllEvent = false;
      if (isRecurring) {
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
        await scheduleMeetingReceiveNotify({
          isRecurring,
          eventId: eid,
          calendarId,
          receiveNotification,
          isAllEvent,
        });

        receiveLoading.current = false;
        setData({ receiveNotification });
      } catch (error: any) {
        receiveLoading.current = false;
        console.log('set receive notify error', error);
        toastError(error?.message || 'set receive notify failed!');
      }
    };

    const copyItem = async (action: 'copy' | 'share') => {
      try {
        const data = await copyScheduleMeetingInfo({
          eventId: eid,
          calendarId,
          action,
        });
        const content = data?.content;
        if (!content) {
          throw Error('copy failed');
        }
        if (action == 'share') {
          // TODO
          // showForwardModal({
          //   list: getConversations(),
          //   onConfirm: ({ selected }, close) => {
          //     sendToConversation(
          //       selected.map(u => u.id),
          //       { content }
          //     );
          //     close();
          //   },
          // });
          return;
        }
        await copyText(content);
        toastSuccess(`Copied!`);
      } catch (error: any) {
        toastError(error?.message || `copy failed`);
      } finally {
        setOperateOpen(false);
      }
    };

    const deleteMeeting = async () => {
      setOperateOpen(false);
      const { ok, allEvent } = await openModal({
        title: radioModalTitle,
        okText: 'Yes',
        cancelText: 'No',
        hideRadio: isRecurring,
        isEvent,
      });

      if (!ok) {
        return;
      }

      try {
        await deleteMeetingSchedule({
          isAllEvent: allEvent,
          isRecurring: isRecurring || false,
          eventId: eid,
          calendarId,
        });
        toastSuccess('Canceled!');
      } catch (error: any) {
        toastError(error?.message || 'cancel failed');
      } finally {
        setTimeout(() => {
          setShowPanel(false);
        }, 500);
      }
    };

    const renderContent = () => {
      const getCopySubtitle = () => {
        if (!channelName) {
          if (googleMeetingLink) {
            return i18n('schedule.fromGoogle');
          }
          if (outlookMeetingLink) {
            return i18n('schedule.fromOutlook');
          }
        }
        return i18n('schedule.externalOnly');
      };

      const copyEvent = () => {
        const now = Date.now();
        const newStart =
          (isAllDay && isEvent) || start * 1000 > now
            ? start
            : dayjs(Math.ceil(now / 600000) * 600000).unix();

        const newEnd = start + duration * 60;
        setData({
          mode: 'create',
          start: newStart,
          end: newEnd,
          date: dayjs(newStart * 1000),
          time: dayjs(newStart * 1000),
          host: myId,
          hostInfo: { uid: myId, name: myId },
        });
      };

      return (
        <div className="meeting-operate-list">
          {editBtnDisabled ? null : (
            <div className="item" onClick={() => setData({ mode: 'update' })}>
              <IconEditF width={16} height={16} />
              <span>{i18n('schedule.edit')}</span>
            </div>
          )}
          {buttonCopy === Permission.ReadWrite ? (
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
          {buttonCopyLiveStream === Permission.ReadWrite ? (
            <div className="item" onClick={() => copyItem('share')}>
              <IconTablerForward width={16} height={16} />
              <span>{i18n('schedule.shareLiveTo')}</span>
            </div>
          ) : null}

          {buttonCopyEvent === Permission.ReadWrite ? (
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
          {buttonTransfer === Permission.ReadWrite ? (
            <div
              className="item"
              onClick={() => {
                // showTransferScheduleDialog();
                setOperateOpen(false);
              }}
            >
              <IconTablerTransfer style={{ width: '16px', height: '16px' }} />
              <span>{i18n('schedule.transfer')}</span>
            </div>
          ) : null}
          {buttonDelete === Permission.ReadWrite ? (
            <div className="item" onClick={deleteMeeting}>
              <IconDeleteF width={16} height={16} />
              <span>{i18n('schedule.cancel')}</span>
            </div>
          ) : null}
        </div>
      );
    };

    const addToCalendar = async () => {
      try {
        if (postLoading) {
          return;
        }
        setPostLoading(true);
        await addLiveStreamToCalendar(eid!);
        toastSuccess('operate success!');
      } catch (e: any) {
        console.log('add live stream to calendar error', e);
        toastError(e?.message || 'operate failed!');
      } finally {
        setPostLoading(false);
      }
    };

    return (
      <div className="save-btn-wrapper">
        <div className="edit-wrapper">
          {isLiveStream && addToCalendarPermission !== Permission.NONE ? (
            <Button
              style={{ flexGrow: 1 }}
              loading={postLoading}
              disabled={addToCalendarPermission === Permission.ReadOnly}
              size="large"
              type="primary"
              onClick={addToCalendar}
            >
              {i18n('schedule.addToCalendar')}
            </Button>
          ) : null}
          {buttonJoin === Permission.ReadWrite ? (
            <Button
              type="primary"
              className="edit-btn"
              size="large"
              // onClick={e => joinMeeting(e, detail)}
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
                            {i18n(
                              isLiveStream
                                ? 'schedule.notificationTipLive1'
                                : 'schedule.notificationTipMeet1'
                            )}
                            <br />
                            {i18n(
                              isLiveStream
                                ? 'schedule.notificationTipLive2'
                                : 'schedule.notificationTipMeet2'
                            )}
                            <br />
                            {i18n(
                              isLiveStream
                                ? 'schedule.notificationTipLive3'
                                : 'schedule.notificationTipMeet3'
                            )}
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

  const createOrUpdateMeeting = async () => {
    if (postLoading) {
      return;
    }

    const buildRRule = (repeat?: string) => {
      if (!repeat || repeat === 'Never') {
        return null;
      }
      return {
        rrule: repeat,
      };
    };

    try {
      if (!date || !time) {
        return;
      }

      const getStartTimestamp = () => {
        if (!date || !time) {
          return null;
        }
        return date
          .set('hour', time.get('hour'))
          .set('minute', time.get('minute'))
          .set('second', 0)
          .set('millisecond', 0)
          .unix();
      };

      const repeat = recurringRule?.rrule || 'Never';
      const isUpdateMode = mode !== 'create';
      const isPrivate = !group?.gid;
      const attendeesSource = members || [];
      const meetingStart = getStartTimestamp();
      let startTime = meetingStart ?? start;
      let endTime = startTime + Math.round(duration) * 60;
      let allDayStart = null;
      let allDayEnd = null;

      if (isEvent && isAllDay) {
        const startDay = date.startOf('day');
        const days = Math.round(duration / 1440);
        allDayStart = startDay.format('YYYYMMDD');
        allDayEnd = startDay.add(days, 'days').format('YYYYMMDD');
        startTime = startDay.unix();
        endTime = startDay
          .add(Math.max(days - 1, 0), 'days')
          .endOf('day')
          .unix();
      }

      if (!isEvent && startTime * 1000 < Date.now()) {
        toastError('The start time cannot be earlier than current time. Please select again.');
        return;
      }

      setPostLoading(true);

      const notValidUser = attendeesSource.filter(
        (item: any) => item.validUser === false && item.email?.includes('@')
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
          cancelText: 'Continue editing',
          hideRadio: true,
        });
        if (!stillPost) {
          setPostLoading(false);
          return;
        }
      }

      if (!isUpdateMode) {
        const steps = [
          {
            api: () =>
              scheduleMeetingGetFreeTime({
                start: startTime,
                end: endTime,
                uid: cid2uid(calendarId) || myId,
              }),
            modalParam: {
              title: 'There is already an event at the time. Are you sure to continue?',
            },
          },
        ];

        if (!isPrivate && group?.gid) {
          steps.unshift({
            api: () =>
              scheduleMeetingGetGroupFreeTime({
                start: startTime,
                end: endTime,
                gid: group.gid,
              }),
            modalParam: {
              title:
                'There is already an event FROM THIS GROUP at the time. Are you sure to continue?',
            },
          });
        }

        for (const { api, modalParam } of steps) {
          const data = (await api().catch(() => ({}))) as { freebusy?: string };
          if (data?.freebusy === 'busy') {
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

      const hostUid = cid2uid(calendarId) || host;
      const getMemberUid = (item: any) => item.uid || item.id || '';
      const getAttendees = () => {
        if (isUpdateMode) {
          return attendeesSource.map(item => ({
            uid: getMemberUid(item),
            name: item.name,
            email: item.email || '',
            role: item.role || 'attendee',
            going: item.going || 'maybe',
            isGroupUser: item.isGroupUser,
          }));
        }
        return attendeesSource
          .filter(item => {
            if (isPrivate || isLiveStream) {
              return true;
            }
            return item.isRemovable;
          })
          .map(item => {
            const uid = getMemberUid(item);
            return {
              uid,
              name: item.name,
              email: item.email || '',
              role: uid === hostUid ? 'host' : 'attendee',
            };
          });
      };

      const defaultTimeZone = formatTZ(timeZone || '+8.00');
      const isMyCalendar = calendarId === uid2cid(myId);
      const normalizedGuests =
        isLiveStream && guests
          ? {
              ...guests,
              users: guests.allStaff ? [] : guests.users,
            }
          : null;
      const normalizedSpeechTimer = speechTimerEnabled
        ? { duration: Math.round(Number(speechTimerDuration) || 2 * 60) }
        : null;

      let postData: any = {
        topic,
        description: description || '',
        start: startTime,
        end: endTime,
        allDayStart,
        allDayEnd,
        timezone: isMyCalendar ? dayjs.tz.guess() : timeZone || defaultTimeZone,
        calendarId: isMyCalendar ? 'default' : calendarId,
        isAllDay: isEvent && isAllDay,
        isRecurring: repeat !== 'Never',
        recurringRule: buildRRule(repeat),
        host: hostUid,
        attendees: getAttendees(),
        isGroup: !isPrivate && !isLiveStream,
        group: !isPrivate && !isLiveStream ? group : null,
        attachment,
        category: isEvent ? 'event' : 'meeting',
        isLiveStream,
        receiveNotification,
        everyoneCanModify,
        everyoneCanInviteOthers,
        syncToGoogle,
        ...(isLiveStream ? { guests: normalizedGuests } : {}),
        speechTimerEnabled: Boolean(speechTimerEnabled),
        speechTimer: normalizedSpeechTimer,
      };

      if (isUpdateMode) {
        let isAllEvent = false;
        if (isRecurring) {
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
        }
        postData.syncToGoogle = source === 'google';
        postData = {
          event: postData,
          isRecurring,
          isAllEvent,
          eventId: eid,
          calendarId: calendarId || 'default',
        };
      }

      const res = isUpdateMode
        ? await updateMeetingSchedule(postData)
        : await createMeetingSchedule(postData);

      if (res?.status !== 0) {
        throw Error(res?.reason);
      }

      if (res?.reason && res.reason !== 'success') {
        toastWarning(res.reason);
      } else {
        toastSuccess(
          `${isUpdateMode ? 'update' : 'create'} ${
            isLiveStream ? 'livestream' : isEvent ? 'event' : 'meeting'
          } successfully!`
        );
      }

      setPostLoading(false);
      setShowPanel(false);
    } catch (error: any) {
      setPostLoading(false);
      toastError(error?.message || 'network error');
    }
  };

  const getBtnDisabled = () => members.length === 0 || !date || !time;

  return (
    <div
      className={classNames('save-btn-wrapper', {
        'save-btn-wrapper-google': mode === 'create',
      })}
    >
      <Button
        loading={postLoading}
        disabled={getBtnDisabled()}
        size="large"
        type="primary"
        onClick={createOrUpdateMeeting}
      >
        {mode === 'update' ? 'Update' : 'Schedule'}
      </Button>
    </div>
  );
}

export default Bottom;
