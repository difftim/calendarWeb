import { userIdAtom } from '@/atoms';
import { userInfoByIdAtom } from '@/atoms/userInfo';
import { Avatar } from '@/shared/Avatar';
import { cid2uid, cleanUserNameForDisplay, getOffset, getUtcOffset } from '@/util';
import { useAtomValue } from 'jotai';
import React from 'react';

export const HeaderAvatar = ({
  timeZone,
  item,
  totalChecked,
}: {
  timeZone: string;
  item: any;
  totalChecked: number;
}) => {
  const timeZoneNum = getOffset(item);
  const myId = useAtomValue(userIdAtom);
  const userId = cid2uid(item.cid);
  const utcOffset =
    userId === myId ? getUtcOffset(timeZone) : `UTC${timeZoneNum >= 0 ? '+' : ''}${timeZoneNum}`;
  const userInfo = useAtomValue(userInfoByIdAtom(userId));

  return (
    <div className="avatar-header">
      {totalChecked > 1 && (
        <Avatar
          conversationType="direct"
          size={36}
          name={userInfo.name}
          id={userId}
          avatarPath={userInfo.avatarPath}
        />
      )}
      <div className="name ellipsis-1">{item.cname || cleanUserNameForDisplay(userInfo)}</div>
      <div className="utc">{utcOffset}</div>
    </div>
  );
};

export default HeaderAvatar;
