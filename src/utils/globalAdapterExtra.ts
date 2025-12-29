// Mock globalAdapter functions for additional features
export const onMuteMeeting = async (e: any, item: any) => {
  e.stopPropagation();
  console.log('Mute/Unmute meeting:', item);
  return { success: true, reason: '' };
};

export const getAppName = () => 'Calendar Web';

export const getGlobalConfig = () => window.globalConfig || {};

export const getPlatform = () => {
  if (typeof window !== 'undefined') {
    if (navigator.platform.includes('Mac')) return 'darwin';
    if (navigator.platform.includes('Win')) return 'win32';
    if (navigator.platform.includes('Linux')) return 'linux';
  }
  return 'web';
};
