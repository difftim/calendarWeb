import React from 'react';
import { IconCloseF, IconLiveStream } from '@/shared/IconsNew';
import { useDetailDataValue } from '@/hooks/useDetailData';
import { showPannelAtom } from '@/atoms/detail';
import { useSetAtom } from 'jotai';

export const LoadingHeader = () => {
  const setShow = useSetAtom(showPannelAtom);

  return (
    <div className={'schedule-meeting-header'}>
      <h3>Meeting Details</h3>
      <IconCloseF
        style={{
          position: 'absolute',
          right: '15px',
          top: '20px',
          cursor: 'pointer',
        }}
        width={24}
        height={24}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          setShow(false);
        }}
      />
    </div>
  );
};

const ScheduleMeetingHeader = () => {
  const { isLiveStream, isGroup, mode, category } = useDetailDataValue();
  const isEvent = category === 'event';
  const setShow = useSetAtom(showPannelAtom);

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
      <IconCloseF
        width={24}
        height={24}
        style={{
          position: 'absolute',
          right: '15px',
          top: '20px',
          cursor: 'pointer',
        }}
        onClick={(e: React.MouseEvent) => {
          console.log('🔵 Header', e);
          e.stopPropagation();
          setShow(false);
        }}
      />
    </div>
  );
};

export default ScheduleMeetingHeader;
