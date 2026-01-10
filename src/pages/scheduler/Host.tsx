import React from 'react';
import { useAtomValue } from 'jotai';

import { userIdAtom } from '@/atoms';
import Select from '@/components/shared/Select';
import { useDetailDataValue } from '@/hooks/useDetailData';
import { cleanUserNameForDisplay, cleanUserIdForDisplay, isMatchUserId, uid2cid } from '@/util';
// import { uniqBy } from 'lodash';

const Host = () => {
  const { mode, host, hostInfo, members, creator, calendarId } = useDetailDataValue();
  const myId = useAtomValue(userIdAtom);
  // view / update
  if (mode !== 'create' && host) {
    const getHostName = () => {
      if (hostInfo?.uid && !isMatchUserId(hostInfo.uid) && hostInfo.name) {
        return hostInfo.name;
      }

      const hostItem = members?.find(item => item.uid === host);

      if (hostItem?.name) {
        return cleanUserNameForDisplay({ name: hostItem.name, id: hostItem.uid });
      }

      return cleanUserIdForDisplay(host);
    };
    const renderCreator = (creator: { uid: string; name?: string }) => {
      if (creator.name) {
        return `Created by ${creator.name}`;
      }
      return `Created by ${creator.name || creator.uid}`;
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
            {renderCreator(creator)}
          </div>
        ) : null}
      </>
    );
  }

  // create
  if (mode === 'create') {
    // TODO
    // const hostOptions = calendarList.filter(Boolean).map(cItem => {
    //   const item = getUserBaseInfo(cid2uid(cItem.cid));
    //   return {
    //     label: cItem.name || cleanUserNameForDisplay(item),
    //     value: cItem.cid,
    //   };
    // });

    const hostOptions = [
      {
        label: myId,
        value: uid2cid(myId),
      },
    ];

    // const setNewItems = (cid: string) => (items: any[]) => {
    //   const curUid = cid2uid(cid);
    //   const groupMembers = groupInfo?.gid ? (getUserBaseInfo(groupInfo.gid)?.members ?? []) : [];

    //   const isGroupUser = groupMembers.includes(curUid);

    //   const calendarUser = {
    //     ...getUserBaseInfo(curUid),
    //     isRemovable: false,
    //     isGroupUser,
    //   };
    //   const newItems = uniqBy([calendarUser, ...items], 'id');

    //   return newItems.filter(item => {
    //     if (cid2uid(cid) === item.id) {
    //       return true;
    //     }
    //     const itemIsHost = hostOptions.some(o => cid2uid(o.value) === item.id);
    //     // 不是群成员则移除
    //     if (itemIsHost) {
    //       return groupMembers.includes(item.id);
    //     }

    //     return true;
    //   });
    // };

    return (
      <div className="item">
        <div className="item-title">Host</div>
        <Select
          style={{ maxWidth: '248px' }}
          variant="outlined"
          size="large"
          value={calendarId}
          onChange={cid => {
            console.log('current calendar id', cid);
            // setCalenderId(cid);
            // setItems(setNewItems(cid));
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
