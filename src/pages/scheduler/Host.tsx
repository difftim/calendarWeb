import React from 'react';
import { useAtomValue } from 'jotai';

import { bossCalendarAtom, timeZoneAtom, userInfoAtom } from '@/atoms';
import Select from '@/shared/Select';
import { useDetailDataValue, useSetDetailData } from '@/hooks/useDetailData';
import {
  cleanUserNameForDisplay,
  cleanUserIdForDisplay,
  isMatchUserId,
  uid2cid,
  cid2uid,
  getSimpleName,
} from '@/util';
import { getUserBaseInfoSync, userInfoByIdAtom } from '@/atoms/userInfo';
import { DetailData } from '@/atoms/detail';

const Creator = ({ creator }: { creator: { uid: string; name?: string } }) => {
  if (creator.name) {
    return <>Created by {getSimpleName(creator.name)}</>;
  }
  const userInfo = getUserBaseInfoSync(creator.uid);
  return <>Created by {getSimpleName(userInfo.name) || creator.uid}</>;
};

const Host = () => {
  const { mode, host, hostInfo, members, creator, calendarId, isLiveStream } = useDetailDataValue();
  const setData = useSetDetailData();
  const myInfo = useAtomValue(userInfoAtom);
  const timeZone = useAtomValue(timeZoneAtom);
  const bossCalendar = useAtomValue(bossCalendarAtom);
  const calendarList = [
    { ...myInfo, cid: uid2cid(myInfo.id), timeZone },
    ...(isLiveStream ? [] : bossCalendar),
  ];
  const hostUserInfo = useAtomValue(userInfoByIdAtom(host ?? ''));
  // view / update
  if (mode !== 'create' && host) {
    const getHostName = () => {
      if (hostInfo?.uid && !isMatchUserId(hostInfo.uid) && hostInfo.name) {
        return hostInfo.name;
      }
      if (hostUserInfo.name) {
        return cleanUserNameForDisplay(hostUserInfo);
      }
      return cleanUserIdForDisplay(host || '');
    };

    return (
      <>
        <div className="item">
          <div className="item-title">Host</div>
          <div
            className="ellipsis-1 preview-item"
            style={mode === 'view' ? {} : { borderColor: 'var(--dsw-color-line)' }}
          >
            {getHostName()}
          </div>
        </div>
        {creator?.uid && creator?.uid !== host ? (
          <div
            className="dsw-shared-typography-p4"
            style={{
              color: 'var(--dsw-color-text-third)',
              margin: '4px 0 4px 80px',
            }}
          >
            <Creator creator={creator} />
          </div>
        ) : null}
      </>
    );
  }

  // create
  if (mode === 'create') {
    const hostOptions = calendarList.filter(Boolean).map(cItem => {
      const curUid = cid2uid(cItem.cid);
      const item = getUserBaseInfoSync(curUid);
      return {
        label: cItem.name || cleanUserNameForDisplay(item),
        value: cItem.cid,
      };
    });

    const getNewMembers = (cid: string, members: DetailData['members']): DetailData['members'] => {
      const curUid = cid2uid(cid);
      const isInMembers = members.some(item => item.uid === curUid);
      if (isInMembers) {
        return members.map(item => ({
          ...item,
          role: item.uid === curUid ? 'host' : 'attendee',
          isRemovable: item.uid === curUid ? false : !item.isGroupUser,
        }));
      }
      const { name, email } = getUserBaseInfoSync(curUid);
      return [
        ...members.map(item => ({ ...item, role: 'attendee', isRemovable: !item.isGroupUser })),
        {
          uid: curUid,
          name,
          email,
          isRemovable: false,
          isGroupUser: false,
          role: 'host',
          going: 'maybe',
        },
      ] as unknown as DetailData['members'];
    };

    return (
      <div className="item">
        <div className="item-title">Host</div>
        <Select
          style={{ maxWidth: '248px' }}
          variant="outlined"
          size="large"
          value={calendarId}
          onChange={async cid => {
            console.log('current calendar id', cid);
            const newMembers = getNewMembers(cid, members);
            setData({ calendarId: cid, members: newMembers, host: cid2uid(cid) });
          }}
          options={hostOptions}
          popupClassName="schedule-selector"
          virtual={false}
        />
      </div>
    );
  }

  return null;
};

export default Host;
