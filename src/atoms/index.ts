import { atom } from 'jotai';
import dayjs, { Dayjs } from 'dayjs';
import { atomWithStorage, loadable } from 'jotai/utils';
import { uniq } from 'lodash';
import { initDayjs } from '@/util';
import { getUserInfo, isBridgeSupported, initialize } from '@difftim/jsbridge-utils';
import { fetchUserInfo } from './userInfo';

initDayjs();

const initialPromise = new Promise(resolve => {
  initialize({ defaultTimeoutMs: 5 * 1000 })
    .then(() => resolve(true))
    .catch(() => resolve(false));
});

// 异步 atom，存储 isBridgeSupported 的结果
const bridgeSupportedAsyncAtom = atom(async () => {
  try {
    const isInitialized = await initialPromise;
    if (!isInitialized) {
      return false;
    }
    return await isBridgeSupported();
  } catch {
    return false;
  }
});

const initializeAsyncAtom = atom(async () => {
  try {
    await initialize();
    return true;
  } catch {
    return false;
  }
});

export const bridgeInitializedAtom = loadable(initializeAsyncAtom);

export const userInfoAsyncAtom = atom(async () => {
  try {
    const info = await getUserInfo({ timeoutMs: 1000 });
    fetchUserInfo([info.id]);
    return info;
  } catch {
    return { id: '', name: '', email: '' };
  }
});

export const userInfoLoadableAtom = loadable(userInfoAsyncAtom);

// 使用 loadable 包装，可以同步获取状态
export const bridgeSupportedAtom = loadable(bridgeSupportedAsyncAtom);

const userIdAsyncAtom = atom(async get => {
  const info = await get(userInfoAsyncAtom);
  return info.id || '';
});

// 使用 loadable 包装，可以同步获取状态而不触发 Suspense
export const userIdLoadableAtom = loadable(userIdAsyncAtom);

// 提供一个同步版本的 userId atom，在加载完成前返回空字符串
export const userIdAtom = atom(get => {
  const userIdLoadable = get(userIdLoadableAtom);
  if (userIdLoadable.state === 'hasData') {
    return userIdLoadable.data;
  }
  return '';
});

export const userInfoAtom = atom(get => {
  const userInfoLoadable = get(userInfoLoadableAtom);
  if (userInfoLoadable.state === 'hasData') {
    return userInfoLoadable.data;
  }
  return { id: '', name: '', email: '' };
});
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
    const userInfo = get(userInfoAtom);
    if (userInfo.id) {
      return uniq([userInfo.id, ...myCalendarChecked]);
    }
    return uniq(myCalendarChecked);
  },
  (_, set, value: string[] | ((prev: string[]) => string[])) => {
    set(_myCalendarCheckedAtom, value);
  }
);

export const bossCalendarAtom = atomWithStorage<{ cid: string; timeZone: string; name: string }[]>(
  'bossCalendar',
  []
);

export const userCacheAtom = atom<
  Map<
    string,
    {
      id: string;
      name: string;
      email?: string;
      avatarPath?: string;
      avatar?: string;
      timeZone?: string;
    }
  >
>(new Map());

// 主题 atom - 由 main.tsx 在启动时通过 store.set 初始化
export const themeAtom = atom<'light' | 'dark'>('light');
