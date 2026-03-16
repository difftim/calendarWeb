// for jotai-tanstack-query

import { store } from './store';
import { QueryClient } from '@tanstack/react-query';
import { atomWithQuery, queryClientAtom } from 'jotai-tanstack-query';

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

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
  },
});

// use the same queryClient
store.set(queryClientAtom, queryClient);

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

export type PrecreateConfig = {
  canSyncGoogle: boolean;
  availableBots: string[];
};

export const queryScheduleConfigAtom = atomWithQuery(get => {
  const { mode, calendarId, isEvent } = get(schedulerDataAtom) as DetailData;
  const myUid = get(userIdAtom);
  const isCreateMode = mode === 'create';
  const isUpdateMode = mode === 'update';

  return {
    queryKey: ['precreateConfig', calendarId, mode],
    staleTime: 0,
    enabled: Boolean(myUid) && (isCreateMode || isUpdateMode),
    queryFn: async (): Promise<PrecreateConfig> => {
      try {
        if (!calendarId) {
          return { canSyncGoogle: false, availableBots: [] };
        }
        const features = isUpdateMode
          ? ['availableBots']
          : ['canSyncGoogle', 'availableBots'];
        const res: any = await getSchedulerCreateConfig(calendarId, features);
        const config = res.data ?? res;
        return {
          canSyncGoogle: isCreateMode ? (config.canSyncGoogle || false) : false,
          availableBots: isEvent ? [] : (config.availableBots || []),
        };
      } catch {
        return { canSyncGoogle: false, availableBots: [] };
      }
    },
  };
});
