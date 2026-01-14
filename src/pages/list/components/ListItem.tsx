import React from 'react';
import classNames from 'classnames';
import { useAtomValue, useSetAtom } from 'jotai';
// import { StartType } from './hooks/useMeetingStatusCheck';
import { Button } from '@shared/Button';
import { Avatar } from '@shared/Avatar';
import { IconGoogle, IconLiveStream, IconOutLook, IconTablerBell } from '@shared/IconsNew';
import { toastError, toastSuccess } from '@shared/Message';
import { onMuteMeeting } from '@/shims/globalAdapter';
import { userInfoByIdAtom } from '@/atoms/userInfo';
import { StartType, cleanUserNameForDisplay } from '@/util';
import { useSetDetailData } from '@/hooks/useDetailData';
import { useQueryDetail } from '@/hooks/useQueryDetail';
import { unstable_batchedUpdates } from 'react-dom';
import { showPannelAtom } from '@/atoms/detail';
// TODO
// import { joinMeeting } from './JoinMeeting';

type Props = {
  style: any;
  active: boolean;
  item: {
    isLiveStream?: boolean;
    rowType: 'data' | 'title' | 'diff';
    source:
      | 'google'
      | 'transfer'
      | 'difft'
      | 'secureMail'
      | 'secureMail-outlook'
      | 'secureMail-google';
    eid: string;
    cid: string;
    data?: any;
    duration?: any;
    topic?: any;
    host?: any;
    hostInfo?: {
      uid: string;
      name: string;
    };
    receiveNotification: boolean;
    start: number;
    isEnd?: boolean;
    channelName?: string;
    googleMeetingLink?: string;
    outlookMeetingLink?: string;
    disabled?: boolean;
    muted?: boolean;
    role?: string;
  };
  status?: {
    type: any;
  };
  isHighLight?: boolean;
  onCreateByFreeTime?: (options: any) => void;
  redpointColor?: string;
};

const ListItem = ({
  item,
  status,
  style,
  active = false,
  isHighLight = false,
  onCreateByFreeTime,
  redpointColor,
}: Props) => {
  // Hooks 必须在组件顶部，不能在条件 return 之后
  const hostId = item.hostInfo?.uid || item.host || '';
  const hostUserInfo = useAtomValue(userInfoByIdAtom(hostId));
  const setDetailData = useSetDetailData();
  const { getDetailData } = useQueryDetail();
  const setShowPannel = useSetAtom(showPannelAtom);

  // 获取显示名称，使用 cleanUserNameForDisplay 处理
  const displayName = hostUserInfo.name ? cleanUserNameForDisplay(hostUserInfo) : hostId;

  if (item.rowType === 'title') {
    return (
      <div className="item-title" style={style}>
        <div className="inner">{item.data}</div>
      </div>
    );
  }

  if (item.rowType === 'diff') {
    return (
      <div
        onClick={() => {
          if (!item.disabled) {
            onCreateByFreeTime?.(item);
          }
        }}
        className={classNames('item-diff', {
          highLight: isHighLight && !item.disabled,
          disabled: item.disabled,
        })}
        style={item.isEnd ? { ...style, paddingBottom: '24px' } : style}
      >
        {item.data}
      </div>
    );
  }

  const renderStatusBtn = () => {
    const isGoogleMeet = !item.channelName && item.googleMeetingLink;
    const isOutlookMeet = !item.channelName && item.outlookMeetingLink;
    const renderMuteBtn = () => {
      if (item.receiveNotification && Date.now() <= item.start * 1000 && !!item.channelName) {
        return (
          <div
            className="mute-btn hover-show"
            onClick={async e => {
              const { success, reason } = await onMuteMeeting(e, item);
              if (success) {
                toastSuccess('success!');
              } else {
                toastError(reason || 'Opreation failed');
              }
            }}
          >
            {item.muted ? 'Unmute' : 'Mute'}
          </div>
        );
      }

      return null;
    };

    const muteBtn = renderMuteBtn();
    const showJoinBtn = item.channelName || isGoogleMeet || isOutlookMeet;

    if (showJoinBtn && (status?.type === StartType.start || status?.type === StartType.incoming)) {
      return (
        <div className="status-btn-wrapper">
          {muteBtn}
          <Button
            type="primary"
            onClick={e => {
              console.log('joinMeeting', e, item);
            }}
            className="join-btn"
          >
            Join
          </Button>
        </div>
      );
    }

    if (!muteBtn) {
      return null;
    }

    return <div className="status-btn-wrapper">{muteBtn}</div>;
  };

  const canClick = (item: Props['item']) => {
    const host = item.host;
    if (!host || typeof host !== 'string' || item.disabled) {
      return false;
    }
    if (host.includes('@')) {
      return false;
    }
    if (!host.startsWith('+')) {
      return false;
    }
    if (!/^\+\d{11}$/.test(host)) {
      return false;
    }
    return true;
  };

  return (
    <div
      className={classNames('item-data', { disabled: item.disabled, active })}
      onClick={() => {
        if (item.disabled) {
          toastError('You have no access to view details');

          return;
        }

        unstable_batchedUpdates(() => {
          setDetailData(getDetailData(item.eid, item.cid, item.source));
          setShowPannel(true);
        });
        // TODO
      }}
      style={style}
    >
      <div className="main-info">
        <div onClick={e => e.stopPropagation()}>
          <Avatar
            size={40}
            noClickEvent={!canClick(item)}
            name={displayName}
            conversationType="direct"
            avatarPath={hostUserInfo.avatarPath || ''}
            id={hostId}
          />
        </div>
        <div style={{ minWidth: 0, flexGrow: 1 }}>
          <div className="topic">
            {item.muted ? <IconTablerBell className="bell" width={16} height={16} /> : null}
            {item.source === 'secureMail-outlook' && (
              <IconOutLook className="bell" width={16} height={16} />
            )}
            {(item.source === 'google' || item.source === 'secureMail-google') && (
              <IconGoogle className="bell" width={16} height={16} />
            )}
            {item.topic}
            {item.isLiveStream ? <IconLiveStream className="live" /> : null}
          </div>
          <div className="time">
            {redpointColor ? (
              <div className="point" style={{ backgroundColor: redpointColor }}></div>
            ) : null}
            {item.duration}
          </div>
        </div>
      </div>
      {renderStatusBtn()}
    </div>
  );
};

export default ListItem;
