import React from 'react';
import classNames from 'classnames';
import './Avatar.scss';

interface AvatarProps {
  avatarPath?: string;
  size: number;
  name?: string;
  id?: string;
  i18n: any;
  conversationType: 'group' | 'direct';
  noClickEvent?: boolean;
  nonImageType?: 'search' | 'instant-meeting' | 'room' | 'google' | 'outlook';
}

// 简化版 Avatar 组件
export const Avatar: React.FC<AvatarProps> = ({
  avatarPath,
  size,
  name,
  id,
  noClickEvent,
  conversationType,
  nonImageType,
}) => {
  const [imageBroken, setImageBroken] = React.useState(false);

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getBackgroundColor = (id?: string) => {
    const colors = [
      '#FF453A',
      '#FF9F0B',
      '#FED709',
      '#31D15B',
      '#78C3FF',
      '#0B84FF',
      '#5E5CE6',
      '#D57FF5',
      '#727E87',
      '#FF4F79',
    ];
    if (!id) return colors[0];
    const index = id.charCodeAt(id.length - 1) % colors.length;
    return colors[index];
  };

  const hasImage = avatarPath && !imageBroken;
  const initials = getInitials(name || id);
  const backgroundColor = getBackgroundColor(id);

  const renderImage = () => {
    if (!hasImage) return null;
    return (
      <img
        src={avatarPath}
        alt={name || id}
        onError={() => setImageBroken(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    );
  };

  const renderNoImage = () => {
    if (nonImageType === 'google') {
      return <div className="avatar-icon google-icon">G</div>;
    }
    if (nonImageType === 'outlook') {
      return <div className="avatar-icon outlook-icon">O</div>;
    }
    if (conversationType === 'group') {
      return <div className="avatar-icon group-icon">👥</div>;
    }
    return (
      <div className="avatar-initials" style={{ lineHeight: `${size}px` }}>
        {initials}
      </div>
    );
  };

  return (
    <div
      className={classNames('module-avatar', `module-avatar--${size}`, {
        'module-avatar--with-image': hasImage,
        'module-avatar--no-image': !hasImage,
        'module-avatar--no-click': noClickEvent,
      })}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: hasImage ? 'transparent' : backgroundColor,
      }}
    >
      {hasImage ? renderImage() : renderNoImage()}
    </div>
  );
};

export default Avatar;
