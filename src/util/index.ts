import dayjs, { Dayjs } from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import isTomorrow from 'dayjs/plugin/isTomorrow';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import updateLocale from 'dayjs/plugin/updateLocale';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';
import { pick, uniqBy } from 'lodash';
import lzString from 'lz-string';
import 'dayjs/locale/zh-cn';
import { DetailData } from '@/atoms/detail';
import { fetchUserInfo } from '@/atoms/userInfo';

const BAD_CHARACTERS = /[^A-Za-z\s]+/g;
const WHITESPACE = /\s+/g;

function removeNonInitials(name: string) {
  return name.replace(BAD_CHARACTERS, '').replace(WHITESPACE, ' ');
}

export const cleanUserIdForDisplay = (id: string) => {
  if (!id || typeof id !== 'string') {
    return id;
  }

  return id.startsWith('+') ? id.substring(1) : id;
};

export const cleanUserNameForDisplay = (item: { id: string; name?: string; uid?: string }) => {
  const uid = item.uid || item.id;
  if (!item.name || item.name === uid) {
    return cleanUserIdForDisplay(uid);
  }

  return item.name;
};

export const isMatchUserId = (userId: string) => {
  return userId && userId.startsWith('+');
};

export const formatNoonAndMidNight = (date: any) => {
  const hour = date.hour();
  let time = date.format('h:mm A');
  if (hour === 0) {
    time = time.replace('AM', 'MIDNIGHT');
  }
  if (hour === 12) {
    time = time.replace('PM', 'NOON');
  }
  return time;
};

export const uid2cid = (uid: string = '') => uid.replace('+', 'user_');

export const cid2uid = (cid: string = '') => cid.replace('user_', '+');

export const isValidArray = (arr: any) => {
  return Array.isArray(arr) && arr.length > 0;
};

export const getQueryKey = (date: Dayjs, timeZone?: string) => {
  const queryKey = [date.tz(timeZone).startOf('week'), date.tz(timeZone).endOf('week')]
    .map(d => d.format('YYYY-MM-DD'))
    .join('_');

  return queryKey;
};

export const getUserBgColor = (mode: 'dark' | 'light') => {
  const checkBoxBg = [
    '#016dc0',
    '#009659',
    '#8e3deb',
    '#da9900',
    '#474d57',
    '#099996',
    '#d9271e',
    '#003366',
    '#00563a',
    '#ce0857',
    '#8a5000',
    '#a71914',
    '#461585',
    '#173536',
    '#700831',
  ];

  const eventBg =
    mode === 'dark'
      ? [
          '#113350',
          '#113f31',
          '#3b255d',
          '#524016',
          '#262931',
          '#134043',
          '#521e1f',
          '#112235',
          '#112c28',
          '#4f1531',
          '#3a2a16',
          '#431a1c',
          '#26193e',
          '#182227',
          '#321525',
        ]
      : [
          '#EDF8FF',
          '#EBF7F2',
          '#F6EFFD',
          '#FDFAF2',
          '#F0F1F2',
          '#EBF7F7',
          '#FCEEED',
          '#EBEFF3',
          '#F2F7F5',
          '#FBEBF2',
          '#F2E8DA',
          '#FBF4F3',
          '#F6F3F9',
          '#F3F5F5',
          '#F8F3F5',
        ];

  const textColor = mode === 'dark' ? new Array(15).fill('#fff') : checkBoxBg;

  return {
    checkBoxBg,
    eventBg,
    textColor,
  };
};

export const inThisWeek = (date: Dayjs, timeZone?: string) => {
  const startWeek = dayjs().tz(timeZone).startOf('week').unix();
  const endWeek = dayjs().tz(timeZone).endOf('week').unix();
  return date.unix() >= startWeek && date.unix() <= endWeek;
};

export const getOffset = (item: any) => {
  const defaultOffset = 8;
  if (item.timeZone === null || item.timeZone === undefined) {
    return defaultOffset;
  }

  return Number.isNaN(Number(item.timeZone)) ? defaultOffset : Number(item.timeZone);
};

