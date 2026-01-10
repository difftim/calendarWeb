import { timeZoneAtom } from '@/atoms';
import { useGetAtom } from './useGetAtom';
import { getMeetingScheduleDetail } from '@/shims/globalAdapter';
import { toastError } from '@/components/shared/Message';
import { formarDetailResponse } from '@/util';
import { DetailData } from '@/atoms/detail';

export const useQueryDetail = () => {
  const getTimeZone = useGetAtom(timeZoneAtom);
  const getDetailData = async (eventId: string, calendarId: string, source: string) => {
    const res = await getMeetingScheduleDetail({
      eventId,
      calendarId,
      source,
    });
    if (res.status !== 0 || !res.data) {
      toastError(res.reason);
      throw Error(res.reason || res.data);
    }
    const myTimeZone = getTimeZone();
    return formarDetailResponse(res.data, myTimeZone) as DetailData;
  };

  return {
    getDetailData,
  };
};
