import React from 'react';
import { AutoSizer, List } from 'react-virtualized';
import classNames from 'classnames';

import { ContactListItem } from '@/components/shared/ConversationItem';
import { IconTablerCircleMinus } from '@shared/IconsNew';
import { cleanUserNameForDisplay } from '@/util';

type Props = {
  list: any[];
  type?: string;
  host?: string | null;
  rowHeight?: number;
  style?: any;
  itemStyle?: any;
  onDelete?: (file: any) => void;
};

const Success = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    style={{
      borderRadius: '50%',
      background: 'rgba(1, 188, 106, 0.10)',
      padding: '4px',
      boxSizing: 'content-box',
      marginRight: '16px',
      flexShrink: 0,
    }}
  >
    <path
      d="M3.33203 8.0013L6.66536 11.3346L13.332 4.66797"
      stroke="#01BC6A"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Fail = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    style={{
      borderRadius: '50%',
      background: 'rgba(248, 64, 53, 0.10)',
      padding: '4px',
      boxSizing: 'content-box',
      marginRight: '16px',
      flexShrink: 0,
    }}
  >
    <path
      d="M10.3337 1.66602L1.66699 10.3327M1.66699 1.66602L10.3337 10.3327"
      stroke="#F84035"
      strokeWidth="1.45"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ScheduleUserList = ({
  list,
  onDelete,
  host = null,
  type = 'create',
  style = {},
  itemStyle = {},
  rowHeight = 60,
}: Props) => {
  const renderRow = ({ index, style }: any): JSX.Element => {
    const conversation = list[index];
    conversation.name = cleanUserNameForDisplay(conversation);
    const renderExtraElement = (conversation: any) => {
      if (type === 'view') {
        const MAP: Record<string, any> = {
          yes: Success,
          no: Fail,
        };

        return MAP[conversation.going] || <></>;
      }

      if (!conversation.isRemovable || conversation.id === host) {
        return <></>;
      }

      return (
        <IconTablerCircleMinus
          style={{ cursor: 'pointer', marginLeft: 'auto' }}
          className="item-hover-close"
          onClick={() => onDelete?.(conversation.id)}
        />
      );
    };

    const prefixText =
      conversation.role === 'host' || host === conversation.id ? 'Host・' : undefined;

    return (
      <ContactListItem
        key={conversation.uid}
        id={conversation.uid}
        extraElement={renderExtraElement(conversation)}
        style={{ ...style, ...itemStyle }}
        prefixText={prefixText}
        noHover
      />
    );
  };

  return (
    <div className={classNames('user-list hideScrollbar', {})} style={style}>
      <AutoSizer>
        {({ height, width }) => (
          <List
            className={'module-left-pane__virtual-list overflow-style-normal hideScrollbar'}
            width={width}
            height={height}
            rowCount={list.length}
            rowHeight={rowHeight}
            rowRenderer={renderRow}
          />
        )}
      </AutoSizer>
    </div>
  );
};

export default ScheduleUserList;
