import React, { useEffect, useMemo, useState } from 'react';
import { AutoSizer, List as VList } from 'react-virtualized';
import { Drawer, Flex, Popover, Spin, Switch, Upload } from 'antd';
import dayjs from 'dayjs';
import classNames from 'classnames';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/shared/Button';
import Input from '@/shared/Input';
import SearchInput from '@/shared/Input/SearchInput';
import { ContactListItem } from '@/shared/ConversationItem';
import {
  IconBackF,
  IconChevronRight,
  IconCloseF,
  IconTablerInfoCircle,
  IconTablerLink,
  IconTablerPlus,
  TablerSearch,
} from '@/shared/IconsNew';
import { toastError, toastSuccess } from '@/shared/Message';
import { useRadioModal } from '@/hooks/useRadioModal';
import { useTimeZoneDayjs } from '@/hooks/useTimeZoneDayjs';
import { uid2cid } from '@/util';
import { addUserCalendar, deleteUserCalendar, updateUserCalendar, uploadIcsData } from '@/api';

enum Step {
  Main = 0,
  My = 1,
  Other = 2,
  AddOther = 3,
  TimeZone = 4,
  UpdateIcs = 5,
}

const isSearchMatchId = (id: string) => {
  return /^(\+)?\d{11}$/.test(id);
};

const getRealUid = (id = '') => {
  return String(id).startsWith('+') ? id : `+${id}`;
};

const getTimeZone = (tz: string) => {
  const offset = dayjs().tz(tz).utcOffset();
  return {
    timeZone: tz,
    utcOffset: `UTC${offset >= 0 ? '+' : '-'}${Math.abs(offset / 60)}`,
  };
};

const AddOtherForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [uid, setUid] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    try {
      const trimmed = uid.trim();
      if (!trimmed || loading) {
        return;
      }
      if (!isSearchMatchId(trimmed)) {
        toastError('uid format error');
        return;
      }
      setLoading(true);
      await addUserCalendar({
        cid: uid2cid(getRealUid(trimmed)),
        type: 'otherCalendar',
        name: name || '',
      });
      toastSuccess('subscribe successfully!');
      onSuccess();
    } catch (error: any) {
      toastError(error?.message || 'add calendar fail, try again later!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="calendar-setting-form">
      <div className="calendar-setting-form__label">
        <span className="required">*</span>Please enter the UID you want to subscribe:
      </div>
      <Input placeholder="e.g 71234567890" value={uid} onChange={e => setUid(e.target.value)} />
      <div className="calendar-setting-form__label">Name:</div>
      <Input
        placeholder="Enter a name"
        value={name}
        onChange={e => setName(e.target.value?.slice(0, 30) || '')}
      />
      <div className="calendar-setting-form__tip">
        <IconTablerInfoCircle />
        <span>
          After subscribing, you can conveniently and quickly check the calendar and availability
          status of this account.
        </span>
      </div>
      <div className="calendar-setting-form__footer">
        <Button size="large" disabled={!uid} type="primary" onClick={onConfirm} loading={loading}>
          Subscribe
        </Button>
      </div>
    </div>
  );
};

const EditUserForm = ({
  name = '',
  onConfirm,
}: {
  name?: string;
  onConfirm: (nextName: string) => void;
}) => {
  const [value, setValue] = useState(name);

  useEffect(() => {
    setValue(name);
  }, [name]);

  return (
    <div className="calendar-setting-edit-form">
      <Input
        placeholder="Enter user name"
        value={value}
        onChange={e => setValue(e.target.value?.slice(0, 30) || '')}
      />
      <Button size="small" type="primary" onClick={() => onConfirm(value)}>
        Save
      </Button>
    </div>
  );
};

