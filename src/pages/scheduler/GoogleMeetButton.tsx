import React from 'react';
import { Button } from 'antd';
import { useDetailDataValue } from '@/hooks/useDetailData';
import { goToGoogle } from '@/schema';

function GoogleMeetButton() {
  const { mode, isLiveStream, category, showMore, topic, members, channelName } =
    useDetailDataValue();
  const isEvent = category === 'event';
  if (mode !== 'create' || !showMore || isEvent || isLiveStream) {
    return null;
  }

  return (
    <Button
      type="default"
      onClick={() => {
        goToGoogle(
          members.map(m => m.uid),
          topic,
          channelName
        );
      }}
      style={{ marginTop: '12px' }}
    >
      To Google Calendar
    </Button>
  );
}

export default GoogleMeetButton;
