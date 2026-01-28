import { request } from './request';

export const getSchedulerDashboard = ({ start, end, type }: any) => {
  const typeSuffix = type ? `&type=${type}` : '';
  return request.get(
    `v1/calendar/dashboard?start=${start}&end=${end}&t=${Date.now()}${typeSuffix}`
  ) as any;
};

export const addUserCalendar = async (data: { cid: string; type: string; name?: string }) => {
  return request.post(`v1/user/calendar`, { json: data }) as any;
};

export const deleteUserCalendar = async (data: { cid: string; type: string }) => {
  return request.delete(`v1/user/calendar`, { json: data }) as any;
};

export const updateUserCalendar = async (data: { cid: string; type: string; name?: string }) => {
  return request.put(`v1/user/calendar`, { json: data }) as any;
};

export const uploadIcsData = async (data: { ics: string; email?: string }) => {
  return request.post(`v1/ics/upload`, { json: data }) as any;
};

export const getProxyPermission = async (type: 'given' | 'own' = 'own') => {
  return request.get(`v1/proxy/permissions?type=${type}`) as any;
};

export const addProxyPermission = async (uid: string) => {
  return request.post(`v1/proxy/permissions`, { json: { users: [uid] } }) as any;
};

export const deleteProxyPermission = async (uid: string) => {
  return request.delete(`v1/proxy/permissions`, { json: { uid } }) as any;
};

export const addLiveStreamToCalendar = async (eid: string, cid = 'default') => {
  return request.post(`v1/calendar/${cid}/livestream`, {
    json: { eid },
  });
};

export const deleteMeetingSchedule = async (data: any) => {
  const { calendarId = 'default', eventId, isAllEvent = false, isRecurring = false } = data;

  return request.delete(
    `v1/calendar/${encodeURIComponent(calendarId)}/events/${eventId}?isAllEvent=${isAllEvent}&isRecurring=${isRecurring}`
  ) as any;
};

export const goingScheduleMeeting = async (data: any) => {
  const { eventId, calendarId, going, isRecurring, isAllEvent } = data;

  return request.put(`v1/calendar/${calendarId}/events/${eventId}/going`, {
    json: { going, isRecurring, isAllEvent },
  }) as any;
};

export const scheduleMeetingReceiveNotify = async (data: any) => {
  const {
    calendarId = 'default',
    eventId,
    receiveNotification = false,
    isRecurring = false,
    isAllEvent = false,
  } = data;

  return request.put(
    `v1/calendar/${encodeURIComponent(calendarId)}/events/${eventId}/notification`,
    { json: { isRecurring, isAllEvent, receiveNotification } }
  ) as any;
};

export const copyScheduleMeetingInfo = async (data: any) => {
  const { calendarId = 'default', eventId, action = 'copy' } = data;
  return request.get(
    `v1/calendar/${encodeURIComponent(calendarId)}/events/${eventId}/copy?type=difft&action=${action}`
  ) as any;
};

export const getSchedulerCreateConfig = (calendarId: string) => {
  return request.post(`v1/calendar/${encodeURIComponent(calendarId)}/events/precreate`, {
    json: {
      calendarId,
      features: ['canSyncGoogle'],
    },
  }) as any;
};

export const getSchedulerOrgInfo = () => {
  return request.get(`v1/org/users`) as any;
};

export const getMeetingViewScheduleList = async (data: any) => {
  const { users = [], start, end } = data;
  return request.post(`v1/user/freebusy`, {
    json: { users, start, end },
  }) as any;
};

export const scheduleMeetingGetFreeTime = async (data: any) => {
  const { uid, start, end } = data;

  return request.get(`v1/user/${uid}/freebusy?start=${start}&end=${end}`, {});
};

export const scheduleMeetingGetGroupFreeTime = async (data: any) => {
  const { gid, start, end } = data;

  return request.get(`v1/group/${gid}/freebusy?start=${start}&end=${end}`, {});
};

export const createMeetingSchedule = async (data: any) => {
  const { calendarId = 'default', ...body } = data;
  return request.post(`v1/calendar/${encodeURIComponent(calendarId)}/events`, {
    json: body,
    headers: {
      'x-full-response': '1',
    },
  }) as any;
};

export const updateMeetingSchedule = async (data: any) => {
  const { calendarId = 'default', eventId, ...body } = data;
  return request.put(`v1/calendar/${encodeURIComponent(calendarId)}/events/${eventId}`, {
    json: body,
    headers: {
      'x-full-response': '1',
    },
  }) as any;
};

export const onMuteMeeting = async (item: any) => {
  return { data: item, success: true, reason: null };
};

export const getMeetingScheduleDetail = async (options: any) => {
  const { calendarId = 'default', eventId, source } = options;

  return request.get(
    `v1/calendar/${encodeURIComponent(calendarId)}/events/${eventId}?type=difft${source ? `&source=${source}` : ''}`
  ) as any;
};
