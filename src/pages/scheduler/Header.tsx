import React from 'react';
import { IconLiveStream } from '@shared/IconsNew';
import { useDetailDataValue } from '@/hooks/useDetailData';

const ScheduleMeetingHeader = () => {
  const { isLiveStream, isGroup, mode, category } = useDetailDataValue();
  const isEvent = category === 'event';
  const renderName = () => {
    if (isLiveStream) {
      return (
        <div className="live-stream-title">
          <span>Live Stream</span>
          <IconLiveStream className="live-icon" />
        </div>
      );
    }
    if (isGroup) {
      return `Group Meeting`;
    }
    if (mode === 'view') {
      return isEvent ? `Event Details` : 'Meeting Details';
    }
    if (mode === 'update') {
      return isEvent ? 'Edit Event' : 'Edit Meeting';
    }
    return isEvent ? 'Create Event' : 'Book Meeting';
  };

  return (
    <div className={'schedule-meeting-header'}>
      <h3>{renderName()}</h3>
      <span
        className={'common-close'}
        style={{
          position: 'absolute',
          right: '15px',
          top: '20px',
          cursor: 'pointer',
        }}
        onClick={(event: React.MouseEvent<HTMLSpanElement>) => {
          event.stopPropagation();
          // TODO
          // onClose();
        }}
      />
    </div>
  );
};

export default ScheduleMeetingHeader;
