import React, { useMemo, useState } from 'react';
import { Checkbox, ConfigProvider, Flex } from 'antd';
import classNames from 'classnames';
import { useGetColor } from '../shared/ConfigProvider';
import { IconChevronRight1 as ChevronRight, IconCloseF } from '../shared/IconsNew';
import { cleanUserNameForDisplay } from '../../util';

export const SelectList: React.FC<{
  title: string;
  list: any[];
  checked: string[];
  onDelete?: (item: any) => any;
  style?: any;
  listStyle?: any;
  bgColors: string[];
  myId?: string;
  onChange?: (items: any[]) => void;
}> = ({ title, list, onDelete, checked, onChange, style = {}, listStyle = {}, bgColors, myId }) => {
  const [show, setShow] = useState(true);
  const colors = useMemo(() => bgColors.map(bgColor => bgColor.replace('#', '')), [bgColors]);
  const { getColor } = useGetColor();

  const toggle = () => setShow(s => !s);
  const getShowName = (item: any) => {
    return item.cname || cleanUserNameForDisplay(item);
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Checkbox: {
            colorTextDisabled: getColor('dswColorTextPrimary'),
            colorText: getColor('dswColorTextPrimary'),
          },
        },
      }}
    >
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
          />
        </div>
      </div>
      {show ? (
        <Checkbox.Group
          value={checked}
          onChange={values => onChange?.(values)}
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
    </ConfigProvider>
  );
};
