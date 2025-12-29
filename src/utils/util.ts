export const cleanUserNameForDisplay = (user: any) => {
  if (!user || !user.name) return user?.id || '';
  return user.name.replace(/\s*\(.*?\)\s*/g, '').trim();
};

export const getUtcOffset = (timeZone?: string) => {
  if (!timeZone) return 'UTC+8';
  const offset = new Date().getTimezoneOffset() / -60;
  return `UTC${offset >= 0 ? '+' : ''}${offset}`;
};

export const isMatchUserId = (userId: string) => {
  return userId && userId.startsWith('+');
};

// 格式化时间显示
export const formatTime = (timestamp: number, options?: { locale?: string; tz?: string }) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// 格式化分钟
export const formatMinutes = (minutes: number) => {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

// 格式化天数
export const formatDays = (days: number) => {
  return days === 1 ? '1 day' : `${days} days`;
};

// 格式化正午和午夜
export const formatNoonAndMidNight = (date: any) => {
  const hour = date.hour();
  let time = date.format('h:mm A');
  if (hour === 0) {
    time = time.replace('AM', 'MIDNIGHT');
  }
  if (hour === 12) {
    time = time.replace('PM', 'NOON');
  }
  return time;
};

// 估算时间
export const estimateTime = (time: any, options: { type: string }) => {
  const minute = time.minute();
  if (minute % 10 === 0) {
    return time;
  }
  const nextMinute = Math.ceil(minute / 10) * 10;
  return time.minute(nextMinute).second(0);
};

// 获取 hostname
export const getHostNameFromScheduleList = (item: any, getUserBaseInfo: (id: string) => any) => {
  const host = item.host || item.hostInfo?.uid;
  if (!host) return '';
  const userInfo = getUserBaseInfo(host);
  return userInfo?.name || host;
};

// 获取初始字母
export const getInitials = (name?: string) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};
