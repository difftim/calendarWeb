import { useMemo } from 'react';

export enum StartType {
  comingSoon = 'comingSoon',
  incoming = 'incoming',
  start = 'start',
}

const useMeetingStatusCheck = (list: any[] = [], show: boolean, meetings: any = {}) => {
  const inDuration = (info: any, item: any) => {
    if (!info || !item.receiveNotification || item.going === 'no') {
      return false;
    }

    const threshold = 30;
    const now = Date.now();
    const isAfterStartIn5Mins = (item.start - 5 * 60 - threshold) * 1000 <= now;
    const isBeforeEnd = now <= (item.end + threshold) * 1000;

    return isAfterStartIn5Mins && isBeforeEnd;
  };

  const statusMap = useMemo(() => {
    const result = new Map();

    if (!show) {
      return result;
    }

    list.forEach(item => {
      const isGoogleMeet = !item.channelName && item.googleMeetingLink;
      const isOutlookMeet = !item.channelName && item.outlookMeetingLink;
      if (!!item.channelName || isGoogleMeet || isOutlookMeet) {
        const meetingKey = isGoogleMeet || isOutlookMeet ? item.eid : item.channelName;
        if (inDuration(meetings[meetingKey], item)) {
          result.set(item.eid, {
            type: StartType.incoming,
          });
        }
      }
    });

    return result;
  }, [list, meetings, show]);

  return { statusMap };
};

export default useMeetingStatusCheck;

