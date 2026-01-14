import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { getUserListInfo } from '@difftim/jsbridge-utils';
import { userCacheAtom } from './index';
import { store } from './store';

export type UserBaseInfo = {
  id: string;
  name: string;
  email?: string;
  avatarPath?: string;
  avatar?: string;
  timeZone?: string;
};

// 正在请求中的 id 集合，防止重复请求
const pendingRequests = new Set<string>();

// 批量请求队列，用于合并同一渲染周期内的多个请求
let batchQueue: Set<string> = new Set();
let batchScheduled = false;

/**
 * 将 id 加入批量请求队列
 * 使用 queueMicrotask 合并同一渲染周期内的所有请求
 */
export const queueFetchUserInfo = (id: string) => {
  const cache = store.get(userCacheAtom);

  // 已在缓存或已在请求中，跳过
  if (cache.has(id) || pendingRequests.has(id) || batchQueue.has(id)) {
    return;
  }

  batchQueue.add(id);

  // 如果还没调度过批量请求，则调度一次
  if (!batchScheduled) {
    batchScheduled = true;
    queueMicrotask(() => {
      const idsToFetch = Array.from(batchQueue);
      batchQueue = new Set();
      batchScheduled = false;

      if (idsToFetch.length > 0) {
        fetchUserInfo(idsToFetch);
      }
    });
  }
};

/**
 * 为每个用户 id 创建独立的 atom
 * - 首次访问时返回占位数据 { id, name: id }，并自动触发异步请求
 * - 异步请求完成后自动更新
 * - 结果会被缓存，下次访问直接返回缓存数据
 * - 同一渲染周期内的多个请求会被合并成一次 API 调用
 */
export const userInfoByIdAtom = atomFamily((id: string) =>
  atom<UserBaseInfo>(get => {
    const cache = get(userCacheAtom);
    if (cache.has(id)) {
      return cache.get(id)!;
    }
    // 触发批量请求（有防重复机制）
    if (id) {
      queueFetchUserInfo(id);
    }
    // 返回占位数据
    return { id, name: id };
  })
);

/**
 * 批量获取用户信息（异步）
 * 会自动更新缓存，并触发对应 atomFamily 的更新
 */
export const fetchUserInfo = async (ids: string[]): Promise<void> => {
  const cache = store.get(userCacheAtom);

  // 过滤出需要请求的 id（不在缓存且不在请求中）
  const idsToFetch = ids.filter(id => !cache.has(id) && !pendingRequests.has(id));

  if (idsToFetch.length === 0) return;

  // 标记为请求中
  idsToFetch.forEach(id => pendingRequests.add(id));

  try {
    console.log('js bridge fetchUserInfo....', idsToFetch);
    const userList = await getUserListInfo(idsToFetch);

    // 重新获取最新的缓存（避免覆盖其他并发请求的结果）
    const latestCache = store.get(userCacheAtom);
    const newCache = new Map(latestCache);

    userList.forEach(user => {
      newCache.set(user.id, user);
    });

    // 对于请求了但没返回的 id，也存入缓存（使用占位数据）
    idsToFetch.forEach(id => {
      if (!newCache.has(id)) {
        newCache.set(id, { id, name: id });
      }
    });

    store.set(userCacheAtom, newCache);
  } catch (e) {
    console.log('js bridge fetchUserInfo error', e);
    // 请求失败时，将请求的 id 存入缓存（使用占位数据），避免重复请求
    const latestCache = store.get(userCacheAtom);
    const newCache = new Map(latestCache);
    idsToFetch.forEach(id => {
      if (!newCache.has(id)) {
        newCache.set(id, { id, name: id });
      }
    });
    store.set(userCacheAtom, newCache);
  } finally {
    // 清除请求中标记
    idsToFetch.forEach(id => pendingRequests.delete(id));
  }
};

/**
 * 同步获取用户信息（仅从缓存读取）
 * 如果缓存中没有，返回占位数据并触发异步请求
 */
export const getUserBaseInfoSync = (id: string): UserBaseInfo => {
  const cache = store.get(userCacheAtom);
  if (cache.has(id)) {
    return cache.get(id)!;
  }
  // 触发异步请求，下次渲染时可能就有了
  if (id) {
    queueFetchUserInfo(id);
  }
  // 返回占位数据
  return { id, name: id, email: '' };
};
