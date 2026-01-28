import dayjs from 'dayjs';
import { useSetDetailData } from './useDetailData';
import { DetailData, showPannelAtom } from '@/atoms/detail';
import { estimateTime, getSimpleName, uid2cid } from '@/util';
import { useSetAtom } from 'jotai';
import { unstable_batchedUpdates } from 'react-dom';
import { useGetAtom } from './useGetAtom';
import { currentScheduleDetailInfoAtom, userInfoAsyncAtom } from '@/atoms';
import { toastError } from '@/shared/Message';

export const useCreateSchedule = (timeZone: string) => {
  const setCurrentScheduleInfo = useSetAtom(currentScheduleDetailInfoAtom);
  const setDetailData = useSetDetailData();
  const setShowPannel = useSetAtom(showPannelAtom);
  const getMyInfo = useGetAtom(userInfoAsyncAtom);

  const createSchedule = async (
    eventType: string,
    options?: {
      start?: number;
      end?: number;
      resourceId?: string;
      freeTimeId?: string;
      isBossProxy?: boolean;
      topic?: string;
      members?: any[];
    }
  ) => {
    const myInfo = await getMyInfo();
    if (!myInfo.id) {
      toastError('Unsupport platform');
      return;
    }
    const name = getSimpleName(myInfo.name);
    const isLiveStream = eventType === 'livestream';
    const isEvent = eventType === 'event';
    const baseCreateInfo: Partial<DetailData> = {
      mode: 'create',
      host: myInfo.id,
      hostInfo: {
        uid: myInfo.id,
        name: myInfo.name,
      },
      source: 'difft',
      calendarId: uid2cid(myInfo.id),
      loading: false,
      isGroup: false,
      isLiveStream,
      isEvent,
      category: isEvent ? 'event' : 'meeting',
      topic: isLiveStream ? `Live Stream` : `${name}'s ${isEvent ? 'Event' : 'Meeting'}`,
      members: [
        {
          uid: myInfo.id,
          name,
          email: myInfo.email,
          role: 'host',
          going: 'maybe',
          isGroupUser: false,
          isRemovable: false,
        },
      ],
    };
    if (options?.start) {
      const _start = options.start;
      const now = dayjs();
      const start = _start < now.unix() ? estimateTime(now, { type: 'next' }).unix() : _start;
      const end = options.end ? options.end : start + 30 * 60;

      baseCreateInfo.start = start;
      baseCreateInfo.end = end;
      baseCreateInfo.date = dayjs(start * 1000).tz(timeZone);
      baseCreateInfo.time = dayjs(start * 1000).tz(timeZone);
      baseCreateInfo.duration = end > start ? Math.round((end - start) / 60) : 30;
    } else {
      const now = dayjs().tz(timeZone);
      const date = estimateTime(now.add(5, 'minute'), { type: 'next' });
      baseCreateInfo.time = date;
      baseCreateInfo.start = date.unix();
      baseCreateInfo.end = date.add(30, 'minutes').unix();
      baseCreateInfo.duration = 30;
    }

    if (options?.topic) {
      baseCreateInfo.topic = options.topic;
    }
    if (options?.members) {
      baseCreateInfo.members = options.members;
    }

    unstable_batchedUpdates(() => {
      setDetailData(baseCreateInfo);
      setShowPannel(true);
      if (options?.freeTimeId) {
        setCurrentScheduleInfo(prev => ({
          ...prev,
          currentFreeTimeId: options.freeTimeId!,
        }));
      }
    });
  };
  return { createSchedule };
};
