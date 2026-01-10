import React from 'react';
import { Button } from 'antd';
import { useDetailDataValue } from '@/hooks/useDetailData';

function GoogleMeetButton() {
  const { mode, isLiveStream, category, showMore } = useDetailDataValue();
  // TODO
  const isEvent = category === 'event';
  if (mode !== 'create' || !showMore || isEvent || isLiveStream) {
    return null;
  }

  // TODO use schema to open from main app
  const goToGoogleCalendar = async () => {};

  return (
    <Button type="default" onClick={goToGoogleCalendar} style={{ marginTop: '12px' }}>
      To Google Calendar
    </Button>
  );
}

export default GoogleMeetButton;
