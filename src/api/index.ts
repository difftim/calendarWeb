import { CalendarUserItemData } from '@/pages/calendarSetting/utils';
import { request } from './request';

type Response<T> = Promise<{
  data: T;
  status: number;
  reason: string;
}>;

export const getSchedulerDashboard = ({ start, end, type }: any) => {
  const typeSuffix = type ? `&type=${type}` : '';
  return request
    .get(`v1/calendar/dashboard?start=${start}&end=${end}&t=${Date.now()}${typeSuffix}`)
    .json() as any;
};

export const addUserCalendar = (data: { cid: string; type: string; name?: string }) => {
  return request.post(`v1/user/calendar`, { json: data }).json();
};

export const deleteUserCalendar = (data: { cid: string; type: string }) => {
  return request.delete(`v1/user/calendar`, { json: data }).json();
};

export const updateUserCalendar = (data: { cid: string; type: string; name?: string }) => {
  return request.put(`v1/user/calendar`, { json: data }).json();
};

export const uploadIcsData = (data: { ics: string; email?: string }) => {
  return request.post(`v1/ics/upload`, { json: data }).json();
};

export const getProxyPermission = (
  type: 'given' | 'own' = 'own'
): Promise<{ given: CalendarUserItemData[]; own: CalendarUserItemData[] }> => {
  return request.get(`v1/proxy/permissions?type=${type}`).json();
};

export const addProxyPermission = (uid: string) => {
  return request.post(`v1/proxy/permissions`, { json: { users: [uid] } }).json();
};

export const deleteProxyPermission = (uid: string) => {
  return request.delete(`v1/proxy/permissions`, { json: { uid } }).json();
};

export const addLiveStreamToCalendar = (eid: string, cid = 'default') => {
  return request.post(`v1/calendar/${cid}/livestream`, { json: { eid } }).json();
};

export const deleteMeetingSchedule = (data: any) => {
  const { calendarId = 'default', eventId, isAllEvent = false, isRecurring = false } = data;

  return request
    .delete(
      `v1/calendar/${encodeURIComponent(calendarId)}/events/${eventId}?isAllEvent=${isAllEvent}&isRecurring=${isRecurring}`
    )
    .json();
};

export const goingScheduleMeeting = (data: any) => {
  const { eventId, calendarId, going, isRecurring, isAllEvent } = data;

  return request
    .put(`v1/calendar/${calendarId}/events/${eventId}/going`, {
      json: { going, isRecurring, isAllEvent },
    })
    .json();
};

export const scheduleMeetingReceiveNotify = (data: any) => {
  const {
    calendarId = 'default',
    eventId,
    receiveNotification = false,
    isRecurring = false,
    isAllEvent = false,
  } = data;

  return request
    .put(`v1/calendar/${encodeURIComponent(calendarId)}/events/${eventId}/notification`, {
      json: { isRecurring, isAllEvent, receiveNotification },
    })
    .json();
};

export const copyScheduleMeetingInfo = (data: any): Promise<{ content: string }> => {
  const { calendarId = 'default', eventId, action = 'copy' } = data;
  return request
    .get(
      `v1/calendar/${encodeURIComponent(calendarId)}/events/${eventId}/copy?type=difft&action=${action}`
    )
    .json();
};

export const getSchedulerCreateConfig = (calendarId: string) => {
  return request
    .post<{ data: { canSyncGoogle: boolean } }>(
      `v1/calendar/${encodeURIComponent(calendarId)}/events/precreate`,
      {
        json: {
          calendarId,
          features: ['canSyncGoogle'],
        },
      }
    )
    .json();
};

export const getSchedulerOrgInfo = () => {
  return request.get(`v1/org/users`).json();
};

export const getMeetingViewScheduleList = (data: any) => {
  const { users = [], start, end } = data;
  return request.post(`v1/user/freebusy`, { json: { users, start, end } }).json();
};

export const scheduleMeetingGetFreeTime = (data: any) => {
  const { uid, start, end } = data;
  return request.get(`v1/user/${uid}/freebusy?start=${start}&end=${end}`).json();
};

export const scheduleMeetingGetGroupFreeTime = (data: any) => {
  const { gid, start, end } = data;
  return request.get(`v1/group/${gid}/freebusy?start=${start}&end=${end}`).json();
};

export const createMeetingSchedule = (data: any): Response<{ eid: string }> => {
  const { calendarId = 'default', ...body } = data;
  return request
    .post(`v1/calendar/${encodeURIComponent(calendarId)}/events`, {
      json: body,
      headers: { 'x-full-response': '1' },
    })
    .json();
};

export const updateMeetingSchedule = (
  data: any
): Promise<{ data: { eid: string }; status: number; reason: string }> => {
  const { calendarId = 'default', eventId, ...body } = data;
  return request
    .put(`v1/calendar/${encodeURIComponent(calendarId)}/events/${eventId}`, {
      json: body,
      headers: { 'x-full-response': '1' },
    })
    .json();
};

export const onMuteMeeting = async (item: any) => {
  return { data: item, success: true, reason: null };
};

export const getMeetingScheduleDetail = (options: any) => {
  const { calendarId = 'default', eventId, source } = options;

  return request
    .get(
      `v1/calendar/${encodeURIComponent(calendarId)}/events/${eventId}?type=difft${source ? `&source=${source}` : ''}`
    )
    .json();
};

export const getUserEmail = (
  uids: string[]
): Promise<{ uid: string; email?: string; validUser: boolean; name: string }[]> => {
  const suffix = uids.filter(Boolean).join(',');
  return request.get(`v1/user/info?key=${encodeURIComponent(suffix)}`).json();
};
