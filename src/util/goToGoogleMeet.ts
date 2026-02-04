import { createGoogleMeeting, createGroupGoogleMeeting } from '@/api';
import { buildParamString, buildUrlPathWithParams } from '.';
import { fetchUserInfo, getUserBaseInfoSync } from '@/atoms/userInfo';
import { pick } from 'lodash';

const buildEmailParams = (members: Array<{ id: string; email?: string }>) => {
  const urlParams: string[][] = [];
  members.forEach(item => {
    if (item.email) {
      urlParams.push(['add', item.email]);
    }
  });
  return urlParams;
};

const buildDetailParams = (
  {
    meetingName,
    channelName,
    password,
  }: {
    meetingName: string;
    channelName: string;
    password: string;
  },
  memberCount: number,
  clientName: string
) => {
  const productName = clientName.toLowerCase() || 'Wea';
  const from = `${productName}-mac`;
  const jumpUrlParams = buildParamString(
    {
      from,
      v: '1',
      meetingname: meetingName,
      channelname: channelName,
    },
    true
  );
  const jumpUrl = `${import.meta.env.VITE_WEB_MEETING_URL}?${jumpUrlParams}`;
  const details = [
    `<p>Do not delete or change any of the following text.</p><a href="${jumpUrl}">Join ${productName} Meeting</a>`,
    memberCount > 100
      ? `<p>${productName} Group Meeting</p><p>Note: You have invited ${memberCount} guests in total, and the meeting will not be displayed in the invitee's calendar because the number exceeds the limit, but MeetingBot will send a reminder to all guests before the meeting.</p>`
      : null,
    `<p><b>Meeting password(access code)</b>:${password}</p>`,
  ]
    .filter(Boolean)
    .join('');

  return [['details', details]];
};

export const goToGoogleMeet = async (
  userIds: Array<string>,
  meetingName: string,
  clientName: string,
  channelName?: string
) => {
  try {
    // 最多50个用户
    const memberCount = userIds.length;
    const isGroup = !!channelName;
    const [serverData] = await Promise.all([
      isGroup ? createGroupGoogleMeeting(channelName, userIds, meetingName) : createGoogleMeeting(),
      fetchUserInfo(userIds.slice(0, 50)),
    ]);
    const members = userIds.map(uid => pick(getUserBaseInfoSync(uid), ['id', 'email']));
    if (!serverData?.channelName || !serverData?.password) {
      throw serverData;
    }
    let emailParams: string[][] = [];
    if (memberCount <= 100 || !isGroup) {
      emailParams = buildEmailParams(members);
    }
    const urlParams: string[][] = [
      ...emailParams,
      ['text', meetingName],
      ['trp', 'true'],
      ['sf', 'true'],
      ['output', 'xml'],
      ...buildDetailParams({ ...serverData, meetingName }, memberCount, clientName),
    ];

    const googleHost = `https://calendar.google.com`;

    const googleUrlPath = buildUrlPathWithParams(
      ['calendar', 'u', '0', 'r', 'eventedit'],
      urlParams,
      true
    );

    return `${googleHost}${googleUrlPath}`;
  } catch (error) {
    console.error('go to google meet error', error);
    return null;
  }
};
