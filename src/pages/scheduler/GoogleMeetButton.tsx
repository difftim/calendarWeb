import React, { useRef } from 'react';
import { Button } from 'antd';
import { useDetailDataValue } from '@/hooks/useDetailData';
import { goToGoogleMeet } from '@/util/goToGoogleMeet';
import { useAtomValue } from 'jotai';
import { appNameAtom, userInfoAtom } from '@/atoms';
import { getSimpleName, isBotId } from '@/util';

function GoogleMeetButton() {
  const { mode, isLiveStream, category, showMore, topic, members, channelName } =
    useDetailDataValue();
  const isEvent = category === 'event';
  const clientName = useAtomValue(appNameAtom) || 'Wea';
  const myInfo = useAtomValue(userInfoAtom);
  const lock = useRef(false);

  if (mode !== 'create' || !showMore || isEvent || isLiveStream) {
    return null;
  }

  return (
    <Button
      type="default"
      onClick={async () => {
        if (lock.current) return;
        lock.current = true;
        const url = await goToGoogleMeet(
          members.map(m => m.uid).filter(uid => Boolean(uid && !isBotId(uid))),
          topic || `${getSimpleName(myInfo.name || myInfo.id)}'s Meeting`,
          clientName,
          channelName
        );
        lock.current = false;
        if (url) {
          window.open(url, '_blank');
        }
      }}
      style={{ marginTop: '12px' }}
    >
      To Google Calendar
    </Button>
  );
}

export default GoogleMeetButton;