export enum MeetingType {
  Native = 1,
  Google = 2,
  Mixed = 3,
}

export enum Tab2Type {
  Calendar = '1',
  Meeting = '2',
}

export const getSameTimeSuffix = (a: Dayjs, b: Dayjs, offset: number) => {
  return (
    a.locale('en').utcOffset(offset).format('A') === b.locale('en').utcOffset(offset).format('A')
  );
};

export const getTimeFormatWithUtc = (start: Dayjs, end: Dayjs, timeZone: number) => {
  const isSameTimeSuffix = getSameTimeSuffix(start, end, timeZone);

  return `${start
    .locale('en')
    .utcOffset(timeZone)
    .format(isSameTimeSuffix ? 'h:mm' : 'h:mm A')}-${end
    .locale('en')
    .utcOffset(timeZone)
    .format('h:mm A')}`;
};

export const isNotOverlap = (start1: number, end1: number, start2: number, end2: number) => {
  return start1 >= end2 || start2 >= end1;
};

export const isOverlap = (start1: number, end1: number, start2: number, end2: number) =>
  !isNotOverlap(start1, end1, start2, end2);

export const isPassedWeek = (keys: string[] = []) => {
  if (keys[0] !== 'myEvents' || !keys[1]?.includes('_')) {
    return false;
  }

  const lastTime = keys[1].split('_')[1];
  if (!lastTime) {
    return false;
  }

  const endTime = dayjs(lastTime).endOf('day');

  return endTime.isBefore(dayjs().startOf('week'));
};

export const getTodayListCount = (ourNumber: string) => {
  let source = localStorage.getItem('myEvents');
  if (!source) {
    return 0;
  }

  const getFromStorage = (str: string, ourNumber: string) => {
    try {
      const arr = JSON.parse(str) || [];
      const res = Array.from(new Set([...arr, ourNumber])).filter(Boolean);
      return res;
    } catch (error) {
      return [ourNumber];
    }
  };

  const myCheckedStr = localStorage.getItem('myChecked') || '[]';
  const myChecked = getFromStorage(myCheckedStr, ourNumber);

  const getListFromStorage = (str: string) => {
    try {
      const myCalendar = JSON.parse(lzString.decompress(str)).initialData.myCalendar;

      const list = myCalendar
        .map((item: any) =>
          (item.events || []).map((event: any) => ({
            ...event,
            isBossProxy: item.role === 'proxy',
          }))
        )
        .flat(1)
        .filter(Boolean);

      return list;
    } catch (error) {
      return [];
    }
  };

  const list: any[] = getListFromStorage(source);

  if (!list) {
    return 0;
  }

  const result = list.filter(
    item =>
      myChecked.includes(cid2uid(item.cid)) &&
      item.end * 1000 >= Date.now() &&
      dayjs(item.start * 1000).isToday() &&
      !item.isBossProxy
  );

  // 过滤相同eid的
  return uniqBy(result, 'eid').length;
};

export enum StartType {
  comingSoon = 'comingSoon',
  incoming = 'incoming',
  start = 'start',
}

export const fixScrollToTimePosition = () => {
  const content = document.querySelector('.rbc-time-content');
  const viewHeight = content?.children[0]?.clientHeight;
  if (viewHeight && content && content.scrollTop === 0) {
    content.scrollTop = (9.5 / 24) * viewHeight;
  }
};

type CreateFormatList = (
  hour: number,
  option?: {
    isToday?: boolean;
    isTomorrow?: boolean;
  }
) => string[];

const createFormatList: CreateFormatList = (hour, option = {}) => {
  const prefix = option.isToday ? '(Today)' : option.isTomorrow ? '(Tomorrow)' : '';
  const suffix = hour === 0 ? 'MIDNIGHT' : hour === 12 ? 'NOON' : '';
  const timeStr = `ddd, MMM D - h:mm ${suffix ? '' : 'A'}`.trim();

  return [prefix, timeStr, suffix];
};

