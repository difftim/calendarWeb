import React, { useEffect, useMemo, useState } from 'react';
import { Button, Calendar, Popover } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { uniqBy } from 'lodash';

import { useDetailDataValue, useSetDetailData } from '@/hooks/useDetailData';
import { useCurrentTimeZone } from '@/hooks/useCurrentTimeZone';
import { useAtomValue } from 'jotai';
import { IconChevronDown, IconChevronRight1 } from '@/shared/IconsNew';
import { getOffsetStringFromOffsetNumber } from '@/util';
import ViewSchedule from './components/findTime/ViewSchedule';
import { useAddMembersDialog } from '@/hooks/useEditAttendeeDialog';
import { userIdAtom } from '@/atoms';
import ConfigProvider from '@/shared/ConfigProvider';
import { useAntdLocale } from '@/hooks/useAntdLocale';
import { useAtom } from 'jotai';
import { queryScheduleConfigAtom } from '@/atoms/query';

const FindTimeHeader = ({
  timeZone,
  queryDate,
  setQueryDate,
}: {
  timeZone: string;
  queryDate: string;
  setQueryDate: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const antdLocale = useAntdLocale();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [panelValue, setPanelValue] = useState(() => dayjs(queryDate));

  useEffect(() => {
    setPanelValue(dayjs(queryDate));
  }, [queryDate]);

  const todayStr = dayjs().tz(timeZone).format('YYYY-MM-DD');

  const disabledDate = (current: Dayjs) => {
    if (!current) return false;
    return current.format('YYYY-MM-DD') < todayStr;
  };

  const calendarContent = (
    <ConfigProvider locale={antdLocale}>
      <Calendar
        fullscreen={false}
        value={panelValue}
        disabledDate={disabledDate}
        onSelect={(date: Dayjs) => {
          if (disabledDate(date)) return;
          setQueryDate(date.format('YYYY-MM-DD'));
          setCalendarOpen(false);
        }}
        headerRender={({ value }) => {
          const monthLabel = value.locale('en').format('MMM YYYY');
          return (
            <div className="view-schedule-calendar-header">
              <span className="view-schedule-calendar-title">{monthLabel}</span>
              <div className="view-schedule-calendar-arrows">
                <IconChevronRight1
                  className="view-schedule-calendar-arrow"
                  style={{ transform: 'rotate(180deg)' }}
                  onClick={() => setPanelValue(value.subtract(1, 'month'))}
                />
                <IconChevronRight1
                  className="view-schedule-calendar-arrow"
                  onClick={() => setPanelValue(value.add(1, 'month'))}
                />
              </div>
            </div>
          );
        }}
      />
    </ConfigProvider>
  );

  return (
    <div className="find-time-header">
      <div className="view-schedule-header">
        <Button
          onClick={() => {
            setQueryDate(dayjs().tz(timeZone).format('YYYY-MM-DD'));
          }}
        >
          Today
        </Button>
        <Popover
          content={calendarContent}
          trigger="click"
          open={calendarOpen}
          onOpenChange={setCalendarOpen}
          overlayClassName="view-schedule-calendar-popover"
          arrow={false}
          align={{ offset: [0, 8] }}
          placement="bottom"
          getPopupContainer={node =>
            (node.closest('.find-time-panel') as HTMLElement) || document.body
          }
        >
          <div className="date-trigger">
            <span className="date">{dayjs(queryDate).locale('en').format('ddd, MMM D')}</span>
            <IconChevronDown
              className="date-trigger-icon"
              style={{
                transform: calendarOpen ? 'rotate(180deg)' : undefined,
                transition: 'transform 0.2s',
              }}
            />
          </div>
        </Popover>
      </div>
    </div>
  );
};

const FindTime = () => {
  const { members, date, time, duration = 30, topic, category } = useDetailDataValue();
  const { timeZone: rawTimeZone } = useCurrentTimeZone();
  const timeZone = rawTimeZone || dayjs.tz.guess();
  const setData = useSetDetailData();
  const myId = useAtomValue(userIdAtom);
  const { openForMembers } = useAddMembersDialog();
  const [precreateConfigResult] = useAtom(queryScheduleConfigAtom);
  const availableBots = category !== 'event' ? (precreateConfigResult?.data?.availableBots ?? []) : undefined;

  const [queryDate, setQueryDate] = useState((date || dayjs().tz(timeZone)).format('YYYY-MM-DD'));

  useEffect(() => {
    setQueryDate((date || dayjs().tz(timeZone)).format('YYYY-MM-DD'));
  }, [date, timeZone]);

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

  const handleAddMember = async () => openForMembers(members, availableBots);

  return (
    <div className="find-time-panel">
      <FindTimeHeader
        timeZone={timeZone}
        queryDate={queryDate}
        setQueryDate={setQueryDate}
      />
      <div className="find-a-time-container">
        <ViewSchedule
          queryDate={queryDate}
          wantDate={wantDate}
          ourNumber={myId}
          timeZone={timeZone}
          members={members.map(m => ({ ...m, id: m.uid }))}
          onAddMember={handleAddMember}
          onConfirmAddMember={({ newMembers }) => {
            if (!newMembers?.length) {
              return;
            }
            setData(prev => {
              const incoming = newMembers.map((item: any) => ({
                ...item,
                uid: item.uid || item.id,
              }));
              return { members: uniqBy([...prev.members, ...incoming], 'uid') };
            });
          }}
          onConfirm={({ newWantDate }) => {
            const newDate = dayjs(newWantDate.start * 1000).tz(timeZone);
            setData({
              date: newDate,
              time: newDate,
              start: newWantDate.start,
              end: newWantDate.end,
            });
          }}
        />
      </div>
    </div>
  );
};

export default FindTime;
