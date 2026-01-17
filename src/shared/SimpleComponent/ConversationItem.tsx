import React from 'react';
import { Avatar } from './Avatar';
import { Checkbox } from 'antd';
import classNames from 'classnames';
import { cleanUserIdForDisplay } from '@/util';

export interface ConversationListItemProps {
  id: string;
  avatarPath?: string;
  type: 'group' | 'direct';
  name?: string;
  lastMessage?: string;
  email?: string;
  style?: any;
  onClick?: () => void;
  isMe?: boolean;
  disabled?: boolean;
  showCheckbox?: boolean;
  checked?: boolean;
  showMeNote?: boolean;
  ext?: boolean;
  members?: string[];
  activeAt?: number;
}

export const ConversationItem = (props: ConversationListItemProps) => {
  const {
    style,
    id,
    avatarPath,
    type,
    name,
    email,
    members,
    onClick,
    isMe,
    disabled = false,
    showMeNote = false,
    showCheckbox = false,
    checked = false,
  } = props;

  const showNote = isMe && showMeNote;

  const renderAvatar = () => {
    return (
      <div className="avatar-box">
        <Avatar
          id={id}
          name={name}
          avatarPath={avatarPath}
          conversationType={type}
          isMe={isMe && showNote}
        />
        {type === 'group' && members && members.length > 0 && (
          <div className="module-avatar-group-members-count">{members?.length}</div>
        )}
      </div>
    );
  };

  const renderHeader = () => {
    const nameOrId = name?.trim() || cleanUserIdForDisplay(id);

    return (
      <div className="conversation-list-item__header">
        <div className="conversation-list-item__name">{nameOrId}</div>
      </div>
    );
  };

  const renderEmail = () => {
    return <div className="conversation-list-item__last-message">{email}</div>;
  };

  return (
    <div
      style={style}
      className={classNames('dsw-simple-conversation-list-item-container', {
        disabled,
      })}
      onClick={onClick}
    >
      {showCheckbox && (
        <Checkbox
          className="conversation-checkbox"
          style={{ marginRight: 10 }}
          checked={checked}
          disabled={disabled}
        />
      )}
      {renderAvatar()}
      <div className="conversation-list-item__content">
        {renderHeader()}
        {type === 'direct' && renderEmail()}
      </div>
    </div>
  );
};
