// Mock global adapter for standalone version
// In the original Electron app, these functions interact with the main process
// Here we provide stub implementations for web version

export const isCurrentWindowIndependent = () => true;

export const getWebApi = () => ({
  getMeetingScheduleDetail: async (params: any) => {
    console.warn('getMeetingScheduleDetail not implemented in web version', params);
    return { status: -1, reason: 'Not implemented' };
  },
  getUserEmail: async (userIds: string[]) => {
    console.warn('getUserEmail not implemented in web version', userIds);
    return { status: -1, reason: 'Not implemented' };
  },
});

export const instantMeeting = (users: string[], meetingName: string) => {
  console.warn('instantMeeting not implemented in web version', users, meetingName);
};

export const registerReadScheduleNotifyCallback = (callback: (info: any) => void) => {
  console.log('registerReadScheduleNotifyCallback registered');
};

export const registerIPCScheduleWithSomeone = (callback: (id: string) => void) => {
  console.log('registerIPCScheduleWithSomeone registered');
};

export const getUserBaseInfo = (userId: string) => {
  return {
    id: userId,
    name: userId,
    email: `${userId}@example.com`,
  };
};

export const getConversations = <T = any>(): T[] => {
  return [];
};

export const updateTodayUnreadSchedule = (params: any) => {
  console.log('updateTodayUnreadSchedule', params);
};

export const isInsiderUpdate = () => 'false';

export const isDev = () => process.env.NODE_ENV === 'development';
