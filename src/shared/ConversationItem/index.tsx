import React, { ReactNode, useCallback } from 'react';
import classNames from 'classnames';

import { Avatar } from '@/shared/Avatar';
import { cleanUserIdForDisplay, isBotId } from '@/util';
import { useAtomValue } from 'jotai';
import { userInfoByIdAtom } from '@/atoms/userInfo';

interface Props {
  id: string;
  onClick?: (event?: any) => void;
  style?: object;
  noHover?: boolean;
  extraElement?: ReactNode;
  prefixText?: JSX.Element | string;
  hideContent?: ReactNode;
}

export const ContactListItem: React.FC<Props> = ({
  id,
  onClick,
  style,
  noHover,
  extraElement,
  prefixText = '',
  hideContent = false,
}) => {
  const userInfo = useAtomValue(userInfoByIdAtom(id));
  const name = userInfo.name;
  const email = userInfo.email;
  const avatarPath = userInfo.avatarPath;

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
      if (event?.target) {
        const target = event.target as HTMLElement;
        const isIgnored =
          target.className === 'add-dot-comment' || target.className.includes('module-avatar');
        if (isIgnored) {
          return;
        }
      }
      onClick?.(event);
    },
    [onClick]
  );

  const renderAvatar = () => (
    <Avatar
      id={id!}
      avatarPath={avatarPath}
      conversationType="direct"
      name={name}
      size={36}
      noClickEvent
    />
  );

  const idForDisplay = cleanUserIdForDisplay(id || '');
  let title = name ? name : idForDisplay;
  if (isBotId(id) && hideContent && !name?.trim()) {
    title = idForDisplay;
  }

  const titleElements = [
    title ? (
      <div
        key={'module-contact-list-item__text__name'}
        className={classNames('module-contact-list-item__text__name__standard')}
      >
        {title}
      </div>
    ) : null,
  ];

  const emailOrNumber = email ? email : idForDisplay;
  const displayContent = [
    <span
      className="module-contact-list-item__text__additional-data"
      key={'module-contact-list-item__text__additional-data'}
    >
      {prefixText}
      {emailOrNumber}
    </span>,
  ];

  return (
    <div
      style={style}
      role="button"
      onClick={handleClick}
      className={classNames(
        'module-contact-list-item',
        noHover ? 'module-contact-list-item-no-hover' : '',
        onClick ? 'module-contact-list-item--with-click-handler' : null
      )}
    >
      {renderAvatar()}
      <div className="module-contact-list-item__text" style={{ width: 'calc(100% - 48px - 29px)' }}>
        <div className="module-contact-list-item__text__header">
          <div className={classNames('module-contact-list-item__text__name')}>{titleElements}</div>
        </div>

        <div
          className={classNames('module-contact-list-item__text__additional-data', {
            'module-contact-list-item__text__additional-data-noData': hideContent,
          })}
        >
          {!hideContent && displayContent}
        </div>
      </div>
      {extraElement || null}
    </div>
  );
};
