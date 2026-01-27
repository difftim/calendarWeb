import React, { useState } from 'react';

import { Popover } from 'antd';

import { Button } from '@/shared/Button';
import { ContactListItem } from '@/shared/ConversationItem';
import { getUserBaseInfoSync } from '@/atoms/userInfo';
import { getSimpleName } from '@/util';

import EditUserForm from './EditUserForm';
import type { CalendarUserItemData, CalendarUserType } from '../utils';

export interface CalendarUserItemProps {
  item: CalendarUserItemData;
  type: CalendarUserType;
  myId: string;
  onRename?: (item: CalendarUserItemData, name: string) => Promise<void>;
  onRemove: (item: CalendarUserItemData) => Promise<void>;
}

const CalendarUserItem = ({ item, type, myId, onRename, onRemove }: CalendarUserItemProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const canRemove = !(type === 'my' && item.id === myId);

  return (
    <div className="calendar-setting-user-item">
      <ContactListItem
        useSimpleName
        id={item.id}
        calendarName={item.cname}
        noHover
        extraElement={
          <div className="calendar-setting-item-actions">
            {type !== 'proxy' && (
              <Popover
                destroyTooltipOnHide
                open={editOpen}
                onOpenChange={setEditOpen}
                trigger="click"
                arrow={false}
                content={
                  <EditUserForm
                    name={
                      item.cname || item.name || getSimpleName(getUserBaseInfoSync(item.id).name)
                    }
                    onConfirm={async nextName => {
                      await onRename?.(item, nextName);
                      setEditOpen(false);
                    }}
                  />
                }
                placement="left"
                overlayInnerStyle={{ padding: '12px', width: '250px' }}
              >
                <Button size="small">Edit</Button>
              </Popover>
            )}
            <Button
              size="small"
              disabled={!canRemove}
              onClick={() => {
                if (!canRemove) {
                  return;
                }
                onRemove(item);
              }}
            >
              {type === 'my' ? 'Unlink' : type === 'proxy' ? 'Remove' : 'Unsubscribe'}
            </Button>
          </div>
        }
      />
    </div>
  );
};

export default CalendarUserItem;
