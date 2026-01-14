// Mock implementations for Electron-specific global APIs
// These would typically interact with the main process in an Electron app.
// For a web environment, they are mocked to prevent errors and allow development.

export const isCurrentWindowIndependent = () => true; // Always true for web version

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getMeetingScheduleDetail = async (options: any) => {
  await delay(1000);
  console.log('Mocked getMeetingScheduleDetail called', options);
  return {
    event: {
      eid: '1vh4l0qcl3pqb9pbbk14tmo93napl44a_20260113T100000Z',
      topic: "Primo's Meeting",
      description: '',
      channelName: 'I-Q0pxclZMQ2ZUSkhYdm83UXdYOGxCNFZUeHQ3WFZHMEg=',
      host: '+72556268884',
      hostInfo: {
        uid: '+72556268884',
        name: 'Primo(DDDDDDDDDDDDDDDDDDDDDDD)',
        timeZone: '',
      },
      start: 1768298400,
      end: 1768305600,
      isAllDay: false,
      isRecurring: true,
      recurringRule: {
        rrule: 'FREQ=DAILY;INTERVAL=1',
        dtStart: 0,
        dtEnd: 0,
        repeat: 'Daily',
        repeatOptions: [
          {
            label: 'Never',
            value: 'Never',
          },
          {
            label: 'Daily',
            value: 'FREQ=DAILY;INTERVAL=1',
          },
          {
            label: 'Weekdays',
            value: 'FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,TU,WE,TH,FR',
          },
          {
            label: 'Weekly',
            value: 'FREQ=WEEKLY;INTERVAL=1',
          },
          {
            label: 'Biweekly',
            value: 'FREQ=WEEKLY;INTERVAL=2',
          },
          {
            label: 'Monthly',
            value: 'FREQ=MONTHLY;INTERVAL=1',
          },
        ],
      },
      timezone: '',
      attendees: [
        {
          uid: '+72556268884',
          name: 'Primo(DDDDDDDDDDDDDDDDDDDDDDD)',
          email: 'primo.l@chative.com',
          role: 'host',
          going: 'maybe',
          isGroupUser: false,
          isRemovable: false,
        },
      ],
      isGroup: false,
      group: null,
      attachment: null,
      everyoneCanInviteOthers: true,
      everyoneCanModify: false,
      type: 'difft',
      source: 'difft',
      isLiveStream: false,
      guests: {
        allStaff: false,
        orgId: '',
        users: [],
        total: 0,
      },
      creator: {
        uid: '+72556268884',
        name: '',
        timeZone: '',
      },
      appType: 'weatest',
      category: 'meeting',
      syncToGoogle: false,
      googleMeetingLink: '',
      outlookMeetingLink: '',
      speechTimerEnabled: false,
      speechTimer: null,
    },
    canInvite: true,
    canModify: true,
    going: 'maybe',
    cid: 'user_72556268884',
    timeZone: 'Asia/Shanghai',
    receiveNotification: true,
    permissions: {
      editMode: {
        buttonUpdate: 'readwrite',
        buttonEdit: '-',
        buttonDelete: '-',
        textFieldTitle: 'readwrite',
        pickerStartDateTime: 'readwrite',
        selectorDuration: 'readwrite',
        selectorRepeat: 'readwrite',
        selectorAttendee: 'readwrite',
        textHost: 'read',
        editorAttachment: 'readwrite',
        textFieldDesc: 'readwrite',
        checkboxEveryoneCanModifyMeeting: 'readwrite',
        checkboxEveryoneCanInviteOthers: 'readwrite',
        checkboxSendInvitationToTheChatRoom: '-',
        toggleGoingOrNot: '-',
        checkboxReceiveNotification: '-',
        buttonCopy: '-',
        buttonFindATime: 'readwrite',
        buttonAddLiveStream: '-',
        buttonCopyLiveStream: '-',
        buttonJoin: '-',
        buttonTransferHost: '-',
        buttonDuplicate: '-',
        checkboxIsAllDay: '-',
        pickerEndDateTime: '-',
      },
      viewMode: {
        buttonUpdate: '-',
        buttonEdit: 'readwrite',
        buttonDelete: 'readwrite',
        textFieldTitle: 'read',
        pickerStartDateTime: 'read',
        selectorDuration: 'read',
        selectorRepeat: 'read',
        selectorAttendee: 'read',
        textHost: 'read',
        editorAttachment: 'read',
        textFieldDesc: 'read',
        checkboxEveryoneCanModifyMeeting: '-',
        checkboxEveryoneCanInviteOthers: '-',
        checkboxSendInvitationToTheChatRoom: '-',
        toggleGoingOrNot: 'readwrite',
        checkboxReceiveNotification: 'readwrite',
        buttonCopy: 'readwrite',
        buttonFindATime: '-',
        buttonAddLiveStream: '-',
        buttonCopyLiveStream: '-',
        buttonJoin: '-',
        buttonTransferHost: '-',
        buttonDuplicate: 'readwrite',
        checkboxIsAllDay: '-',
        pickerEndDateTime: '-',
      },
    },
  };
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
