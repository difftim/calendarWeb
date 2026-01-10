import { useCallback } from 'react';
import { uniqBy } from 'lodash';
import dayjs, { Dayjs } from 'dayjs';
import { isNotOverlap } from '@/components/CalendarTab/utils';
import { formatTime, formatMinutes, formatNoonAndMidNight } from '../../../util';
import { useTimeZoneDayjs } from './useTimeZoneDayjs';
import { formatDays } from '../../../util';

type Item = {
  channelName: string;
  cid: string;
  eid: string;
  host: string;
  start: number;
  end: number;
  topic: string;
  role: string;
  isAllDay?: boolean;
  category?: string;
  allDayStart?: string; // YYYYMMDD
  allDayEnd?: string; // YYYYMMDD
};

const getMin = (a: any, b: any) => (a < b ? a : b);
const getMax = (a: any, b: any) => (a > b ? a : b);

const useFormatMeetingList = () => {
  const { createTzDayjs, timeZone } = useTimeZoneDayjs();
  const formatDate = useCallback(
    (d: Dayjs, i: number) => {
      const date = d.add(i, 'day');

      return date.locale('en').tz(timeZone).format('ddd, MMM D');
    },
    [timeZone]
  );

  const isToday = (date: Dayjs, timeZone?: string) => {
    const now = timeZone ? dayjs().tz(timeZone) : dayjs();
    return date.startOf('day').unix() === now.startOf('day').unix();
  };

  const isTomorrow = (date: Dayjs, timeZone?: string) => {
    const now = timeZone ? dayjs().tz(timeZone) : dayjs();
    return date.startOf('day').unix() === now.startOf('day').unix() + 24 * 3600;
  };

  const calcDuration = useCallback(
    (
      start: number,
      end: number,
      theDay: Dayjs,
      isAllDay = false,
      allDayProcess: string | undefined
    ) => {
      if (allDayProcess) {
        return allDayProcess;
      }

      const _diff = createTzDayjs(start * 1000)
        .startOf('day')
        .diff(theDay, 'day');

      const totalSecounds = end - start;

      const duration = isAllDay
        ? formatDays(Math.round(totalSecounds / 86400))
        : formatMinutes(Math.round(totalSecounds / 60));

      let time;
      if (_diff !== 0) {
        time = formatTime(start * 1000, { locale: 'en', tz: timeZone });
      }
      // event allday
      else if (isAllDay) {
        const date = createTzDayjs(start * 1000, 'en');
        const prefix = isToday(date, timeZone)
          ? `Today`
          : isTomorrow(date, timeZone)
            ? 'Tomorrow'
            : '';
        time = prefix ? `${prefix}, ${date.format('MMM D')}` : date.format('ddd, MMM D');
      } else {
        const date = createTzDayjs(start * 1000, 'en');
        const hour = date.get('hour');
        time = date.format('h:mm A');
        if (hour === 0) {
          time = time.replace('AM', 'MIDNIGHT');
        }
        if (hour === 12) {
          time = time.replace('PM', 'NOON');
        }
      }

      return `${time} (${duration})`;
    },
    [timeZone]
  );

  const calcPrefixFreeTimeDiff = useCallback(
    (item: any, index: number, startDate: Dayjs) => {
      const theDayAt9 = startDate.add(index, 'day').set('hour', 9).startOf('hour').locale('en');

      const now = createTzDayjs();

      const theDayAt18 = startDate.add(index, 'day').set('hour', 18).startOf('hour').locale('en');

      let startTime = createTzDayjs(item.start * 1000, 'en');

      if (startTime < theDayAt9) {
        return {
          diff: 0,
        };
      }

      startTime = getMin(startTime, theDayAt18);

      const leftTime = getMax(now, theDayAt9) as Dayjs;

      return {
        diff: startTime.diff(leftTime, 'minute'),
        left: leftTime,
        right: startTime,
      };
    },
    [timeZone]
  );

  const getDiffMinutes = useCallback(
    (
      // 本次会议的结束时间
      currentEnd: number,
      // 下次会议的开始时间
      nextStart: number,
      // 最晚结束的会议时间, 一般应该 === currentEnd
      latestEnd: number,
      // 本日开始时间,
      theDay
    ) => {
      const nextStartDayjs = createTzDayjs(nextStart * 1000, 'en');
      const latestEndDayjs = createTzDayjs(latestEnd * 1000, 'en');
      let currEndDayjs = createTzDayjs(currentEnd * 1000, 'en');

      let theDayAt9 = theDay.set('hour', 9);
      let theDayAt18 = theDay.set('hour', 18);

      // 异常 case 1, 当前结束会议 < 当前存在的最晚会议时间, 直接用 latestEndDayjs 作为当前会议
      if (currEndDayjs.isBefore(latestEndDayjs)) {
        currEndDayjs = latestEndDayjs;
      }

      if (!nextStart) {
        // 异常 case 2, 后面没有了
        const diff = theDayAt18.diff(getMax(theDayAt9, currEndDayjs), 'minute');

        return {
          diff,
          left: getMax(theDayAt9, currEndDayjs),
          right: theDayAt18,
        };
      }

      // 异常 case 3 右 > 左
      if (nextStartDayjs <= currEndDayjs) {
        return {
          diff: 0,
        };
      }

      // case 1: 都 < 9AM
      if (currEndDayjs.isBefore(theDayAt9) && nextStartDayjs.isBefore(theDayAt9)) {
        //  当前结束时间 > 18:00
        return {
          diff: 0,
        };
      }

      // case 1: 左 <= 9AM,  右 <= 18PM
      if (!currEndDayjs.isAfter(theDayAt9) && !nextStartDayjs.isAfter(theDayAt18)) {
        const diff = nextStartDayjs.diff(theDayAt9, 'minute');

        return {
          diff,
          left: theDayAt9,
          right: nextStartDayjs,
        };
      }

      // case 2: 左 <= 9AM,  右 > 18PM
      if (!currEndDayjs.isAfter(theDayAt9) && nextStartDayjs.isAfter(theDayAt18)) {
        const diff = theDayAt18.diff(theDayAt9, 'minute');
        return {
          diff,
          left: theDayAt9,
          right: theDayAt18,
        };
      }

      // case 3: 左 >= 9AM,  右 <= 18PM (左 < 右 <= 18PM)
      if (currEndDayjs.isAfter(theDayAt9) && !nextStartDayjs.isAfter(theDayAt18)) {
        const diff = nextStartDayjs.diff(currEndDayjs, 'minute');

        return {
          diff,
          left: currEndDayjs,
          right: nextStartDayjs,
        };
      }

      // case 4: 左 >= 9AM && < 18PM,  右 > 18PM
      if (
        currEndDayjs.isAfter(theDayAt9) &&
        currEndDayjs.isBefore(theDayAt18) &&
        nextStartDayjs.isAfter(theDayAt18)
      ) {
        const diff = theDayAt18.diff(currEndDayjs, 'minute');

        return {
          diff,
          left: currEndDayjs,
          right: theDayAt18,
        };
      }

      // case 5: 左 >= 18PM
      return {
        diff: 0,
      };
    },
    [timeZone]
  );

  // initialList: 按照天分的二维数组
  const createMatrixArray = useCallback(
    (list: Item[], startDate: Dayjs, myAccounts: string[]) => {
      const initialList = new Array(7).fill('baye').map(() => []) as any[][];
      const myNumber = myAccounts[0];
      list = uniqBy(
        myAccounts
          .map(cid => list.filter(item => item.role !== 'proxy' && item.cid === cid))
          .flat(),
        item => {
          if (item.role !== 'proxy') {
            return item.eid;
          }
          return item.cid + item.eid;
        }
      ).sort((a, b) => a.start - b.start);

      for (let i = 0; i < list.length; i++) {
        const item = list[i];

        // 排除今天非自己的数据
        if (
          item.end * 1000 < Date.now() ||
          isNotOverlap(item.start, item.end, startDate.unix(), startDate.endOf('week').unix())
        ) {
          continue;
        }

        let diff = createTzDayjs(item.start * 1000)
          .startOf('day')
          .diff(startDate, 'day');

        diff = Math.min(Math.max(0, diff), 6);

        const theDay = startDate.add(diff, 'day');
        const isAllDayEvent =
          item.category === 'event' && item.isAllDay && item.allDayStart && item.allDayEnd;

        const allDayStartWeek = startDate.format('YYYYMMDD');
        // 可能是上周的 event，需要减去上周的天数
        const passedDays = isAllDayEvent
          ? Math.max(
              0,
              dayjs(allDayStartWeek, 'YYYYMMDD').diff(dayjs(item.allDayStart, 'YYYYMMDD'), 'day')
            )
          : 0;

        const allDayDuration = isAllDayEvent
          ? dayjs(item.allDayEnd, 'YYYYMMDD').diff(dayjs(item.allDayStart, 'YYYYMMDD'), 'day')
          : undefined;

        const listItem = {
          ...item,
          disabled: item.cid !== myNumber && item.role !== 'proxy',
          rowType: 'data',
          duration: calcDuration(
            item.start,
            item.end,
            theDay,
            item.isAllDay,
            allDayDuration && allDayDuration > 1
              ? `All Day (Day ${1 + passedDays}/${allDayDuration})`
              : undefined
          ),
          id: `data_${item.eid}`,
        };
        initialList[diff].push(listItem);

        if (isAllDayEvent) {
          const dayCount = allDayDuration!;
          for (let i = 1; i < dayCount - passedDays; i++) {
            if (diff + i > 6) {
              break;
            }
            const eid = `${item.eid}[copy]${i}`;
            initialList[diff + i].push({
              ...listItem,
              eid,
              id: `data_${item.eid}_${i}`,
              duration: calcDuration(
                item.start,
                item.end,
                theDay,
                item.isAllDay,
                `All Day (Day ${i + 1 + passedDays}/${dayCount})`
              ),
            });
          }
        }
      }

      return initialList;
    },
    [calcDuration, timeZone]
  );

  const addAlldayFreeTime = useCallback((index: number, startDate: Dayjs, hasPassed) => {
    let start = startDate.add(index, 'day').set('hour', 9);
    const now = createTzDayjs();
    if (now > start) {
      start = now;
    }
    const time = start.locale('en').format('H:mm A');

    return {
      disabled: hasPassed,
      rowType: 'diff',
      data: hasPassed ? `No Meeting` : `${time} - 6:00 PM (all day free)`,
      id: `freetime_allday`,
      start,
      isEnd: true,
    };
  }, []);

  const addTitleAndFreeTime = useCallback(
    (meetingsInOneDay: any[], index: number, startDate: Dayjs) => {
      let latestEndMeting = dayjs(`1970-01-01`).unix();
      const now = createTzDayjs();

      const result = meetingsInOneDay.reduce((sum, item: any, i) => {
        // 找当天第一个会的空闲时间
        if (i === 0) {
          const {
            diff: prefixTimeDiff,
            left,
            right,
          } = calcPrefixFreeTimeDiff(item, index, startDate);

          if (prefixTimeDiff > 29 && right! > now) {
            const data = `${formatNoonAndMidNight(
              left!
            )} - ${formatNoonAndMidNight(right!)} (${formatMinutes(prefixTimeDiff)} free)`;

            sum.push({
              rowType: 'diff',
              data,
              start: left,
              isEnd: false,
              id: `freetime_${data}`,
            });
          }
        }

        latestEndMeting = Math.max(latestEndMeting, item.end);

        sum.push(item);

        const nextStart = meetingsInOneDay[i + 1]?.start;

        const theDay = startDate.add(index, 'day').startOf('day');

        const { diff, left, right } = getDiffMinutes(item.end, nextStart, latestEndMeting, theDay);

        if (diff > 29 && right > now) {
          const data = `${formatNoonAndMidNight(
            left!
          )} - ${formatNoonAndMidNight(right!)} (${formatMinutes(diff)} free)`;

          sum.push({
            rowType: 'diff',
            data,
            id: `freetime_${data}`,
            start: left,
            isEnd: !nextStart,
          });
        }

        return sum;
      }, []) as any[];

      if (!result.length) {
        const theDayAt18 = startDate.add(index, 'day').set('hour', 18);
        result.push(addAlldayFreeTime(index, startDate, now > theDayAt18));
      }

      const data = formatDate(startDate, index);

      result.unshift({
        rowType: 'title',
        day: startDate.add(index, 'day').startOf('day'),
        id: `title_${data}`,
        data,
      });

      result.forEach(r => {
        r.curDay = data;
        r.id = `${r.curDay}_${r.id}`;
      });

      return result;
    },
    [formatDate, getDiffMinutes, calcPrefixFreeTimeDiff, timeZone]
  );

  const formatList = useCallback(
    (list: Item[], startDate: Dayjs, myAccounts: string[]) => {
      const initialList = createMatrixArray(list, startDate, myAccounts);

      return initialList.reduce((sum, arr, index) => {
        sum.push(...addTitleAndFreeTime(arr, index, startDate));

        return sum;
      }, [] as any[]);
    },
    [createMatrixArray, addTitleAndFreeTime]
  );

  return { formatList };
};

export default useFormatMeetingList;
