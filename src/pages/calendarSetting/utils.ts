import dayjs from 'dayjs';

export const getTimeZone = (tz: string) => {
  const offset = dayjs().tz(tz).utcOffset();
  return {
    timeZone: tz,
    utcOffset: `UTC${offset >= 0 ? '+' : '-'}${Math.abs(offset / 60)}`,
  };
};

export enum Step {
  Main = 0,
  My = 1,
  Other = 2,
  AddOther = 3,
  Proxy = 4,
  AddProxy = 5,
  TimeZone = 6,
  UpdateIcs = 7,
}

export type CalendarUserType = 'my' | 'other' | 'proxy';

export interface CalendarUserItemData {
  id: string;
  cname?: string;
  name?: string;
  role?: string;
}

export interface TimeZoneInfo {
  timeZone: string;
  utcOffset: string;
}

export interface CalendarSettingDialogProps {
  open: boolean;
  onClose: () => void;
  myList: CalendarUserItemData[];
  otherList: CalendarUserItemData[];
  myId: string;
}
