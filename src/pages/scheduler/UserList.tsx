import React from 'react';
import { Drawer, Flex, Tooltip } from 'antd';

import { useDetailDataValue, useSetDetailData } from '@/hooks/useDetailData';
import CommonUserList from './components/SchedulerUserList';
import { useI18n } from '@/hooks/useI18n';
import { cid2uid, sortUserList, stopClick } from '@/util';
import { IconBackF, IconCloseF, IconHelperF, IconTablerUserPlus } from '@/shared/IconsNew';
import { useSetAtom } from 'jotai';
import { showPannelAtom } from '@/atoms/detail';

const GuestUserList = () => {
  const { guests, host, calendarId, mode } = useDetailDataValue();
  const { i18n } = useI18n();
  const setData = useSetDetailData();
  const isCreateMode = mode === 'create';
  const isViewMode = mode === 'view';

  return (
    <>
      <div
        className="dsw-shared-typography-p4"
        style={{
          color: 'var(--dsw-color-text-third)',
          margin: '10px 16px 4px 16px',
        }}
      >
        {i18n('schedule.guestsTip')}
      </div>
      <CommonUserList
        onDelete={(id: string) => {
          const newList = guests!.users.filter(itemId => itemId !== id);
          if (!newList.length) {
            setData({
              childModalType: '',
              guests: { allStaff: false, users: newList, total: newList.length },
            });
          }
        }}
        type={isViewMode ? 'view' : 'create'}
        host={isCreateMode ? cid2uid(calendarId) : host}
        list={guests!.users.map(id => ({ id, isRemovable: true }))}
        itemStyle={{ padding: '12px 16px' }}
        style={{ flexGrow: 1, flexShrink: 0 }}
      />
    </>
  );
};

const AttendeeUserList = () => {
  const { members, host, calendarId, mode, isLiveStream, syncToGoogle, source, isGroup, group } =
    useDetailDataValue();
  const { i18n } = useI18n();
  const setData = useSetDetailData();
  const isCreateMode = mode === 'create';
  const isViewMode = mode === 'view';
  const showGoogleSync = isCreateMode ? syncToGoogle : source === 'google';
  const hideGroupTip = !isGroup || isLiveStream || showGoogleSync;

  const onDeleteUser = (id: string) => {
    const newList = members.filter(item => item.uid !== id);
    if (!newList.length) {
      setData({ childModalType: '', members: [] });
    } else {
      setData({ members: newList });
    }
  };

  const [inGroup, outGroup] = members
    .reduce(
      (sum, item) => {
        if (!isGroup || isLiveStream || item.isGroupUser || showGoogleSync) {
          sum[0].push(item);
        } else {
          sum[1].push(item);
        }

        return sum;
      },
      [[], []] as any[]
    )
    .map(sortUserList);

  const outHeight = outGroup?.length
    ? Math.min(outGroup.length * 60, window.innerHeight / 2 - 74)
    : 0;

  return (
    <>
      {!hideGroupTip && (
        <>
          <div className="memeber-change-tip">
            <div>{i18n('schedule.groupMeetingTip')}</div>
            <div className="second">
              <span>change</span>
              <Tooltip
                mouseEnterDelay={0.2}
                overlayClassName={'antd-tooltip-cover'}
                placement="top"
                title={i18n('schedule.groupMeetingTipDetail')}
              >
                <IconHelperF className="helper-icon" onClick={stopClick} />
              </Tooltip>
            </div>
          </div>
        </>
      )}
      {outGroup?.length > 0 && (
        <>
          <div className="group-tip">{`${outGroup.length} Out of Group`}</div>
          <CommonUserList
            type={isViewMode ? 'view' : 'create'}
            host={isCreateMode ? cid2uid(calendarId) : host}
            list={outGroup}
            style={{ height: outHeight }}
            onDelete={onDeleteUser}
            itemStyle={{ padding: '12px 16px' }}
          />
        </>
      )}
      {!hideGroupTip && (
        <div className="group-tip">
          <span style={{ flexShrink: 0 }}>{`${inGroup.length} In Group`}</span>
          {group?.name ? (
            <div className="ellipsis">
              <span>&nbsp;{`- ${group.name}`}</span>
            </div>
          ) : null}
        </div>
      )}
      <CommonUserList
        onDelete={onDeleteUser}
        type={isViewMode ? 'view' : 'create'}
        host={isCreateMode ? cid2uid(calendarId) : host}
        list={inGroup}
        itemStyle={{ padding: '12px 16px' }}
        style={{ flexGrow: 1, flexShrink: 0 }}
      />
    </>
  );
};

const UserListTitle = ({
  totalCount,
  type,
  isViewMode,
}: {
  totalCount: number;
  type?: string;
  isViewMode: boolean;
}) => {
  const title =
    type === 'guest'
      ? `Guests (${totalCount})`
      : type === 'attendee'
        ? `Attendees (${totalCount})`
        : 'Members';

  const setData = useSetDetailData();
  const setShow = useSetAtom(showPannelAtom);

  return (
    <Flex align="center" justify="space-between" className="user-list-title">
      <IconBackF onClick={() => setData({ childModalType: '' })} />
      <span>{title}</span>
      {isViewMode ? (
        <IconCloseF
          onClick={() => {
            setShow(false);
          }}
        />
      ) : (
        <IconTablerUserPlus
          onClick={() => {
            console.log('add attendee or guest from dialog', type);
            // TODO
            // add attendee or guest from dialog
          }}
        />
      )}
    </Flex>
  );
};

const UserList = () => {
  const { isLiveStream, childModalType, guests, members, mode } = useDetailDataValue();
  const showGuestList = Boolean(childModalType === 'guest' && isLiveStream && guests?.users.length);
  const showAttendeeList = Boolean(childModalType === 'attendee' && members?.length);
  const totalCount = (showGuestList ? guests?.users.length : members?.length) || 0;
  const isViewMode = mode === 'view';

  return (
    <Drawer
      open={showGuestList || showAttendeeList}
      className="user-list-drawer"
      closeIcon={false}
      title={
        <UserListTitle totalCount={totalCount} type={childModalType} isViewMode={isViewMode} />
      }
    >
      {showGuestList ? <GuestUserList /> : showAttendeeList ? <AttendeeUserList /> : null}
    </Drawer>
  );
};

export default UserList;
