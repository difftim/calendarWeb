// @ts-nocheck
import { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dayjs, { Dayjs } from 'dayjs';
import lzString from 'lz-string';
import { pick, uniq } from 'lodash';

import { cid2uid, inThisWeek, isValidArray, uid2cid } from '@/util';
import { unstable_batchedUpdates } from 'react-dom';
import { getWebApi, getUserBaseInfo } from '@/shims/globalAdapter';

const getCheckedCalendarFromCache = (name: string, defaults: string[] = []) => {
  try {
    const res = localStorage.getItem(name);
    return res ? uniq([...defaults, ...JSON.parse(res)]) : defaults;
  } catch (error) {
    return defaults;
  }
};

const getCacheData = (date: Dayjs, timezone?: string, cacheName = 'myEvents') => {
  let initialData;
  let initialDataUpdatedAt;
  if (inThisWeek(date, timezone)) {
    const _data = localStorage.getItem(cacheName);
    if (_data) {
      try {
        const cacheData = JSON.parse(lzString.decompress(_data));
        initialData = cacheData.initialData;
        initialDataUpdatedAt = cacheData.initialDataUpdatedAt;
        const startTime = cacheData.startTime || 0;

        if (startTime !== dayjs().startOf('week').unix()) {
          localStorage.removeItem(cacheName);
          throw Error('stale events, should drop');
        }
      } catch (error) {
        initialData = initialDataUpdatedAt = undefined;
      }
    }
  }

  return initialData && initialDataUpdatedAt
    ? {
        initialData,
        initialDataUpdatedAt,
      }
    : {};
};

const formatDashboardResponse = (data: any[] = [], ourNumber?: string) => {
  const initialData = { result: [], users: [] };

  if (!isValidArray(data)) {
    return initialData;
  }

  const getCalendarType = (user: any, isMyCalendar = false, isProxy = false) => {
    if (!isMyCalendar) {
      return 'other';
    }
    if (isProxy) {
      return 'proxy';
    }
    if (ourNumber && user.cid !== uid2cid(ourNumber)) {
      return 'merge';
    }
    return 'self';
  };

  const res: { result: any[]; users: any[] } = data.reduce((sum, user) => {
    const picked = pick(user, ['cid', 'name', 'timeZone', 'role', 'timeZoneName']);
    const calendarType = getCalendarType(user, !!ourNumber, user.role === 'proxy');
    sum.users.push({ ...picked, calendarType });
    sum.result.push(
      ...(user.events ?? []).map((item: any) => ({
        ...item,
        cname: user.name,
        timeZone: user.timeZone,
        isBusy: !ourNumber,
        topic: ourNumber ? item.topic : 'Busy',
        role: user.role,
        isBossProxy: user.role === 'proxy',
        calendarType,
      }))
    );

    return sum;
  }, initialData);

  return res;
};

export const getQueryKey = (date: Dayjs, timeZone?: string) => {
  const d = date.tz(timeZone);
  return [d.startOf('week'), d.endOf('week')].map(d => d.format('YYYY-MM-DD')).join('_');
};

export const useQueryMyEvents = (
  timeInfo: any,
  ourNumber: string,
  isForceUpdate: { current: boolean }
) => {
  const [myCalendar, setMyCalendar] = useState<any[]>([]);
  const [otherCalendar, setOtherCalendar] = useState<any[]>([]);
  const { date, timeZone } = timeInfo.current;

  const [myCalendarChecked, setMyCalendarChecked] = useState<string[]>(() =>
    getCheckedCalendarFromCache('myChecked', [ourNumber])
  );
  const [otherCalendarChecked, setOtherCalendarChecked] = useState<string[]>(() =>
    getCheckedCalendarFromCache('otherChecked')
  );

  const checkedCalendar = useMemo(
    () => [...myCalendarChecked, ...otherCalendarChecked],
    [myCalendarChecked, otherCalendarChecked]
  );

  const queryOption = useMemo(() => {
    const queryKey = getQueryKey(date, timeZone);

    return {
      queryKey: ['myEvents', queryKey],
      cacheOption: getCacheData(date, timeZone),
    };
  }, [date, timeZone]);

  const queryFn = useCallback(async () => {
    const getSchedulerDashboard = getWebApi()?.getSchedulerDashboard;
    if (!getSchedulerDashboard) {
      throw Error('not ready!');
    }

    const { date: d, timeZone: tz } = timeInfo.current;
    const start = d.tz(tz).startOf('week').unix();
    const end = d.tz(tz).endOf('week').unix();

    const res = await getSchedulerDashboard({ start, end });

    if (res.status !== 0) {
      throw Error('network error!');
    }

    const version = res.data?.version || 0;
    const localVersion = getCachedCalendarVersion();

    const bossCalendar =
      res.data.myCalendar
        .filter((item: any) => item.role === 'proxy')
        .map((bossItem: any) => ({
          cid: bossItem.cid,
          timeZone: bossItem.timeZoneName,
          name: bossItem.name,
        })) || [];

    localStorage.setItem('bossCalendar', JSON.stringify(bossCalendar));

    if (version === 0 || version >= localVersion || isForceUpdate.current) {
      localStorage.setItem('cachedCalendarVersion', version.toString());
      if (inThisWeek(d, tz)) {
        const initialDataUpdatedAt = Date.now();
        const initialData = res.data;
        const dataToCache = lzString.compress(
          JSON.stringify({
            initialData,
            initialDataUpdatedAt,
            startTime: start,
          })
        );
        localStorage.setItem('myEvents', dataToCache);
      }

      return res.data;
    }

    console.log(
      `server version is lower than client, just ignore! [server]:${version} [client]: ${localVersion}`
    );

    throw Error('server version is lower than client, just ignore');
  }, [date, timeZone]);

  const { data, refetch, isFetched, isFetching } = useQuery({
    enabled: Boolean(ourNumber),
    queryKey: queryOption.queryKey,
    queryFn,
    keepPreviousData: true,
    staleTime: Infinity,
    cacheTime: Infinity,
    ...queryOption.cacheOption,
  });

  const sortByName = (a: any, b: any) => {
    if (a.isMe && !b.isMe) {
      return -1;
    }

    if (!a.isMe && b.isMe) {
      return 1;
    }

    const aName: string = a.cname || a.name;
    const bName: string = b.cname || b.name;

    if (aName && bName) {
      if (aName.toLowerCase() < bName.toLowerCase()) {
        return -1;
      }

      if (aName.toLowerCase() > bName.toLowerCase()) {
        return 1;
      }

      return a.id > b.id ? 1 : -1;
    }

    if (aName && !bName) {
      return -1;
    }

    if (!aName && bName) {
      return 1;
    }

    return a.id > b.id ? 1 : -1;
  };

  const { users: _myCalendar, result: myEvents } = useMemo(
    () => formatDashboardResponse(data?.myCalendar || [], ourNumber),
    [data?.myCalendar, ourNumber]
  );

  const { users: _otherCalendar, result: otherEvents } = useMemo(
    () => formatDashboardResponse(data?.otherCalendar || []),
    [data?.otherCalendar]
  );

  useLayoutEffect(() => {
    const userInMyCalendar = new Map();

    unstable_batchedUpdates(() => {
      setMyCalendar(
        (_myCalendar ?? [])
          .map((item: any) => {
            userInMyCalendar.set(item.cid, 'baye');
            const info = getUserBaseInfo(cid2uid(item.cid));
            const userInfo = {
              ...info,
              cname: item.name,
              role: item.role,
              timeZoneName: item.timeZoneName,
              email: info.email || '',
              calendarType: item.calendarType,
            };

            userInfo.timeZone = userInfo.timeZone ?? item.timeZone;

            return userInfo;
          })
          .sort(sortByName)
      );

      // 删除已经不在 myCalendar 但是还存在 checked 里的
      isFetched &&
        setMyCalendarChecked((list: any[] = []) => {
          const newList = uniq(
            list.filter(id => _myCalendar.some(item => cid2uid(item.cid) === id)).concat(ourNumber)
          );

          localStorage.setItem('myChecked', JSON.stringify(newList));

          return newList;
        });
    });

    // 兼容异常情况，过滤已经存在myCalendar里的
    const filteredOtherCalendar: any[] = [];

    (_otherCalendar ?? []).forEach((item: any) => {
      if (!userInMyCalendar.has(item.cid)) {
        const info = getUserBaseInfo(cid2uid(item.cid));
        const userInfo = {
          ...info,
          cname: item.name || info.name,
          email: info.email || '',
        };

        userInfo.timeZone = userInfo.timeZone ?? item.timeZone;
        filteredOtherCalendar.push(userInfo);
      }
    });

    unstable_batchedUpdates(() => {
      setOtherCalendar(filteredOtherCalendar.sort(sortByName));
      // 删除已经不在 otherCalendar 但是还存在 checked 里的
      isFetched &&
        setOtherCalendarChecked((list: any[] = []) => {
          const newList = list.filter(id => filteredOtherCalendar.some(item => item.id === id));

          localStorage.setItem('otherChecked', JSON.stringify(newList));

          return newList;
        });
    });
  }, [_myCalendar, _otherCalendar, isFetched]);

  return {
    myCalendar,
    otherCalendar,
    setMyCalendar,
    setOtherCalendar,
    myCalendarChecked,
    setMyCalendarChecked,
    otherCalendarChecked,
    setOtherCalendarChecked,
    data: useMemo(() => [...myEvents, ...otherEvents], [myEvents, otherEvents]),
    refetch,
    isFetched,
    checkedCalendar,
    loading: isFetching,
  };
};
