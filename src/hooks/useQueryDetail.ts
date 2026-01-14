import { timeZoneAtom } from '@/atoms';
import { useGetAtom } from './useGetAtom';
import { getMeetingScheduleDetail } from '@/shims/globalAdapter';
import { toastError } from '@/components/shared/Message';
import { formarDetailResponse } from '@/util';
import { DetailData } from '@/atoms/detail';

export const useQueryDetail = () => {
  const getTimeZone = useGetAtom(timeZoneAtom);
  const getDetailData = async (eventId: string, calendarId: string, source: string) => {
    try {
      const data = await getMeetingScheduleDetail({
        eventId,
        calendarId,
        source,
      });
      const myTimeZone = getTimeZone();
      const result = formarDetailResponse(data, myTimeZone) as DetailData;

      return result;
    } catch (error: any) {
      toastError(error?.message || 'request error');
      throw error;
    }
  };

  return {
    getDetailData,
  };
};
