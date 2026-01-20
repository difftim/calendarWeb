import React, { useState } from 'react';
import classNames from 'classnames';
import { getInitials } from '@/util';
import { IconTablerGroupIcon } from '../IconsNew';
import { Flex } from 'antd';

const BACKGROUND_COLORS = [
  'rgb(255,69,58)',
  'rgb(255,159,11)',
  'rgb(254,215,9)',
  'rgb(49,209,91)',
  'rgb(120,195,255)',
  'rgb(11,132,255)',
  'rgb(94,92,230)',
  'rgb(213,127,245)',
  'rgb(114,126,135)',
  'rgb(255,79,121)',
];
export interface AvatarProps {
  id: string;
  name?: string;
  avatarPath?: string;
  conversationType: 'group' | 'direct';
  isMe?: boolean;
  isGroup?: boolean;
  size?: number;
  noClickEvent?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const Avatar = (props: AvatarProps) => {
  const [imageBroken, setImageBroken] = useState(false);

  const handleImageError = () => {
    console.log('Avatar: Image failed to load; failing over to placeholder');
    setImageBroken(true);
  };

  const renderMe = () => {
    const { conversationType, isMe, size } = props;

    const sizeClass = size ? `module-avatar--${size}` : '';

    if (isMe) {
      return (
        <div
          className={classNames(
            'default-note-avatar',
            'avatar__icon',
            `avatar__icon--${conversationType}`,
            sizeClass
          )}
        />
      );
    }

    return null;
  };

  const renderImage = () => {
    const { avatarPath, isMe, isGroup, size = 36 } = props;

    if (isGroup) {
      return (
        <Flex
          className="default-group-avatar"
          style={{ width: size, height: size }}
          align="center"
          justify="center"
        >
          <IconTablerGroupIcon width={size - 12} height={size - 12} />
        </Flex>
      );
    }
    const hasImage = avatarPath && !imageBroken;
    if (!hasImage || isMe) {
      return null;
    }

    return (
      <img
        alt={''}
        onError={handleImageError}
        src={avatarPath}
        style={{ width: size, height: size, objectFit: 'cover' }}
      />
    );
  };

  const renderNoImage = () => {
    const { conversationType, id, name, avatarPath, isMe, size, isGroup } = props;
    const hasImage = avatarPath && !imageBroken;
    if (hasImage || isMe || isGroup) {
      return null;
    }

    const initials = getInitials(name || id);
    const sizeClass = size ? `module-avatar--${size}` : '';

    if (initials) {
      return (
        <div
          style={{
            width: size || 36,
            height: size || 36,
            lineHeight: `${size || 36}px`,
          }}
          className={classNames('avatar__label')}
        >
          {initials}
        </div>
      );
    }

    return (
      <div
        className={classNames(
          'default-private-avatar',
          'avatar__icon',
          `avatar__icon--${conversationType}`,
          sizeClass
        )}
      />
    );
  };

  const getBackgroundColor = (): string | undefined => {
    const { avatarPath, conversationType } = props;

    const isGroup = conversationType === 'group';
    const hasImage = avatarPath && !imageBroken;
    if (isGroup || hasImage) {
      return undefined;
    }

    const userId = props.id;
    if (userId) {
      const startPos = userId.includes('@') ? 0 : userId.length - 1;
      const sub = userId.substring(startPos, startPos + 1);
      const index = parseInt(sub, 10) % 10;
      if (index || index === 0) {
        return BACKGROUND_COLORS[index];
      } else {
        return BACKGROUND_COLORS[sub.charCodeAt(0) % 10];
      }
    }
    return undefined;
  };
  const background = getBackgroundColor();
  const sizeStyle = props.size ? { width: props.size, height: props.size } : {};

  return (
    <div
      role={'button'}
      className={'dsw-simple-avatar-container'}
      style={{
        cursor: 'pointer',
        background,
        ...sizeStyle,
      }}
      onClick={e => {
        e.stopPropagation();
        if (props.noClickEvent) {
          return;
        }
        props.onClick?.(e);
      }}
    >
      {renderMe()}
      {renderImage()}
      {renderNoImage()}
    </div>
  );
};
