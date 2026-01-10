// Mock implementations for Electron-specific global APIs
// These would typically interact with the main process in an Electron app.
// For a web environment, they are mocked to prevent errors and allow development.

export const isCurrentWindowIndependent = () => true; // Always true for web version

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getMeetingScheduleDetail = async (options: any) => {
  await delay(200);
  console.warn('Mocked getMeetingScheduleDetail called', options);
  return {
    status: 0,
    reason: 'success',
    data: {
      event: {
        attendees: [],
        start: 1715000000,
        end: 1715000000,
        isGroup: false,
        group: {},
        topic: 'test',
      },
      cid: 'default',
      source: 'difft',
      random: Math.random(),
    },
  } as any;
};
export const getUserEmail = async (ids: string[]) => {
  console.warn('Mocked getUserEmail called', ids);
  return { status: 0, data: [] };
};
export const getMeetingOnlineUsers = async (channelName: string) => {
  console.warn('Mocked getMeetingOnlineUsers called', channelName);
  return {
    status: 0,
    data: {
      users: [],
    },
  } as any;
};
export const getSchedulerDashboard = async (options: any) => {
  console.log('Mocked getSchedulerDashboard called', options);
  return {
    status: 0,
    data: {
      version: 1,
      myCalendar: [],
      otherCalendar: [],
    },
  };
};
export const getServerTokenDirect = async () => {
  console.warn('Mocked getServerTokenDirect called');
  return 'mock-token';
};

export const instantMeeting = (members: string[], topic: string) => {
  console.warn('Mocked instantMeeting called', members, topic);
};

export const registerReadScheduleNotifyCallback = (callback: (info: any) => void) => {
  console.warn('Mocked registerReadScheduleNotifyCallback called');
  // Store callback for later use if needed
  (window as any).__scheduleNotifyCallback = callback;
};

export const registerIPCScheduleWithSomeone = (callback: (id: string) => void) => {
  console.warn('Mocked registerIPCScheduleWithSomeone called');
  // Store callback for later use if needed
  (window as any).__scheduleWithSomeoneCallback = callback;
};

export const getUserBaseInfo = (id: string) => {
  console.warn('Mocked getUserBaseInfo called for:', id);
  return {
    id,
    name: `User ${id}`,
    email: `${id}@example.com`,
    type: 'direct' as 'direct' | 'group',
    directoryUser: true,
    avatarPath: '',
    timeZone: 8,
    isRemovable: false,
  };
};
// 返回指定ID的用户基本信息，包括ID、姓名、邮箱、类型、是否为目录用户、头像路径、时区和是否可移除

export const getConversations = <T = any>() => {
  console.warn('Mocked getConversations called');
  return [] as T[];
};

export const updateTodayUnreadSchedule = (info: { count: number; isOn?: boolean }) => {
  console.warn('Mocked updateTodayUnreadSchedule called', info);
};

export const isInsiderUpdate = () => 'false';

export const isDev = () => true;

export const onMuteMeeting = async (e: any, item: any) => {
  console.warn('Mocked onMuteMeeting called', e, item);
  return { success: true } as any;
};

export const getAppName = () => 'CalendarWeb';

export const getGlobalConfig = () => ({
  scheduler: { scheduleType: 1 }, // Mock MeetingType.Native
  meeting: {
    livestream: {
      web: { enabled: true, enabledVersions: [1] },
    },
  },
});

export const getPlatform = () => 'web';

export const getAppDefaultProtocol = () => 'http://localhost:3000/';

export const sendBrowserOpenUrl = (url: string) => {
  console.warn('Mocked sendBrowserOpenUrl called with:', url);
  window.open(url, '_blank');
};

export const findStatusConfig = (status: number) => {
  console.warn('Mocked findStatusConfig called with:', status);
  return null;
};

export const getPatEnabled = () => false;

export const showCallVoiceGroup = (options: any) => {
  console.warn('Mocked showCallVoiceGroup called with:', options);
  alert(`Mock: Starting call with channel: ${options.channelName}`);
};

export const getSchedulerCreateConfig = async (
  calendarId: string,
  features = ['canSyncGoogle']
) => {
  console.log('🔵 Mocked getCreateCalendarConfig called with:', calendarId, features);
  return {
    status: 0,
    data: {
      canSyncGoogle: true,
    },
  };
};
