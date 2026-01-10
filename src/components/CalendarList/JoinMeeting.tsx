import React from 'react';
import BeforeJoinMeeting from './BeforeJoinMeeting';
import { getWebApi, showCallVoiceGroup } from '../../shims/globalAdapter';
import { Modal } from 'antd';
import { isExternalProtocol } from '../../linkProtocol';

export const joinMeeting = async (
  e: React.MouseEvent<HTMLElement, MouseEvent>,
  item: {
    channelName?: string;
    isLiveStream?: boolean;
    eid?: string;
    topic?: string;
    appType?: string;
    googleMeetingLink?: string;
    outlookMeetingLink?: string;
    [key: string]: any;
  }
) => {
  e.stopPropagation?.();

  if (await (window as any).existMeeting(item.channelName)) {
    return;
  }

  const {
    topic: meetingName,
    channelName,
    isLiveStream,
    appType,
    eid,
    googleMeetingLink,
    outlookMeetingLink,
  } = item;

  if (!channelName && googleMeetingLink) {
    (window as any).sendBrowserOpenUrl(googleMeetingLink);
    return;
  }

  if (!channelName && outlookMeetingLink) {
    (window as any).sendBrowserOpenUrl(outlookMeetingLink);
    return;
  }

  const isExternal = isExternalProtocol(appType);

  // no need to call api if isExternal true
  const serverToken = isExternal ? undefined : await getWebApi().getServerTokenDirect();

  const callOptions: any = {
    callType: 'passive',
    isPrivate: false,
    meetingName,
    channelName,
    serverToken,
    callerId: undefined,
    meetingId: 0,
    isLiveStream,
    isExternal,
    eid,
  };

  if (!isExternal && isLiveStream) {
    try {
      const res = await (window as any).textsecure?.messaging.getLiveStreamToken(channelName, eid);

      if (res.status !== 0) {
        (window as any).noticeWarning(res.reason || 'livestream is not start yet');
        return;
      }

      const isAudience = res.data.role === 'audience';

      Object.assign(callOptions, {
        isAudience,
        agoraToken: res.data.token,
        isLiveStarted: res.data.isLiveStarted,
      });
      if (isAudience) {
        showCallVoiceGroup(callOptions);
        return;
      }
    } catch (error) {
      console.log('join livestream error', error);
      (window as any).noticeError('join livestream error');
      return;
    }
  }

  const { destroy } = Modal.confirm({
    className: 'before-join-meeting-modal',
    icon: null,
    centered: true,
    closable: false,
    destroyOnClose: true,
    title: '',
    width: 384,
    footer: null,
    autoFocusButton: null,
    content: (
      <BeforeJoinMeeting
        meetingOptions={callOptions}
        buttonCall={callOptions.buttonCall}
        setMeetingOptions={(getNewOptions: any) =>
          Object.assign(callOptions, getNewOptions(callOptions))
        }
        onOk={() => {
          showCallVoiceGroup(callOptions);
          destroy();
        }}
        onCancel={() => destroy()}
      />
    ),
  });
};
