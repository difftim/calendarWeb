import dayjs, { Dayjs } from 'dayjs';
import { uniqBy } from 'lodash';
import lzString from 'lz-string';

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

  return uniqBy(result, 'eid').length;
};

export const fixScrollToTimePosition = () => {
  const content = document.querySelector('.rbc-time-content');
  const viewHeight = content?.children[0]?.clientHeight;
  if (viewHeight && content && content.scrollTop === 0) {
    content.scrollTop = (9.5 / 24) * viewHeight;
  }
};

export const getMeetingFeatureEnabled = (feature: string, version: number) => {
  // Mock implementation for web version
  return false;
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
