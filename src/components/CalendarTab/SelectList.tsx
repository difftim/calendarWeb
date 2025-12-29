import React, { useState, useMemo } from 'react';
import { Checkbox, Flex } from 'antd';
import classNames from 'classnames';
import { useGetColor } from '../ConfigProvider';
import { IconChevronRight1 as ChevronRight, IconCloseF } from '../IconsNew';
import { cleanUserNameForDisplay } from '@/utils/util';
import './SelectList.scss';

interface SelectListProps {
  title: string;
  list: any[];
  checked: string[];
  onDelete?: (item: any) => any;
  style?: React.CSSProperties;
  listStyle?: React.CSSProperties;
  bgColors: string[];
  myId?: string;
  onChange?: (items: string[]) => void;
}

export const SelectList: React.FC<SelectListProps> = ({
  title,
  list,
  onDelete,
  checked,
  onChange,
  style = {},
  listStyle = {},
  bgColors,
  myId,
}) => {
  const [show, setShow] = useState(true);
  const colors = useMemo(() => bgColors.map(bgColor => bgColor.replace('#', '')), [bgColors]);
  const { getColor } = useGetColor();

  const toggle = () => setShow(s => !s);

  const getShowName = (item: any) => {
    return item.cname || cleanUserNameForDisplay(item);
  };

  return (
    <div className="select-list-container">
      <div className="select-list" style={style}>
        <div className="select-title" onClick={toggle}>
          {title}
        </div>
        <div className="select-icons">
          <ChevronRight
            onClick={toggle}
            className={classNames('arrow', {
              show: show,
            })}
            width={20}
            height={20}
          />
        </div>
      </div>
      {show ? (
        <Checkbox.Group
          value={checked}
          onChange={values => onChange?.(values as string[])}
          className="option-list"
          style={listStyle}
        >
          {list.map((item: any, index: number) => {
            const isMe = item.id === myId;
            const showName = getShowName(item);

            return (
              <div className="option-item" key={item.id}>
                <Checkbox
                  checked={isMe || checked.includes(item.id)}
                  disabled={isMe}
                  value={item.id}
                  style={{ width: '100%' }}
                  className={`checkbox_base checkbox_${colors[index]}`}
                >
                  <Flex align="center" gap={6}>
                    <span className="name-item-text">{showName}</span>
                    {item.calendarType === 'proxy' && <span className="tag-text">PROXY</span>}
                    {item.calendarType === 'merge' && <span className="tag-text">MERGE</span>}
                  </Flex>
                </Checkbox>
                {onDelete && (
                  <IconCloseF width={16} height={16} className="delete-icon" onClick={onDelete} />
                )}
              </div>
            );
          })}
        </Checkbox.Group>
      ) : null}
    </div>
  );
};

export default SelectList;
