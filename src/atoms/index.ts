import { atom } from 'jotai';
import dayjs, { Dayjs } from 'dayjs';
import { atomWithStorage } from 'jotai/utils';
import { uniq } from 'lodash';
import { initDayjs } from '@/util';

initDayjs();

export const userIdAtom = atom<string>('111111');
export const isSystemTimeZoneAtom = atom(true);
export const timeZoneAtom = atom<string>(dayjs.tz.guess());
export const _dateAtom = atom<Dayjs>(dayjs());
export const localeAtom = atom<'en' | 'zh-cn'>('en');
export const dateAtom = atom(
  get => {
    const tz = get(timeZoneAtom);
    const locale = get(localeAtom);
    if (tz) {
      return get(_dateAtom).tz(tz).locale(locale).startOf('day');
    }
    return get(_dateAtom).locale(locale).startOf('day');
  },
  (_, set, nextDate: Dayjs) => {
    set(_dateAtom, nextDate);
  }
);

const _showDateAtomStorage = atom<Dayjs | undefined>(undefined);

export const showDateAtom = atom(
  get => {
    const stored = get(_showDateAtomStorage);
    const tz = get(timeZoneAtom);
    // 如果已经通过 set 设置过值，使用存储的值；否则使用 _showDateAtom 的值
    return stored !== undefined ? stored.tz(tz) : get(dateAtom).startOf('day');
  },
  (_get, set, value: Dayjs) => {
    // 通过 set 设置值时，存储到内部 atom
    set(_showDateAtomStorage, value);
  }
);

export const currentScheduleDetailInfoAtom = atom<{
  selectItem: any;
  currentFreeTimeId: string;
  currentEid: string;
  currentCid: string;
  currentSource: string;
}>({
  selectItem: null, // 临时event，选中slot触发
  currentFreeTimeId: '', // 空闲时间中选中的id
  currentEid: '',
  currentCid: 'default',
  currentSource: '',
});

const _myCalendarCheckedAtom = atomWithStorage<string[]>('myChecked', []);
export const otherCalendarCheckedAtom = atomWithStorage<string[]>('otherChecked', []);
export const calendarVersionAtom = atomWithStorage<number>('calendarVersion', 0);
export const myCalendarCheckedAtom = atom(
  get => {
    const myCalendarChecked = get(_myCalendarCheckedAtom);
    const ourNumber = get(userIdAtom);
    return uniq([ourNumber, ...myCalendarChecked]);
  },
  (_, set, value: string[] | ((prev: string[]) => string[])) => {
    set(_myCalendarCheckedAtom, value);
  }
);

export const bossCalendarAtom = atomWithStorage<{ cid: string; timeZone: string; name: string }[]>(
  'bossCalendar',
  []
);
