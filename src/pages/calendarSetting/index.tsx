import React, { useEffect, useMemo, useState } from 'react';
import { Drawer, Flex, Switch } from 'antd';
import dayjs from 'dayjs';
import classNames from 'classnames';

import { IconChevronRight, IconCloseF, IconTablerPlus } from '@/shared/IconsNew';
import { toastError, toastSuccess } from '@/shared/Message';
import { useRadioModal } from '@/hooks/useRadioModal';
import { useTimeZoneDayjs } from '@/hooks/useTimeZoneDayjs';
import { uid2cid, getRealId } from '@/util';
import {
  deleteUserCalendar,
  updateUserCalendar,
  getProxyPermission,
  deleteProxyPermission,
} from '@/api';
import { ConfigProvider } from '@/shared';
import { useI18n } from '@/hooks/useI18n';

import {
  AddOtherForm,
  AddProxyForm,
  CalendarUserItem,
  IcsUploader,
  TimeZoneList,
} from './components';
import { getTimeZone, Step, CalendarSettingDialogProps, CalendarUserItemData } from './utils';

export const CalendarSettingDialog = ({
  open,
  onClose,
  myList,
  otherList,
  myId,
}: CalendarSettingDialogProps) => {
  const [step, setStep] = useState(Step.Main);
  const [myCalendars, setMyCalendars] = useState<CalendarUserItemData[]>([]);
  const [otherCalendars, setOtherCalendars] = useState<CalendarUserItemData[]>([]);
  const { openModal } = useRadioModal();
  const [proxyReqLoading, setProxyReqLoading] = useState(false);
  const [proxyList, setProxyList] = useState<CalendarUserItemData[]>([]);
  const {
    timeZone: myTimeZone,
    isSystemTimeZoneSwitchOn,
    setSystemTimeZoneSwitchOn,
  } = useTimeZoneDayjs();
  const { i18n } = useI18n();

  useEffect(() => {
    setMyCalendars(myList || []);
    setOtherCalendars(otherList || []);
  }, [myList, otherList, open]);

  useEffect(() => {
    if (!open) {
      setStep(Step.Main);
    }
  }, [open]);

  const titles = useMemo(
    () => [
      'Personalize',
      'My Calendars',
      'Other Calendars',
      'Subscribe Other Calendar',
      'Grant Management Permissions',
      'Grant Management Permissions',
      'Setting Time Zone',
      'Import ics',
    ],
    []
  );

  const openProxyPermission = () => {
    const proxyList = myList.filter(item => item.role === 'proxy');
    if (proxyList.length >= 10) {
      toastError('You can only proxy less than 10 user');
      return;
    }

    setStep(Step.AddProxy);
  };

  const confirmRemove = async (currentStep: Step) => {
    const StepMap = {
      [Step.My]: 'Once unlink, if you want to link again, you will need to reapply.',
      [Step.Other]: 'Confirm to delete?',
      [Step.Proxy]: 'Confirm to remove?',
      [Step.AddOther]: '',
      [Step.TimeZone]: '',
      [Step.UpdateIcs]: '',
      [Step.Main]: '',
    } as Record<Step, string>;
    return openModal({
      title: StepMap[currentStep] || 'Confirm to delete?',
      okText: 'Yes',
      cancelText: 'No',
      hideRadio: true,
    });
  };

  const handleRename = async (item: CalendarUserItemData, name: string, type: 'my' | 'other') => {
    try {
      await updateUserCalendar({
        cid: uid2cid(getRealId(item.id)),
        type: type === 'my' ? 'myCalendar' : 'otherCalendar',
        name: name || '',
      });
      if (type === 'my') {
        setMyCalendars(list =>
          list.map(target => (target.id === item.id ? { ...target, cname: name } : target))
        );
      } else {
        setOtherCalendars(list =>
          list.map(target => (target.id === item.id ? { ...target, cname: name } : target))
        );
      }
      toastSuccess('update calendar info successfully!');
    } catch (error: any) {
      toastError(error?.message || 'update calendar fail, try again later!');
    }
  };

  const handleRemove = async (item: CalendarUserItemData, type: 'my' | 'other' | 'proxy') => {
    const { ok } = await confirmRemove(
      type === 'my' ? Step.My : type === 'other' ? Step.Other : Step.Proxy
    );
    if (!ok) {
      return;
    }
    try {
      if (type === 'proxy') {
        await deleteProxyPermission(getRealId(item.id));
        toastSuccess('Removed!');
      } else {
        await deleteUserCalendar({
          type: type === 'my' ? 'myCalendar' : 'otherCalendar',
          cid: uid2cid(getRealId(item.id)),
        });
        toastSuccess(type === 'my' ? 'Unlinked' : 'Unsubscribed!');
      }
    } catch (error: any) {
      toastError(error?.message || 'remove failed!');
    }
  };

  const getPermission = async () => {
    if (proxyReqLoading) {
      return;
    }
    setProxyReqLoading(true);
    setStep(Step.Proxy);
    try {
      const data = await getProxyPermission('given');
      setProxyList(
        (data?.given || []).map(item => ({
          ...item,
          id: item.uid,
        }))
      );
    } catch (error) {
      console.log('query permission error', error);
    } finally {
      setProxyReqLoading(false);
    }
  };

  const renderList = () => {
    if (step === Step.Main) {
      const { timeZone, utcOffset } = getTimeZone(myTimeZone || dayjs.tz.guess());
      return (
        <div className="calendar-setting-list">
          <div className="calendar-setting-item clickable" onClick={() => setStep(Step.My)}>
            <span>My Calendars</span>
            <IconChevronRight />
          </div>
          <div className="calendar-setting-item clickable" onClick={() => setStep(Step.Other)}>
            <span>Other Calendars</span>
            <IconChevronRight />
          </div>
          <div className="calendar-setting-item clickable" onClick={getPermission}>
            <span>Grant Management Permissions</span>
            <IconChevronRight />
          </div>
          <div className="calendar-setting-divider" />
          <div className="calendar-setting-item">
            <Flex align="center" justify="space-between" style={{ width: '100%' }}>
              <div className="calendar-setting-item__title">
                Auto set Time Zone with Current Location
              </div>
              <Switch
                size="small"
                value={isSystemTimeZoneSwitchOn}
                onChange={setSystemTimeZoneSwitchOn}
              />
            </Flex>
          </div>
          <div className="calendar-setting-item calendar-setting-item--timezone">
            <Flex align="center" justify="space-between" style={{ width: '100%' }}>
              <div className="calendar-setting-item__title">Calendar Time Zone</div>
              {timeZone && (
                <Flex
                  align="center"
                  gap="2px"
                  className={classNames('calendar-setting-timezone', {
                    on: isSystemTimeZoneSwitchOn,
                  })}
                  onClick={() => {
                    if (!isSystemTimeZoneSwitchOn) {
                      setStep(Step.TimeZone);
                    }
                  }}
                >
                  <Flex className="timezone-text" gap={2}>
                    <span className="ellipsis-1">{timeZone}</span>
                    <span>({utcOffset})</span>
                  </Flex>
                  {!isSystemTimeZoneSwitchOn && <IconChevronRight />}
                </Flex>
              )}
            </Flex>
            {timeZone && timeZone !== dayjs.tz.guess() ? (
              <div className="calendar-setting-timezone-tip">
                Time on Calendar will show in the new time zone, then switch back to your local time
                zone in 5 mins.
              </div>
            ) : null}
          </div>
          <div className="calendar-setting-divider" />
          <div className="calendar-setting-item clickable" onClick={() => setStep(Step.UpdateIcs)}>
            <span>Import ics</span>
            <IconChevronRight />
          </div>
        </div>
      );
    }

    if (step === Step.My) {
      return (
        <div className="calendar-setting-users">
          {myCalendars.length === 0 ? (
            <div className="calendar-setting-empty">No calendars yet.</div>
          ) : (
            myCalendars.map(item => (
              <CalendarUserItem
                key={item.id}
                item={item}
                type="my"
                myId={myId}
                onRemove={target => handleRemove(target, 'my')}
              />
            ))
          )}
        </div>
      );
    }

    if (step === Step.Other) {
      return (
        <div className="calendar-setting-users">
          {otherCalendars.length === 0 ? (
            <div className="calendar-setting-empty">
              You have not subscribed to any calendars yet.
            </div>
          ) : (
            otherCalendars.map(item => (
              <CalendarUserItem
                key={item.id}
                item={item}
                type="other"
                myId={myId}
                onRename={(target, name) => handleRename(target, name, 'other')}
                onRemove={target => handleRemove(target, 'other')}
              />
            ))
          )}
        </div>
      );
    }

    if (step === Step.AddOther) {
      return (
        <AddOtherForm
          onSuccess={() => {
            setStep(Step.Other);
          }}
        />
      );
    }

    if (step === Step.TimeZone) {
      return <TimeZoneList onBack={() => setStep(Step.Main)} />;
    }

    if (step === Step.UpdateIcs) {
      return (
        <IcsUploader
          onSuccess={() => {
            setStep(Step.Main);
          }}
        />
      );
    }

    if (step === Step.Proxy) {
      return (
        <>
          <div
            className="dsw-shared-typography-p4"
            style={{
              color: 'var(--dsw-color-text-third)',
              margin: '10px 16px 4px 16px',
            }}
          >
            {proxyList.length > 0 ? i18n('calendarProxyTips') : i18n('calendarProxyEmptyTips')}
          </div>
          <div className="calendar-setting-users">
            {proxyList.length > 0 &&
              proxyList.map(item => (
                <CalendarUserItem
                  key={item.id}
                  item={item}
                  type="other"
                  myId={myId}
                  onRename={(target, name) => handleRename(target, name, 'other')}
                  onRemove={target => handleRemove(target, 'proxy')}
                />
              ))}
          </div>
        </>
      );
    }

    if (step === Step.AddProxy) {
      return <AddProxyForm setStep={setStep} onSuccess={getPermission} />;
    }

    return null;
  };

  const header = (
    <Flex align="center" justify="space-between" className="calendar-setting-header">
      <div className="calendar-setting-header__left">
        {step !== Step.Main &&
          step !== Step.AddOther &&
          step !== Step.AddProxy &&
          step !== Step.UpdateIcs &&
          step !== Step.My && (
            <IconTablerPlus
              onClick={
                step === Step.Proxy
                  ? openProxyPermission
                  : () => {
                      if (otherCalendars.length >= 10) {
                        toastError('You can only subscribe 10 calendars');
                        return;
                      }
                      setStep(Step.AddOther);
                    }
              }
            />
          )}
      </div>
      <span>{titles[step]}</span>
      <div className="calendar-setting-header__right">
        <IconCloseF onClick={onClose} className="calendar-setting-close" />
      </div>
    </Flex>
  );

  return (
    <ConfigProvider isLightlyDisableMode>
      <Drawer
        open={open}
        className="calendar-setting-drawer"
        closeIcon={false}
        width={360}
        title={header}
        onClose={onClose}
      >
        {renderList()}
      </Drawer>
    </ConfigProvider>
  );
};

export default CalendarSettingDialog;
