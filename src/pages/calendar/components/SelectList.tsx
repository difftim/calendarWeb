import React, { useMemo, useState } from 'react';
import { Checkbox, ConfigProvider, Flex } from 'antd';
import classNames from 'classnames';
import { useGetColor } from '@shared/ConfigProvider';
import { IconChevronRight1 as ChevronRight } from '@shared/IconsNew';
import { cid2uid, cleanUserNameForDisplay } from '@/util';
import { useAtomValue } from 'jotai';
import { userIdAtom } from '@/atoms';
import { userInfoByIdAtom } from '@/atoms/userInfo';

const SelectListItem = ({ item, color, checked, disabled }: any) => {
  const userInfo = useAtomValue(userInfoByIdAtom(item.id));
  const showName = item.cname || cleanUserNameForDisplay(userInfo);

  return (
    <div className="option-item" key={item.id}>
      <Checkbox
        checked={checked}
        disabled={disabled}
        value={item.id}
        style={{ width: '100%' }}
        className={`checkbox_base checkbox_${color}`}
      >
        <Flex align="center" gap={6}>
          <span className="name-item-text">{showName}</span>
          {item.calendarType === 'proxy' && <span className="tag-text">PROXY</span>}
          {item.calendarType === 'merge' && <span className="tag-text">MERGE</span>}
        </Flex>
      </Checkbox>
    </div>
  );
};

export const SelectList: React.FC<{
  title: string;
  list: any[];
  checked: string[];
  style?: any;
  listStyle?: any;
  bgColors: string[];
  onChange?: (items: any[]) => void;
}> = ({ title, list, checked, onChange, style = {}, listStyle = {}, bgColors }) => {
  const [show, setShow] = useState(true);
  const colors = useMemo(() => bgColors.map(bgColor => bgColor.replace('#', '')), [bgColors]);
  const { getColor } = useGetColor();
  const myId = useAtomValue(userIdAtom);

  const toggle = () => setShow(s => !s);

  return (
    <ConfigProvider
      theme={{
        components: {
          Checkbox: {
            borderRadiusSM: 2,
            colorBorder: getColor('dswColorTextDisable'),
            colorBgContainer: 'transparent',
            colorBgContainerDisabled: getColor('dswColorBackgroundDisable'),
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
          <ChevronRight onClick={toggle} className={classNames('arrow', { show })} />
        </div>
      </div>
      {show ? (
        <Checkbox.Group
          value={checked}
          onChange={values => onChange?.(values)}
          className="option-list"
          style={listStyle}
        >
          {list.map((item, index) => {
            const id = cid2uid(item.cid);
            const isMe = id === myId;
            return (
              <SelectListItem
                key={id}
                item={{ ...item, id }}
                disabled={isMe}
                checked={isMe || checked.includes(id)}
                color={colors[index]}
              />
            );
          })}
        </Checkbox.Group>
      ) : null}
    </ConfigProvider>
  );
};
