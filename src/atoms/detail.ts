import dayjs, { Dayjs } from 'dayjs';
import { atom } from 'jotai';

export const showPannelAtom = atom(false);

type Member = {
  going: 'maybe' | 'yes' | 'no';
  isGroupUser: boolean;
  isRemovable: boolean;
  name: string;
  role: 'host' | 'attendee';
  uid: string;
  email?: string;
};

export enum Permission {
  ReadOnly = 'read',
  ReadWrite = 'readwrite',
  NONE = '-',
}

type ButtonPermission = {
  buttonEdit: Permission;
  buttonCopy: Permission;
  buttonDuplicate: Permission;
  buttonTransferHost: Permission;
  buttonCopyLiveStream: Permission;
  buttonDelete: Permission;
  buttonJoin: Permission;
  buttonAddLiveStream: Permission;
  toggleGoingOrNot: Permission;
  checkboxReceiveNotification: Permission;
};

export type DetailData = {
  loading: boolean;
  mode: 'create' | 'view' | 'update';
  date?: Dayjs;
  time?: Dayjs;
  start: number;
  end: number;
  source: 'google' | 'outlook' | 'calendar' | 'difft';
  type: string;
  members: Array<Member>;
  isGroup: boolean;
  group?: {
    gid: string;
    name?: string;
    userMap?: Map<string, 1>;
  };
  isEvent?: boolean;
  appType?: 'ccm' | 'wea' | 'cctm' | 'weatest' | '';
  category?: 'meeting' | 'event';
  topic?: string;
  description?: string;
  allDayStart?: string;
  allDayEnd?: string;
  calendarId?: string;
  isAllDay?: boolean;
  isLiveStream?: boolean;
  googleMeetingLink?: string;
  outlookMeetingLink?: string;
  channelName?: string;
  recurringRule?: {
    repeatOptions?: {
      label: string;
      value: string;
    }[];
    rrule?: string;
    repeat?: string;
  };
  eid?: string;
  attachment?: any[];
  isRecurring?: false;
  going?: 'maybe' | 'yes' | 'no';
  canModify?: boolean;
  canInvite?: boolean;
  permissions?: {
    editMode: Partial<ButtonPermission>;
    viewMode: Partial<ButtonPermission>;
  };
  timeZone?: string;
  receiveNotification?: boolean;
  duration?: number;
  guests?: {
    allStaff: boolean;
    users: string[];
    total: number;
  };
  host?: string;
  hostInfo?: {
    uid: string;
    name?: string;
  };
  creator?: {
    uid: string;
    name?: string;
  };
  everyoneCanModify?: boolean;
  everyoneCanInviteOthers?: boolean;
  syncToGoogle?: boolean;
  speechTimerEnabled?: boolean;
  speechTimerDuration?: number | null;
  childModalType?: 'attendee' | 'guest' | 'findTime' | '';
  showMore?: boolean;
};

export const INITIAL_DETAIL_DATA: DetailData = {
  loading: true,
  mode: 'create',
  source: 'difft',
  type: 'difft',
  start: 0,
  end: 0,
  members: [],
  isGroup: false,
  date: dayjs(),
  time: dayjs(),
};

export const schedulerDataAtom = atom<DetailData | Promise<DetailData>>(INITIAL_DETAIL_DATA);
