import {
  addLiveStreamToCalendar,
  copyScheduleMeetingInfo,
  deleteMeetingSchedule,
  goingScheduleMeeting,
  scheduleMeetingReceiveNotify,
} from '@/api';
import { userIdAtom } from '@/atoms';
import { Permission, showPannelAtom } from '@/atoms/detail';
import {
  IconCopyPlus,
  IconDeleteF,
  IconEditF,
  IconHelperF,
  IconTablerCopy,
  IconTablerDots,
  // IconTablerForward,
  IconTablerTransfer,
} from '@/components/shared/IconsNew';
import { toastError, toastSuccess } from '@/components/shared/Message';
import { POPOVER_INNER_STYLE } from '@/constants';
import { useDetailDataValue, useSetDetailData } from '@/hooks/useDetailData';
import { useI18n } from '@/hooks/useI18n';
import { useRadioModal } from '@/hooks/useRadioModal';
import { cid2uid, copyText, stopClick } from '@/util';
import { Button, Checkbox, Flex, Popover, Tooltip } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import { useAtomValue, useSetAtom } from 'jotai';
import React, { useMemo, useRef, useState } from 'react';

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
  } = useDetailDataValue();
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
    // const buttonCopyLiveStream = viewMode.buttonCopyLiveStream;
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
        const res = await goingScheduleMeeting({
          eventId: eid,
          calendarId,
          going: _going,
          isRecurring: isRecurring,
          isAllEvent,
        });

        if (res.status === 0) {
          setData({ going: _going, receiveNotification: _going === GOING.YES });
          goingBtnLoading.current = false;
          toastSuccess(
            `Respond "${_going == GOING.YES ? 'Yes' : 'No'}" to "${topic || 'No topic'}"`
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
        const res = await scheduleMeetingReceiveNotify({
          isRecurring,
          eventId: eid,
          calendarId,
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
      setData({ receiveNotification });
    };

    const copyItem = async (action: 'copy' | 'share') => {
      try {
        const res = await copyScheduleMeetingInfo({
          eventId: eid,
          calendarId,
          action,
        });

        const content = res?.data?.content;

        if (!content || res?.status !== 0) {
          throw Error(res?.reason || res?.status);
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
        const res = await deleteMeetingSchedule({
          isAllEvent: allEvent,
          isRecurring: isRecurring || false,
          eventId: eid,
          calendarId,
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
          {/* {buttonCopyLiveStream === Permission.ReadWrite ? (
              <div className="item" onClick={() => copyItem('share')}>
                <IconTablerForward width={16} height={16} />
                <span>{i18n('schedule.shareLiveTo')}</span>
              </div>
            ) : null} */}

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

        const res = await addLiveStreamToCalendar(eid!);

        if (res.status !== 0) {
          toastError(res.reason || 'operate failed!');
        } else {
          toastSuccess('operate success!');
          setShowPanel(false);
        }
      } catch (e) {
        toastError('operate failed!');
        console.log('add live stream to calendar error', e);
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

  const createOrUpdateMeeting = () => {};

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