export const formatTime = (
  time: number,
  options: {
    withRelativeTime?: boolean;
    locale?: string;
    tz?: string;
    showToday?: boolean;
    ignoreTime?: boolean;
  } = {}
) => {
  const { withRelativeTime, locale, tz, showToday = true, ignoreTime = false } = options;
  let date = dayjs(time);
  if (locale) {
    date = date.locale(locale);
  }
  if (tz) {
    date = date.tz(tz);
  }
  const hour = date.get('hour');
  let formats;

  const isToday = () => {
    const now = tz ? dayjs().tz(tz) : dayjs();
    return date.startOf('day').unix() === now.startOf('day').unix();
  };

  const isTomorrow = () => {
    const now = tz ? dayjs().tz(tz) : dayjs();

    return date.startOf('day').unix() === now.startOf('day').unix() + 24 * 3600;
  };

  if (ignoreTime && withRelativeTime && showToday) {
    return `${date.format('ddd, MMM D')} ${isToday() ? '(Today)' : isTomorrow() ? '(Tomorrow)' : ''}`.trim();
  }

  if (withRelativeTime && isToday() && showToday) {
    formats = createFormatList(hour, { isToday: true });
  } else if (withRelativeTime && isTomorrow() && showToday) {
    formats = createFormatList(hour, { isTomorrow: true });
  } else {
    formats = createFormatList(hour);
  }

  const [prefix, _timeStr, _suffix] = formats;

  return `${date.format(_timeStr)} ${_suffix}`.replace('-', prefix).trim();
};

export const formatMinutes = (diff: number) => {
  if (diff === 0) {
    return '';
  }

  if (diff < 60) {
    return `${diff} ${diff === 1 ? 'min' : 'mins'}`;
  }

  if (diff === 60) {
    return `1 hr`;
  }

  const d = Math.floor(diff / 60 / 24);
  diff = diff - d * 1440;
  const hr = Math.floor(diff / 60);
  const leftMins = diff % 60;

  const dStr = d > 1 ? `${d} days` : d === 1 ? `1 day` : '';
  const hStr = hr > 1 ? `${hr} hrs` : hr === 1 ? `1 hr` : '';
  const mStr = leftMins > 1 ? `${leftMins} mins` : leftMins === 1 ? `1 min` : '';

  return [dStr, hStr, mStr].join(' ').trim();
};

export const formatDays = (diff: number) => {
  if (diff === 0) {
    return '';
  }
  if (diff === 1) {
    return `1 day`;
  }
  return `${diff} days`;
};

export const replaceFormatLocalTime = (content: string) => {
  if (content.includes('$FORMAT-LOCAL-TIME')) {
    return content.replace(/\$FORMAT-LOCAL-TIME{(\d+)}/g, (_, time) => {
      const offset = dayjs().utcOffset() / 60;
      const date = dayjs(time * 1000);

      if (!date.isValid()) {
        return _;
      }

      const utcString = `(UTC${offset >= 0 ? '+' : ''}${offset})`;

      return (
        formatTime(time * 1000, {
          withRelativeTime: true,
          locale: 'en',
        }) + utcString
      );
    });
  }

  return content;
};

export const formatRoundMinute = (min: number) => {
  if (!min) {
    return `0 minute`;
  }

  // fix event all day
  if ((min * 60) % 86400 === 86399) {
    min = (min * 60 + 1) / 60;
  }

  if (min % 1440 === 0) {
    const d = min / 1440;

    return `${d} ${d > 1 ? 'days' : 'day'}`;
  }

  if (min % 60 === 0) {
    const h = min / 60;

    return `${h} ${h > 1 ? 'hours' : 'hour'}`;
  }

  return min === 1 ? `1 minute` : `${min} minutes`;
};

