import { toastError } from '@/shared/Message';
import { getSimpleName } from '@/util';
import { compressToBase64 } from 'lz-string';

const getSchema = () => {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('cc/')) {
    return 'ccm';
  }
  if (ua.includes('wea/')) {
    return 'wea';
  }
  if (ua.includes('cctest/')) {
    return 'cctm';
  }
  if (ua.includes('weatest/')) {
    return 'weatest';
  }
  if (ua.includes('bycew/')) {
    return 'wea';
  }
  if (ua.includes('bycec/')) {
    return 'ccm';
  }
  return 'wea';
};

export const createInstantMeeting = () => {
  const url = `${getSchema()}://calendar-app?action=instant-meeting`;
  window.location.href = url;
};

export const createRoom = (info: { name: string; id: string }) => {
  if (!info.id) {
    toastError('failed to join my room');
    return;
  }
  const topic = `${getSimpleName(info.name)}'s Personal Meeting Room`;
  const channelName = `I-${window.btoa(`myroom:user:${info.id}`)}`;
  const searchParams = new URLSearchParams({
    v: '1',
    meetingname: topic,
    channelname: channelName,
  });
  const url = `${getSchema()}://meeting?${searchParams.toString()}`;

  window.location.href = url;
};

export const shareLiveStream = (content: string, selected: string[]) => {
  const list = compressToBase64(selected.filter(Boolean).join(','));
  const source = content || '';
  // Example content:
  // Topic: Live Stream
  // Time: $FORMAT-LOCAL-TIME{1768741800}
  // [Save the date]($FORMAT-SCHEMA://scheduler/details?eid=cc3lpvsl11ij8ncn2bpre0hdlcjr5c3l)
  const eidMatch = source.match(/scheduler\/details\?eid=([a-zA-Z0-9_-]+)/);
  const timeMatch = source.match(/\$FORMAT-LOCAL-TIME\{(\d+)\}/);
  const topicMatch = source.match(/Topic:\s*([^\n\r]+)/);
  const eid = eidMatch?.[1] || '';
  const t = timeMatch?.[1] || '';
  const topic = topicMatch?.[1] || 'Live Stream';

  if (!eid || !t) {
    toastError('invalid share content');
    return;
  }

  const searchParams = new URLSearchParams({
    action: 'share-live',
    list,
    topic,
    eid,
    t,
  });
  const url = `${getSchema()}://calendar-app?${searchParams.toString()}`;
  window.location.href = url;
};

export const createWebCall = () => {
  const url = `${getSchema()}://calendar-app?action=new-web-call`;
  window.location.href = url;
};

export const goToGoogle = (members: string[], topic?: string, channelName?: string) => {
  const membersStr = compressToBase64(members?.filter(Boolean).join(','));
  const searchParams = new URLSearchParams({
    action: 'go-to-google',
    members: membersStr,
  });
  if (topic) {
    searchParams.append('meetingname', topic);
  }
  if (channelName) {
    searchParams.append('channelname', channelName);
  }
  const url = `${getSchema()}://calendar-app?${searchParams.toString()}`;

  window.location.href = url;
};

export const joinMeeting = (info: {
  appType?: string;
  channelName?: string;
  meetingName?: string;
  isLiveStream?: boolean;
  eid?: string;
}) => {
  const host = info.isLiveStream ? 'livestream' : 'meeting';
  const searchParams = new URLSearchParams({
    channelName: info.channelName || '',
    meetingName: info.meetingName || '',
    eid: info.eid || '',
    appType: info.appType || '',
    v: '1',
  });
  const url = `${getSchema()}://${host}?${searchParams.toString()}`;
  console.log('join meeting url...', url);
  window.location.href = url;
};