const CalendarUserItem = ({
  item,
  type,
  myId,
  onRename,
  onRemove,
}: {
  item: any;
  type: 'my' | 'other';
  myId: string;
  onRename: (item: any, name: string) => Promise<void>;
  onRemove: (item: any) => Promise<void>;
}) => {
  const [editOpen, setEditOpen] = useState(false);
  const canRemove = !(type === 'my' && item.id === myId);

  return (
    <div className="calendar-setting-user-item">
      <ContactListItem
        id={item.id}
        noHover
        extraElement={
          <div className="calendar-setting-item-actions">
            <Popover
              destroyTooltipOnHide
              open={editOpen}
              onOpenChange={setEditOpen}
              trigger="click"
              arrow={false}
              content={
                <EditUserForm
                  name={item.cname || item.name || ''}
                  onConfirm={async nextName => {
                    await onRename(item, nextName);
                    setEditOpen(false);
                  }}
                />
              }
              placement="left"
              overlayInnerStyle={{ padding: '12px', width: '250px' }}
            >
              <Button size="small">Edit</Button>
            </Popover>
            <Button
              size="small"
              disabled={!canRemove}
              onClick={() => {
                if (!canRemove) {
                  return;
                }
                onRemove(item);
              }}
            >
              {type === 'my' ? 'Unlink' : 'Unsubscribe'}
            </Button>
          </div>
        }
      />
    </div>
  );
};