export function formatDurationSeconds(startAt: number, timeStamp?: number): string {
  const sec = Math.floor((timeStamp || Date.now()) / 1000 - startAt);
  const fixNumber = (num: number, length: number) => {
    return ('' + num).length < length
      ? (new Array(length + 1).join('0') + num).slice(-length)
      : '' + num;
  };
  let t = Math.max(sec, 0);
  let hours = 0;
  let minutes = 0;
  if (t >= 3600) {
    hours = Math.floor(t / 3600);
    t %= 3600;
  }
  if (t >= 60) {
    minutes = Math.floor(t / 60);
    t %= 60;
  }
  let result = '';
  if (hours) {
    result = `${hours}:`;
  }

  return `${result + fixNumber(minutes, 2)}:${fixNumber(t, 2)}`;
}

export const getOffsetString = (timeZone?: string) => {
  const now = timeZone ? dayjs().tz(timeZone) : dayjs();
  const offset = now.utcOffset();
  const offsetAbs = Math.abs(offset);

  return (
    `${offset >= 0 ? '+' : '-'}` +
    `0${offsetAbs / 60}`.slice(-2) +
    ':' +
    `0${offsetAbs % 60}`.slice(-2)
  );
};

export const getOffsetStringFromOffsetNumber = (offset: number) => {
  const utcOffset = offset * 60;
  const utcOffsetAbs = Math.abs(utcOffset);

  return (
    `${offset >= 0 ? '+' : '-'}` +
    `0${Math.floor(utcOffsetAbs / 60)}`.slice(-2) +
    ':' +
    `0${utcOffsetAbs % 60}`.slice(-2)
  );
};

export type WeekOfMonth = 1 | 2 | 3 | 4 | 5;

export const getDayOfMonth = (date: Dayjs): WeekOfMonth => {
  const startOfMonth = date.startOf('month');
  return (date.diff(startOfMonth, 'day') + 1) as WeekOfMonth;
};

/**
 * 获取一个日期是该月份的第几个指定的星期几
 * 例如：11月1号是周六，11月6号是第一个周四
 */
export const getNthWeekdayOfMonth = (date: Dayjs): WeekOfMonth => {
  const weekday = date.isoWeekday();
  const startOfMonth = date.startOf('month');

  // 找到该月第一个该星期几
  let firstOccurrence = startOfMonth;
  while (firstOccurrence.isoWeekday() !== weekday) {
    firstOccurrence = firstOccurrence.add(1, 'day');
  }

  // 如果第一个出现在月初之前的ISO周（跨月），则使用下一个
  if (firstOccurrence.month() !== date.month()) {
    firstOccurrence = firstOccurrence.add(7, 'day');
  }

  // 计算是第几个
  const diffDays = date.diff(firstOccurrence, 'day');
  return (Math.floor(diffDays / 7) + 1) as WeekOfMonth;
};

/**
 * 判断一个日期是否是该月的最后一个指定的星期几
 * 利用 getNthWeekdayOfMonth 来实现
 */
export const isLastWeekdayOfMonth = (date: Dayjs): boolean => {
  const weekday = date.isoWeekday();
  const endOfMonth = date.endOf('month');

  // 找到该月最后一个该星期几
  let lastOccurrence = endOfMonth;
  while (lastOccurrence.isoWeekday() !== weekday) {
    lastOccurrence = lastOccurrence.subtract(1, 'day');
  }

  // 确保是在当前月份内
  if (lastOccurrence.month() !== date.month()) {
    lastOccurrence = lastOccurrence.subtract(7, 'day');
  }

  // 使用 getNthWeekdayOfMonth 比较
  const targetNth = getNthWeekdayOfMonth(date);
  const lastNth = getNthWeekdayOfMonth(lastOccurrence);

  return targetNth === lastNth;
};

export const isBotId = (id: string) => {
  if (typeof id !== 'string') {
    return false;
  }

  const MAX_BOT_ID_LENGHT = 6;
  const idLen = id.trim().replace(/^\+/, '').length;
  if (idLen && idLen <= MAX_BOT_ID_LENGHT) {
    return true;
  }

  return false;
};

