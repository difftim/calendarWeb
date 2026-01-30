import React, { useEffect, useMemo, useState } from 'react';
import { Button, Drawer } from 'antd';
import dayjs from 'dayjs';
import classNames from 'classnames';
import { uniqBy } from 'lodash';

import { useDetailDataValue, useSetDetailData } from '@/hooks/useDetailData';
import { useCurrentTimeZone } from '@/hooks/useCurrentTimeZone';
import { showPannelAtom } from '@/atoms/detail';
import { useSetAtom } from 'jotai';
import { IconBackF, IconCloseF, IconChevronRight1 } from '@/shared/IconsNew';
import { getOffsetStringFromOffsetNumber } from '@/util';
import ViewSchedule from './components/findTime/ViewSchedule';
import { useAddMembersDialog } from '@/hooks/useEditAttendeeDialog';
import { userIdAtom } from '@/atoms';
import { useAtomValue } from 'jotai';

const FindTimeHeader = ({
  timeZone,
  queryDate,
  setQueryDate,
  onBack,
  onClose,
}: {
  timeZone: string;
  queryDate: string;
  setQueryDate: React.Dispatch<React.SetStateAction<string>>;
  onBack: () => void;
  onClose: () => void;
}) => {
  const today = dayjs().tz(timeZone).startOf('day');
  const utcOffset = today.utcOffset() / 60;
  const currentDay = dayjs(
    `${queryDate} ${getOffsetStringFromOffsetNumber(utcOffset)}`,
    'YYYY-MM-DD Z'
  )
    .tz(timeZone)
    .startOf('day');

  const isPastDate = today.diff(currentDay, 'days') >= 0;
  const isMoreThanFourteenDays = currentDay.diff(today, 'days') >= 14 - 1;

  return (
    <div className={'schedule-meeting-header'}>
      <IconBackF
        style={{
          position: 'absolute',
          left: '16px',
          top: '20px',
          cursor: 'pointer',
        }}
        width={20}
        height={20}
        onClick={e => {
          e.stopPropagation();
          onBack();
        }}
      />
      <div className="view-schedule-header">
        <Button
          onClick={() => {
            setQueryDate(dayjs().tz(timeZone).format('YYYY-MM-DD'));
          }}
        >
          Today
        </Button>
        <div className="date">{dayjs(queryDate).locale('en').format('ddd, MMM D')}</div>
        <IconChevronRight1
          className={classNames('view-schedule-header-left', {
            'view-schedule-header-left-disable': isPastDate,
          })}
          style={{ transform: 'rotate(180deg)' }}
          onClick={() => {
            if (isPastDate) {
              return;
            }
            setQueryDate(dayjs(queryDate).subtract(1, 'days').format('YYYY-MM-DD'));
          }}
        />
        <IconChevronRight1
          className={classNames('view-schedule-header-right', {
            'view-schedule-header-right-disable': isMoreThanFourteenDays,
          })}
          onClick={() => {
            if (isMoreThanFourteenDays) {
              return;
            }
            setQueryDate(dayjs(queryDate).add(1, 'days').format('YYYY-MM-DD'));
          }}
        />
      </div>
      <IconCloseF
        style={{
          position: 'absolute',
          right: '15px',
          top: '20px',
          cursor: 'pointer',
        }}
        width={20}
        height={20}
        onClick={e => {
          e.stopPropagation();
          onClose();
        }}
      />
    </div>
  );
};

const FindTime = () => {
  const { childModalType, members, date, time, duration = 30, topic } = useDetailDataValue();
  const { timeZone: rawTimeZone } = useCurrentTimeZone();
  const timeZone = rawTimeZone || dayjs.tz.guess();
  const setData = useSetDetailData();
  const setShow = useSetAtom(showPannelAtom);
  const myId = useAtomValue(userIdAtom);
  const isOpen = childModalType === 'findTime';
  const { openForMembers } = useAddMembersDialog();

  const [queryDate, setQueryDate] = useState((date || dayjs().tz(timeZone)).format('YYYY-MM-DD'));

  useEffect(() => {
    if (isOpen) {
      setQueryDate((date || dayjs().tz(timeZone)).format('YYYY-MM-DD'));
    }
  }, [date, isOpen, timeZone]);

  const wantDate = useMemo(() => {
    if (!date || !time) {
      return {
        topic: topic || 'Meeting',
        start: dayjs().unix(),
        end: dayjs().add(duration, 'minute').unix(),
      };
    }
    const startDate = date.format('YYYY-MM-DD');
    const startTime = time.format('HH:mm');
    const offset = dayjs().tz(timeZone).utcOffset() / 60;
    const start = dayjs(
      `${startDate} ${startTime} ${getOffsetStringFromOffsetNumber(offset)}`,
      'YYYY-MM-DD HH:mm Z'
    ).unix();
    const end = dayjs(start * 1000)
      .add(duration, 'minutes')
      .unix();

    return {
      topic: topic || 'Meeting',
      start,
      end,
    };
  }, [date, time, duration, timeZone, topic]);

  const handleAddMember = async () => openForMembers(members);

  return (
    <Drawer
      open={isOpen}
      className="find-time-drawer"
      closeIcon={false}
      title={
        <FindTimeHeader
          timeZone={timeZone}
          queryDate={queryDate}
          setQueryDate={setQueryDate}
          onBack={() => setData({ childModalType: '' })}
          onClose={() => setShow(false)}
        />
      }
    >
      <div className="find-a-time-container">
        <ViewSchedule
          queryDate={queryDate}
          wantDate={wantDate}
          ourNumber={myId}
          timeZone={timeZone}
          members={members.map(m => ({ ...m, id: m.uid }))}
          onAddMember={handleAddMember}
          onConfirm={({ newWantDate, newMembers }) => {
            const newDate = dayjs(newWantDate.start * 1000).tz(timeZone);
            setData(prev => {
              // 合并新成员到 members 列表
              const incoming = (newMembers || []).map((item: any) => ({
                ...item,
                uid: item.uid || item.id,
              }));

              return {
                date: newDate,
                time: newDate,
                start: newWantDate.start,
                end: newWantDate.end,
                childModalType: '',
                members: uniqBy([...prev.members, ...incoming], 'uid'),
              };
            });
          }}
        />
      </div>
    </Drawer>
  );
};

export default FindTime;