const TimeZoneList = ({ onBack }: { onBack: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [list, setList] = useState<{ timeZone: string; utcOffset: string }[]>([]);
  const { setTimeZone } = useTimeZoneDayjs();

  useEffect(() => {
    try {
      const supportedValuesOf = (Intl as any).supportedValuesOf as
        | undefined
        | ((key: string) => string[]);
      if (typeof supportedValuesOf === 'function') {
        const result = supportedValuesOf('timeZone').map(getTimeZone);
        setList(result);
      } else {
        setList([getTimeZone(dayjs.tz.guess())]);
      }
    } catch {
      setList([getTimeZone(dayjs.tz.guess())]);
    } finally {
      setLoading(false);
    }
  }, []);

  const renderList = useMemo(() => {
    if (!searchText) {
      return list;
    }
    const searchWord = searchText.toLowerCase();
    return list.filter(item => {
      const tz = item.timeZone.toLowerCase();
      const offset = item.utcOffset.toLowerCase();
      return tz.includes(searchWord) || offset.includes(searchWord);
    });
  }, [searchText, list]);

  if (loading) {
    return (
      <Flex justify="center" style={{ marginTop: '50px' }}>
        <Spin />
      </Flex>
    );
  }

  return (
    <>
      <div className="calendar-setting-search">
        <SearchInput
          prefix={<TablerSearch className="module-common-header__searchinput-prefix" />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
        />
      </div>
      {renderList.length > 0 ? (
        <AutoSizer>
          {({ height, width }) => (
            <VList
              width={width}
              height={height}
              rowHeight={36}
              rowCount={renderList.length}
              rowRenderer={({ index, style }) => {
                const item = renderList[index];
                return (
                  <div
                    style={style}
                    className="calendar-setting-timezone-item"
                    key={item.timeZone}
                    onClick={() => {
                      setTimeZone(item.timeZone);
                      onBack();
                    }}
                  >
                    <Flex align="center" gap="8px">
                      <div className="dsw-shared-typography-p3">{item.timeZone}</div>
                      <div className="timezone-utc">{item.utcOffset}</div>
                    </Flex>
                  </div>
                );
              }}
            />
          )}
        </AutoSizer>
      ) : (
        <div className="calendar-setting-empty">No results for {searchText}</div>
      )}
    </>
  );
};

const IcsUploader = ({ onSuccess }: { onSuccess: () => void }) => {
  const [fileList, setFileList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const readIcsFile = async (file: File) => {
    const ICS_PREFIX = 'data:text/calendar;base64,';
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const data = e.target.result as string;
        if (!data.trim().startsWith(ICS_PREFIX)) {
          reject(data);
          return;
        }
        resolve(data.trim().slice(ICS_PREFIX.length));
      };
      reader.onerror = reject;
      reader.onabort = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    try {
      if (!fileList.length || loading) {
        return;
      }
      setLoading(true);
      const ics = await readIcsFile(fileList[0]);
      await uploadIcsData({ ics });
      setFileList([]);
      toastSuccess('import ics success!');
      onSuccess();
    } catch (error: any) {
      toastError(error?.message || 'Import ics file failed, please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex vertical align="center" justify="center" gap={20} className="calendar-setting-uploader">
      <Upload.Dragger
        name="calendarIcs"
        accept=".ics"
        maxCount={1}
        fileList={fileList}
        beforeUpload={file => {
          setFileList([file]);
          return false;
        }}
        itemRender={(_, file, __, { remove }) => (
          <Flex align="center" justify="space-between" className="calendar-setting-file-item">
            <Flex align="center" gap={4}>
              <IconTablerLink width={16} height={16} />
              <span>{file.name}</span>
            </Flex>
            <span
              className="calendar-setting-file-remove"
              onClick={e => {
                e.stopPropagation();
                remove();
              }}
            >
              Remove
            </span>
          </Flex>
        )}
        onRemove={() => setFileList([])}
      >
        <div className="calendar-setting-uploader__title">Click or drag file to this area</div>
        <div className="calendar-setting-uploader__desc">Support for a single .ics file</div>
      </Upload.Dragger>
      <Button
        loading={loading}
        type="primary"
        disabled={fileList.length < 1}
        onClick={handleUpload}
      >
        Import
      </Button>
    </Flex>
  );
};

export const CalendarSettingDialog = ({
  open,
  onClose,
  myList,
  otherList,
  myId,
}: {
  open: boolean;
  onClose: () => void;
  myList: any[];
  otherList: any[];
  myId: string;
}) => {
  const [step, setStep] = useState(Step.Main);
  const [myCalendars, setMyCalendars] = useState<any[]>([]);
  const [otherCalendars, setOtherCalendars] = useState<any[]>([]);
  const { openModal } = useRadioModal();
  const queryClient = useQueryClient();
  const {
    timeZone: myTimeZone,
    isSystemTimeZoneSwitchOn,
    setSystemTimeZoneSwitchOn,
  } = useTimeZoneDayjs();

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
      'Setting Time Zone',
      'Import ics',
    ],
    []
  );

  const confirmRemove = async (currentStep: Step) => {
    const StepMap = {
      [Step.My]: 'Once unlink, if you want to link again, you will need to reapply.',
      [Step.Other]: 'Confirm to delete?',
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

  const refreshCalendar = () => {
    queryClient.invalidateQueries({ queryKey: ['myEvents'] });
  };

  const handleRename = async (item: any, name: string, type: 'my' | 'other') => {
    try {
      await updateUserCalendar({
        cid: uid2cid(getRealUid(item.id)),
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
      refreshCalendar();
      toastSuccess('update calendar info successfully!');
    } catch (error: any) {
      toastError(error?.message || 'update calendar fail, try again later!');
    }
  };

  const handleRemove = async (item: any, type: 'my' | 'other') => {
    const { ok } = await confirmRemove(type === 'my' ? Step.My : Step.Other);
    if (!ok) {
      return;
    }
    try {
      await deleteUserCalendar({
        type: type === 'my' ? 'myCalendar' : 'otherCalendar',
        cid: uid2cid(getRealUid(item.id)),
      });
      if (type === 'my') {
        setMyCalendars(list => list.filter(target => target.id !== item.id));
      } else {
        setOtherCalendars(list => list.filter(target => target.id !== item.id));
      }
      refreshCalendar();
      toastSuccess(type === 'my' ? 'Unlinked' : 'Unsubscribed!');
    } catch (error: any) {
      toastError(error?.message || 'remove failed!');
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
                onRename={(target, name) => handleRename(target, name, 'my')}
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
            refreshCalendar();
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

    return null;
  };

  const header = (
    <Flex align="center" justify="space-between" className="calendar-setting-header">
      <div className="calendar-setting-header__left">
        {step !== Step.Main && (
          <IconBackF onClick={() => setStep(Step.Main)} className="calendar-setting-back" />
        )}
      </div>
      <span>{titles[step]}</span>
      <div className="calendar-setting-header__right">
        {step === Step.Other && (
          <IconTablerPlus
            className="calendar-setting-add"
            onClick={() => {
              if (otherCalendars.length >= 10) {
                toastError('You can only subscribe 10 calendars');
                return;
              }
              setStep(Step.AddOther);
            }}
          />
        )}
        <IconCloseF onClick={onClose} className="calendar-setting-close" />
      </div>
    </Flex>
  );

  return (
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
  );
};

export default CalendarSettingDialog;