export function getInitials(name?: string): string | undefined {
  if (!name) {
    return;
  }

  const cleaned = removeNonInitials(name);
  const parts = cleaned.split(' ');
  const initials = parts.map(part => part.trim()[0]);
  if (!initials.length) {
    return;
  }

  return initials.slice(0, 1).join('');
}

type Option = {
  nearst?: number;
  type?: 'round' | 'before' | 'next';
  timeZone?: string;
};

export const estimateTime = (day: Dayjs, option: Option = {}) => {
  const { nearst = 10, type = 'next', timeZone } = option;
  const minutes = 1000 * 60 * nearst;
  const timeStamp = day.unix() * 1000;
  const Map = {
    round: 'round',
    before: 'floor',
    next: 'ceil',
  };

  const handler = Math[Map[type] as 'round' | 'floor' | 'ceil'];
  const result = dayjs(handler(timeStamp / minutes) * minutes);

  return timeZone ? result.tz(timeZone) : result;
};

export const getLeftTime = (time: number) => {
  const now = Date.now();
  return Math.ceil(now / time) * time - now;
};

type LoopCall = (
  timer: number,
  option?: Partial<{ immediate: boolean; type: 'normal' | 'next' }>
) => (fn: () => Promise<boolean | void>) => void;

export const loopCall: LoopCall =
  (time, option = {}) =>
  async callbackFn => {
    const { immediate = false, type = 'normal' } = option;
    let timerId: any;

    const next = async (immediate = false) => {
      const leftTime = immediate ? 0 : type === 'next' ? getLeftTime(time) : time;
      timerId = setTimeout(async () => {
        const shouldStop = await callbackFn();
        console.log('next call', shouldStop);
        if (shouldStop) {
          clearTimeout(timerId);
          timerId = undefined;
          return;
        }

        next();
      }, leftTime);
    };

    next(immediate);
  };

const initDayjs = (locale: 'en' | 'zh-cn' = 'en') => {
  dayjs.extend(duration);
  dayjs.extend(relativeTime);
  dayjs.extend(isToday);
  dayjs.extend(isTomorrow);
  dayjs.extend(isYesterday);
  dayjs.extend(localizedFormat);
  dayjs.extend(updateLocale);
  dayjs.extend(utc);
  dayjs.extend(timezone);
  dayjs.extend(isoWeek);
  dayjs.extend(isBetween);
  dayjs.locale(locale);
};

export { initDayjs };

export const getUtcOffset = (timeZone?: string) => {
  const now = timeZone ? dayjs().tz(timeZone) : dayjs();
  const hours = now.utcOffset() / 60;

  return `UTC${hours < 0 ? '' : '+'}${hours}`;
};

export type CalendarItem = {
  cid: string;
  name: string;
  timeZone: string;
  role: 'host' | 'proxy' | 'merger';
  timeZoneName: string;
  events: any[];
};

