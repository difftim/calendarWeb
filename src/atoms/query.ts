// for jotai-tanstack-query

import { store } from './store';
import { atomWithQuery } from 'jotai-tanstack-query';
import { formatDashboardResponse } from '@/util';
import { getSchedulerCreateConfig, getSchedulerDashboard } from '@/shims/globalAdapter';
import { dateAtom, userIdAtom, calendarVersionAtom, bossCalendarAtom } from './index';
import { DetailData, schedulerDataAtom } from './detail';

// calendar 列表
export const calendarQueryAtom = atomWithQuery(get => {
  const date = get(dateAtom);
  const userId = get(userIdAtom);
  const startDate = date.startOf('week');
  const endDate = date.endOf('week');
  const queryKey = [startDate, endDate].map(d => d.format('YYYY-MM-DD')).join('_');

  return {
    queryKey: ['myEvents', queryKey],
    enabled: Boolean(userId),
    keepPreviousData: true,
    refetchOnReconnect: true,
    refetchInterval: 60 * 60 * 1000, // 30 minutes
    staleTime: Infinity,
    cacheTime: Infinity,
    retry: 3,
    queryFn: async () => {
      console.log('🔵 Query triggered!', new Date().toISOString());
      const res = await getSchedulerDashboard({ start: startDate.unix(), end: endDate.unix() });
      if (res.status !== 0 || !res.data) {
        throw Error('network error!');
      }
      const version = res.data?.version || 0;
      const localVersion = get(calendarVersionAtom);
      if (version < localVersion && version !== 0) {
        console.log(`server version unmatch, [server]:${version} [client]: ${localVersion}`);
        throw Error('server version is lower than client, just ignore');
      }

      const bossCalendar = res.data.myCalendar
        .filter((item: any) => item.role === 'proxy')
        .map((bossItem: any) => ({
          cid: bossItem.cid,
          timeZone: bossItem.timeZoneName,
          name: bossItem.name,
        }));

      store.set(bossCalendarAtom, bossCalendar);

      return formatDashboardResponse(res.data);
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
