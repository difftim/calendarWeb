import { toastError } from '@/shared/Message';
import { getSimpleName } from '@/util';
import { compress } from 'lz-string';

const getSchema = () => {
  const ua = navigator.userAgent;
  if (ua.includes('cctm')) {
    return 'cctm';
  }
  if (ua.includes('weatest')) {
    return 'weatest';
  }
  if (ua.includes('ccm')) {
    return 'ccm';
  }
  if (ua.includes('wea')) {
    return 'wea';
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
  const topic = encodeURIComponent(`${getSimpleName(info.name)}'s Personal Meeting Room`);
  const channelName = encodeURIComponent(`I-${window.btoa(`myroom:user:${info.id}`)}`);
  const url = `${getSchema()}://meeting?v=1&meetingname=${topic}&channelname=${channelName}`;

  window.location.href = url;
};

export const shareLiveStream = (content: string, selected: string[]) => {
  const listStr = encodeURIComponent(compress(selected.filter(Boolean).join(',')));
  const source = content || '';
  // Example content:
  // Topic: Live Stream
  // Time: $FORMAT-LOCAL-TIME{1768741800}
  // [Save the date]($FORMAT-SCHEMA://scheduler/details?eid=cc3lpvsl11ij8ncn2bpre0hdlcjr5c3l)
  const eidMatch = source.match(/scheduler\/details\?eid=([a-zA-Z0-9_-]+)/);
  const timeMatch = source.match(/\$FORMAT-LOCAL-TIME\{(\d+)\}/);
  const topicMatch = source.match(/Topic:\s*([^\n\r]+)/);
  const eid = eidMatch?.[1] || '';
  const unix = timeMatch?.[1] || '';
  const topic = topicMatch?.[1] || 'Live Stream';

  if (!eid || !unix) {
    toastError('invalid share content');
    return;
  }

  const url = `${getSchema()}://calendar-app?action=share-live&list=${listStr}&topic=${encodeURIComponent(
    topic
  )}&eid=${eid}&t=${unix}`;
  window.location.href = url;
};

export const createWebCall = () => {
  const url = `${getSchema()}://calendar-app?action=new-web-call`;
  window.location.href = url;
};

export const goToGoogle = (members: string[], topic?: string, channelName?: string) => {
  const membersStr = encodeURIComponent(compress(members?.filter(Boolean).join(',')));
  const searchParams = new URLSearchParams({
    action: 'go-to-google',
    members: membersStr,
  });
  if (topic) {
    searchParams.append('meetingname', encodeURIComponent(topic));
  }
  if (channelName) {
    searchParams.append('channelname', channelName);
  }
  const url = `${getSchema()}://calendar-app?${searchParams.toString()}`;

  window.location.href = url;
};