export const formatDashboardResponse = (
  data: {
    myCalendar: CalendarItem[];
    otherCalendar: CalendarItem[];
    version: number;
  },
  myId: string
) => {
  const getCalendarType = (role: CalendarItem['role']) => {
    switch (role) {
      case 'proxy':
        return 'proxy';
      case 'merger':
        return 'merge';
      default:
        return 'self';
    }
  };

  const myCalendar = new Map<string, 1>();
  const [{ result: myEvents, users: myUsers }, { result: otherEvents, users: otherUsers }] = (
    ['myCalendar', 'otherCalendar'] as const
  ).map(key => {
    const calendar = data[key];
    const initialData = { result: [], users: [], version: 0 } as {
      result: any[];
      users: any[];
    };
    if (!isValidArray(calendar)) {
      return initialData;
    }
    const isMyCalendar = key === 'myCalendar';
    const userIds = calendar.map((user: any) => cid2uid(user.cid));
    fetchUserInfo(userIds);
    const isExistInMyCalendar = (cid: string) => !isMyCalendar && myCalendar.has(cid);

    return calendar.reduce((sum, user) => {
      const picked = pick(user, ['cid', 'name', 'timeZone', 'role', 'timeZoneName']);
      const calendarType = getCalendarType(user.role);
      if (isMyCalendar) {
        myCalendar.set(user.cid, 1);
      } else if (isExistInMyCalendar(user.cid)) {
        return sum;
      }
      sum.users.push({ ...picked, calendarType, cname: user.name, id: cid2uid(user.cid) });
      sum.result.push(
        ...(user.events ?? []).map((item: any) => ({
          ...item,
          id: cid2uid(user.cid),
          cname: user.name,
          timeZone: user.timeZone,
          isBusy: !isMyCalendar,
          topic: isMyCalendar ? item.topic : 'Busy',
          role: user.role,
          isBossProxy: user.role === 'proxy',
          calendarType,
        }))
      );

      return sum;
    }, initialData);
  });

  const myCid = uid2cid(myId);

  console.log('myUsers', myUsers, otherUsers);

  return {
    version: data.version,
    events: [...myEvents, ...otherEvents],
    myUsers: myUsers.sort((a, b) => (a.cid === myCid ? -1 : b.cid === myCid ? 1 : 0)),
    otherUsers,
  };
};

export const formarDetailResponse = (data: any, myTimeZone: string) => {
  const { event, ...extraInfo } = data;
  const groupUserMap = new Map<string, 1>();
  const userIds = event.attendees.map((atd: any) => atd.uid);
  fetchUserInfo(userIds);
  const members = event.attendees
    .map((atd: any) => {
      if (atd.isGroupUser) {
        groupUserMap.set(atd.uid, 1);
      }
      return {
        ...atd,
        id: atd.uid,
      };
    })
    .filter(Boolean);
  let duration = (event.end - event.start) / 60;
  const currentUid = cid2uid(extraInfo.cid);

  if (event.isAllDay && event.allDayStart && event.allDayEnd) {
    event.start = dayjs(event.allDayStart, 'YYYYMMDD').tz(myTimeZone, true).unix();
    duration =
      dayjs(event.allDayEnd, 'YYYYMMDD').diff(dayjs(event.allDayStart, 'YYYYMMDD'), 'minutes') - 1;
  }

  const date = dayjs(event.start * 1000).tz(myTimeZone);
  const time = date.clone();

  return {
    ...event,
    ...extraInfo,
    members,
    duration,
    groupInfo: {
      ...(event.group || {}),
      userMap: groupUserMap,
    },
    meetingName: event?.topic,
    mode: 'view',
    currentUserId: currentUid,
    isEvent: event.category === 'event',
    date,
    time,
    showMore: true,
    calendarId: extraInfo.cid,
  } as DetailData;
};

export const copyText = (text: string) => navigator.clipboard.writeText(text);

export const stopClick = (e: React.MouseEvent) => {
  e.stopPropagation();
  e.preventDefault();
};

export const getSimpleName = (name: string) => {
  if (!name) {
    return '';
  }
  return name.slice(0, name.indexOf('('));
};

export const sortUserList = (arr: any[]) => {
  arr.sort((a, b) => {
    if (a.role === 'host') {
      return -1;
    }
    if (b.role === 'host') {
      return 1;
    }
    if (a.isMe) {
      return -1;
    }
    if (b.isMe) {
      return 1;
    }
    // sort by name
    if (a.name && !b.name) {
      return -1;
    }
    if (!a.name && b.name) {
      return 1;
    }
    if (!a.name && !b.name) {
      return -1;
    }
    const _a = a.name.slice(0, 1).toLowerCase();
    const _b = b.name.slice(0, 1).toLowerCase();
    return _a < _b ? -1 : 1;
  });
  return arr;
};

export const formatTZ = (tz = '') => {
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

export const isSearchMatchId = (searchText: string) => /^(\+)?\d{11}$/.test(searchText);

export const getRealId = (uid: string) => (uid.startsWith('+') ? uid : `+${uid}`);
