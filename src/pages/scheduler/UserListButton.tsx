import { IconChevronRight, IconHelperF, IconTablerPlus } from '@/components/shared/IconsNew';
import { useDetailDataValue, useSetDetailData } from '@/hooks/useDetailData';
import { useI18n } from '@/hooks/useI18n';
import { isBotId } from '@/util';
import { Flex, Tooltip } from 'antd';
import React from 'react';

const UserListButton = () => {
  const {
    mode,
    canInvite,
    group,
    isLiveStream,
    source = 'difft',
    syncToGoogle,
    members,
  } = useDetailDataValue();
  const setData = useSetDetailData();
  const isViewMode = mode === 'view';
  const showGoogleSync = mode !== 'create' ? source === 'google' : syncToGoogle;
  const memberCount = members.filter(m => !isBotId(m.uid)).length;

  const isPrivate = !group?.gid;
  const { i18n } = useI18n();

  const renderInOutGroup = () => {
    if (isPrivate || isLiveStream || showGoogleSync) {
      return null;
    }

    return (
      <div
        style={{
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          lineHeight: '20px',
        }}
      >
        <Tooltip
          mouseEnterDelay={0.2}
          overlayClassName={'antd-tooltip-cover'}
          placement="top"
          title={i18n('schedule.groupNotice')}
        >
          <IconHelperF className="helper-icon" />
        </Tooltip>
      </div>
    );
  };

  const hasGroupName = !isPrivate && group?.name && !showGoogleSync;

  if (isViewMode) {
    return (
      <div className="item">
        <div className="item-title">{i18n('schedule.attendee')}</div>
        <div
          className="hover preview-item"
          onClick={() => {
            setData({ childModalType: 'attendee' });
          }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            height: hasGroupName ? '60px' : '40px',
          }}
        >
          <div style={{ maxWidth: '196px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div>{memberCount}</div>
              {renderInOutGroup()}
            </div>
            {hasGroupName ? <div className="from-group">{`From group ${group?.name}`}</div> : null}
          </div>
          <IconChevronRight style={{ color: 'var(--dsw-color-text-third)' }} />
        </div>
      </div>
    );
  }

  // TODO
  const addAttendeeFromDialog = () => {};

  const renderEditAction = () => {
    if (mode !== 'create' && !canInvite) {
      return null;
    }

    return (
      <div className="edit-action" onClick={addAttendeeFromDialog}>
        <IconTablerPlus
          style={{
            width: '16px',
            height: '16px',
          }}
        />
        <span>Add</span>
      </div>
    );
  };

  return (
    <div className="item">
      <div className="item-title">{i18n('schedule.attendee')}</div>
      <div style={{ overflow: 'hidden' }}>
        {renderEditAction()}
        <Flex
          className="hover"
          onClick={() => setData({ childModalType: 'attendee' })}
          align="center"
          justify="space-between"
          style={{ cursor: 'pointer', padding: '2px 4px' }}
        >
          <div style={{ maxWidth: '220px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div style={{ lineHeight: '20px' }}>{memberCount}</div>
              {renderInOutGroup()}
            </div>
            {hasGroupName ? <div className="from-group">{`From group ${group?.name}`}</div> : null}
          </div>
          <IconChevronRight style={{ color: 'var(--dsw-color-text-third)' }} />
        </Flex>
      </div>
    </div>
  );
};

export default UserListButton;
