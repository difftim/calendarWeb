// for jotai-tanstack-query

import { store } from './store';
import { atomWithQuery } from 'jotai-tanstack-query';
import { cid2uid, formatDashboardResponse } from '@/util';
import {
  dateAtom,
  userIdAtom,
  calendarVersionAtom,
  bossCalendarAtom,
  bridgeSupportedAtom,
  myCalendarCheckedAtom,
  otherCalendarCheckedAtom,
} from './index';
import { DetailData, schedulerDataAtom } from './detail';
import { getSchedulerCreateConfig, getSchedulerDashboard } from '@/api';

// calendar 列表
export const calendarQueryAtom = atomWithQuery(get => {
  const date = get(dateAtom);
  const userId = get(userIdAtom);
  const bridgeSupportedLoadable = get(bridgeSupportedAtom);
  // loadable 返回 { state: 'loading' | 'hasData' | 'hasError', data?: T }
  // 只有当 state 为 'hasData' 且 data 为 true 时才启用查询
  const isBridgeSupported =
    bridgeSupportedLoadable.state === 'hasData' && bridgeSupportedLoadable.data === true;
  const startDate = date.startOf('week');
  const endDate = date.endOf('week');
  const queryKey = [startDate, endDate].map(d => d.format('YYYY-MM-DD')).join('_');
  console.log('userInfo...', userId, isBridgeSupported);

  return {
    queryKey: ['myEvents', queryKey],
    enabled: Boolean(userId) && isBridgeSupported,
    keepPreviousData: true,
    refetchOnReconnect: true,
    refetchInterval: 60 * 60 * 1000, // 30 minutes
    staleTime: Infinity,
    cacheTime: Infinity,
    retry: false,
    queryFn: async () => {
      console.log('🔵 Query triggered!', new Date().toISOString());
      const data = await getSchedulerDashboard({ start: startDate.unix(), end: endDate.unix() });
      const version = data.version || 0;
      const localVersion = get(calendarVersionAtom);
      if (version < localVersion && version !== 0) {
        console.log(`server version unmatch, [server]:${version} [client]: ${localVersion}`);
        throw Error('server version is lower than client, just ignore');
      }

      const bossCalendar = data.myCalendar
        .filter((item: any) => item.role === 'proxy')
        .map((bossItem: any) => ({
          cid: bossItem.cid,
          timeZone: bossItem.timeZoneName,
          name: bossItem.name,
        }));

      store.set(bossCalendarAtom, bossCalendar);
      const result = formatDashboardResponse(data, userId) as any;
      store.set(calendarVersionAtom, version);

      // 过滤 myCalendarChecked，只保留存在于返回数据中的
      const myUsers = result.myUsers || [];
      const otherUsers = result.otherUsers || [];
      store.set(myCalendarCheckedAtom, prev =>
        prev.filter((id: string) => myUsers.some((user: any) => cid2uid(user.cid) === id))
      );
      store.set(otherCalendarCheckedAtom, prev =>
        prev.filter((id: string) => otherUsers.some((user: any) => cid2uid(user.cid) === id))
      );

      return result;
    },
  };
});

export const queryScheduleConfigAtom = atomWithQuery(get => {
  const { mode, calendarId } = get(schedulerDataAtom) as DetailData;
  const myUid = get(userIdAtom);

  return {
    queryKey: ['googleSyncConfig'],
    staleTime: 0,
    enabled: Boolean(myUid) && mode === 'create',
    queryFn: async () => {
      try {
        console.log('do query ----->', mode, calendarId);
        if (mode !== 'create' || !calendarId) {
          return false;
        }
        const res = await getSchedulerCreateConfig(calendarId);
        return res.data?.canSyncGoogle || false;
      } catch {
        return false;
      }
    },
  };
});
