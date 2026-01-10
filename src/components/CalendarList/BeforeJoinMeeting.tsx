import React, { useEffect, useState } from 'react';
import { Alert, Button, Spin } from 'antd';
import { Avatar } from '@shared/SimpleComponent';
import { getWebApi, getUserBaseInfo, isCurrentWindowIndependent } from '../../shims/globalAdapter';
interface PropsType {
  onOk: () => void;
  onCancel: () => void;
  meetingOptions: any;
  setMeetingOptions: any;
  // justStart?: boolean;
  buttonCall?: boolean;
}

export default function BeforeJoinMeeting(props: PropsType) {
  const { meetingOptions, setMeetingOptions, onOk, onCancel, buttonCall } = props || {};
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [existUsers, setExistUsers] = useState<Array<string>>([]);
  const [existOtherUsers, setExistOtherUsers] = useState<Array<string>>([]);
  const [meetingName, setMeetingName] = useState(meetingOptions?.meetingName || '');

  const getUniqueUsers = (users: Array<any>) => {
    const uniqueUsers = [];
    const tempSet = new Set();
    for (let i = 0; i < users.length; i += 1) {
      const ac = users[i].account || users[i];
      if (ac) {
        if (ac.startsWith('web-')) {
          if (!tempSet.has(ac)) {
            uniqueUsers.push(ac);
            tempSet.add(ac);
          }
        } else {
          const setItem = ac.replace(/^(mac|android|ios|\+)/, '');
          if (!tempSet.has(setItem)) {
            uniqueUsers.push('+' + setItem);
            tempSet.add(setItem);
          }
        }
      }
    }
    return uniqueUsers;
  };

  // async useEffect demo
  // https://devtrium.com/posts/async-functions-useeffect
  useEffect(() => {
    let isSubscribed = true;

    // declare the async data fetching function
    const fetchData = async () => {
      try {
        const res = await getWebApi().getMeetingOnlineUsers(meetingOptions.channelName);

        if (isSubscribed) {
          setIsLoading(false);
          if (res && res.name) {
            setMeetingName(res.name);
            setMeetingOptions((options: any) => ({
              ...options,
              meetingName: res.name,
            }));
          }

          // 当前会议没有人，但是有人在其他会议里
          if (
            buttonCall &&
            res &&
            res.users &&
            res.users.length === 0 &&
            res.userInOtherMeeting &&
            res.userInOtherMeeting.length
          ) {
            console.log('BeforeJoinMeeting.tsx user:' + JSON.stringify(res.userInOtherMeeting));
            const tempUsers = getUniqueUsers(res.userInOtherMeeting);
            setExistOtherUsers(tempUsers);
            return;
          }

          if (res && res.users) {
            console.log('BeforeJoinMeeting.tsx user:' + JSON.stringify(res.users));
            // 过滤后再设置
            const uniqueUsers = getUniqueUsers(res.users);
            setExistUsers(uniqueUsers);
          } else {
            setApiError(true);
            return;
          }
        }
      } catch (err) {
        console.log('BeforeJoinMeeting.tsx error:', err);
        if (isSubscribed) {
          setIsLoading(false);
          setApiError(true);
        }
      }
    };

    // call the function
    fetchData();

    // cancel any future `setData`
    return () => {
      isSubscribed = false;
    };
  }, []);

  const getConversation = (id: string) => {
    if (!id) {
      console.log('conversation not found for:', id);
      return null;
    }

    // 按理说这里不用加这个判断，但是确实遇到过ConversationController.get返回数据了，无法复现，非常奇怪
    if (id.startsWith('web-')) {
      return null;
    }
    return getUserBaseInfo(id);
  };

  const getConversationProps = (id: string) => {
    const c = getConversation(id);
    if (c) {
      return {
        ...c,
        isMe: false,
      };
    } else {
      let name = id;
      if (id.startsWith('web-')) {
        const temp = id.replace('web-', '');
        name = temp.indexOf('-') > 0 ? temp.substring(0, temp.indexOf('-')) : temp;
      }
      return {
        id,
        name,
        isArchived: false,
        timestamp: 0,
        phoneNumber: id,
        type: 'direct',
        isMe: false,
        lastUpdated: 0,
        unreadCount: 0,
        isSelected: false,
        isTyping: false,
      };
    }
  };

  const getShortUserName = (item: { name: string; id: string }) => {
    const name = item.name || item.id;
    if (item.id?.length < 8) {
      return name.trim();
    }

    let realName = name.trim();
    if (realName) {
      let spacePos = realName.indexOf(' ');
      if (spacePos > 0) {
        realName = realName.substring(0, spacePos);
      }
      spacePos = realName.indexOf('(');
      if (spacePos > 0) {
        realName = realName.substring(0, spacePos);
      }
    }
    return realName;
  };

  const renderTitle = () => {
    if (isLoading) {
      return null;
    }
    return <p className={'title'}>{meetingName || meetingOptions.meetingName || 'Wea Meeting'}</p>;
  };

  const renderOtherInMeetingSubTitle = () => {
    if (existOtherUsers?.length) {
      return <p className={'body-text'}>Ready to start?</p>;
    }
    return null;
  };

  const renderBody = () => {
    const noClickEvent = (item: any) => isCurrentWindowIndependent() || item.id.startsWith('web-');
    // if (justStart) {
    //   return <p className={'body-text'}>Ready to start?</p>;
    // }
    if (apiError) {
      // return <Alert message="Network Error" type="error" showIcon />;
      return null;
    }
    if (isLoading) {
      return (
        <div className={'avatar-container'}>
          <Spin size="large" />
        </div>
      );
    }

    // user in other meeting
    if (existOtherUsers.length === 1) {
      const avatarItem = getConversationProps(existOtherUsers[0]);
      const realName = getShortUserName(avatarItem);
      const msg = realName + ' is in another meeting.';
      return <Alert message={msg} type="info" showIcon />;
    }

    if (existOtherUsers.length === 2) {
      const avatarItem = getConversationProps(existOtherUsers[0]);
      const avatarItem2 = getConversationProps(existOtherUsers[1]);
      const realName = getShortUserName(avatarItem);
      const realName2 = getShortUserName(avatarItem2);

      const msg = realName + ' and ' + realName2 + ' are in another meeting.';
      return <Alert message={msg} type="info" showIcon />;
    }
    if (existOtherUsers.length === 3) {
      const avatarItem = getConversationProps(existOtherUsers[0]);
      const avatarItem2 = getConversationProps(existOtherUsers[1]);
      const avatarItem3 = getConversationProps(existOtherUsers[2]);

      const realName = getShortUserName(avatarItem);
      const realName2 = getShortUserName(avatarItem2);
      const realName3 = getShortUserName(avatarItem3);

      const msg = realName + ', ' + realName2 + ' and ' + realName3 + ' are in another meeting.';
      return <Alert message={msg} type="info" showIcon />;
    }
    if (existOtherUsers.length === 4) {
      const avatarItem = getConversationProps(existOtherUsers[0]);
      const avatarItem2 = getConversationProps(existOtherUsers[1]);
      const avatarItem3 = getConversationProps(existOtherUsers[2]);
      const avatarItem4 = getConversationProps(existOtherUsers[3]);

      const realName = getShortUserName(avatarItem);
      const realName2 = getShortUserName(avatarItem2);
      const realName3 = getShortUserName(avatarItem3);
      const realName4 = getShortUserName(avatarItem4);

      const msg =
        realName +
        ', ' +
        realName2 +
        ', ' +
        realName3 +
        ' and ' +
        realName4 +
        ' are in another meeting.';
      return <Alert message={msg} type="info" showIcon />;
    }
    if (existOtherUsers.length > 4) {
      const avatarItem = getConversationProps(existOtherUsers[0]);
      const avatarItem2 = getConversationProps(existOtherUsers[1]);
      const avatarItem3 = getConversationProps(existOtherUsers[2]);

      const realName = getShortUserName(avatarItem);
      const realName2 = getShortUserName(avatarItem2);
      const realName3 = getShortUserName(avatarItem3);
      const msg =
        realName +
        ', ' +
        realName2 +
        ', ' +
        realName3 +
        ' and ' +
        (existOtherUsers.length - 3) +
        ' more are in another meeting.';
      return <Alert message={msg} type="info" showIcon />;
    }

    // no one
    if (existUsers.length === 0) {
      if (buttonCall) {
        return <p className={'body-text'}>Ready to start?</p>;
      }
      return <p className={'body-text'}>No one else is here. Ready to Join?</p>;
    }

    // only one
    if (existUsers.length === 1) {
      const avatarItem = getConversationProps(existUsers[0]);
      const realName = getShortUserName(avatarItem);
      return (
        <>
          <p className={'body-text'}>{realName + ' is in this meeting. Ready to Join?'}</p>
          <div className={'avatar-container'}>
            <Avatar
              size={36}
              conversationType={'direct'}
              id={avatarItem.id}
              name={realName}
              avatarPath={(avatarItem as any).avatarPath}
              noClickEvent={noClickEvent(avatarItem)}
            />
          </div>
        </>
      );
    }

    // only two
    if (existUsers.length === 2) {
      const avatarItem = getConversationProps(existUsers[0]);
      const avatarItem2 = getConversationProps(existUsers[1]);

      const realName = getShortUserName(avatarItem);
      const realName2 = getShortUserName(avatarItem2);

      return (
        <>
          <p className={'body-text'}>
            {realName + ' and ' + realName2 + ' are in this meeting. Ready to Join?'}
          </p>
          <div className={'avatar-container'}>
            <Avatar
              size={36}
              conversationType={'direct'}
              id={avatarItem.id}
              name={realName}
              avatarPath={(avatarItem as any).avatarPath}
              noClickEvent={noClickEvent(avatarItem)}
            />
            <Avatar
              size={36}
              conversationType={'direct'}
              id={avatarItem2.id}
              name={realName2}
              avatarPath={(avatarItem2 as any).avatarPath}
              noClickEvent={noClickEvent(avatarItem)}
            />
          </div>
        </>
      );
    }

    // only three
    if (existUsers.length === 3) {
      const avatarItem = getConversationProps(existUsers[0]);
      const avatarItem2 = getConversationProps(existUsers[1]);
      const avatarItem3 = getConversationProps(existUsers[2]);

      const realName = getShortUserName(avatarItem);
      const realName2 = getShortUserName(avatarItem2);
      const realName3 = getShortUserName(avatarItem3);

      return (
        <>
          <p className={'body-text'}>
            {realName +
              ', ' +
              realName2 +
              ' and ' +
              realName3 +
              ' are in this meeting. Ready to Join?'}
          </p>
          <div className={'avatar-container'}>
            <Avatar
              size={36}
              conversationType={'direct'}
              id={avatarItem.id}
              name={realName}
              avatarPath={(avatarItem as any).avatarPath}
              noClickEvent={noClickEvent(avatarItem)}
            />
            <Avatar
              size={36}
              conversationType={'direct'}
              id={avatarItem2.id}
              name={realName2}
              avatarPath={(avatarItem2 as any).avatarPath}
              noClickEvent={noClickEvent(avatarItem)}
            />
            <Avatar
              size={36}
              conversationType={'direct'}
              id={avatarItem3.id}
              name={realName3}
              avatarPath={(avatarItem3 as any).avatarPath}
              noClickEvent={noClickEvent(avatarItem)}
            />
          </div>
        </>
      );
    }

    // only four
    if (existUsers.length === 4) {
      const avatarItem = getConversationProps(existUsers[0]);
      const avatarItem2 = getConversationProps(existUsers[1]);
      const avatarItem3 = getConversationProps(existUsers[2]);
      const avatarItem4 = getConversationProps(existUsers[3]);

      const realName = getShortUserName(avatarItem);
      const realName2 = getShortUserName(avatarItem2);
      const realName3 = getShortUserName(avatarItem3);
      const realName4 = getShortUserName(avatarItem4);

      return (
        <>
          <p className={'body-text'}>
            {realName +
              ', ' +
              realName2 +
              ', ' +
              realName3 +
              ' and ' +
              realName4 +
              ' are in this meeting. Ready to Join?'}
          </p>
          <div className={'avatar-container'}>
            <Avatar
              size={36}
              conversationType={'direct'}
              id={avatarItem.id}
              name={realName}
              avatarPath={(avatarItem as any).avatarPath}
              noClickEvent={noClickEvent(avatarItem)}
            />
            <Avatar
              size={36}
              conversationType={'direct'}
              id={avatarItem2.id}
              name={realName2}
              avatarPath={(avatarItem2 as any).avatarPath}
              noClickEvent={noClickEvent(avatarItem)}
            />
            <Avatar
              size={36}
              conversationType={'direct'}
              id={avatarItem3.id}
              name={realName3}
              avatarPath={(avatarItem3 as any).avatarPath}
              noClickEvent={noClickEvent(avatarItem)}
            />
            <Avatar
              size={36}
              conversationType={'direct'}
              id={avatarItem4.id}
              name={realName4}
              avatarPath={(avatarItem4 as any).avatarPath}
              noClickEvent={noClickEvent(avatarItem)}
            />
          </div>
        </>
      );
    }

    // more than four
    if (existUsers.length > 4) {
      const avatarItem = getConversationProps(existUsers[0]);
      const avatarItem2 = getConversationProps(existUsers[1]);
      const avatarItem3 = getConversationProps(existUsers[2]);

      const realName = getShortUserName(avatarItem);
      const realName2 = getShortUserName(avatarItem2);
      const realName3 = getShortUserName(avatarItem3);

      const maxUserLen = existUsers.length - 3 >= 99 ? 99 : existUsers.length - 3;
      return (
        <>
          <p className={'body-text'}>
            {realName +
              ', ' +
              realName2 +
              ', ' +
              realName3 +
              ' and ' +
              (existUsers.length - 3) +
              ' more are in this meeting. Ready to Join?'}
          </p>
          <div className={'avatar-container'}>
            <Avatar
              size={36}
              conversationType={'direct'}
              id={avatarItem.id}
              name={realName}
              avatarPath={(avatarItem as any).avatarPath}
              noClickEvent={noClickEvent(avatarItem)}
            />
            <Avatar
              size={36}
              conversationType={'direct'}
              id={avatarItem2.id}
              name={realName2}
              avatarPath={(avatarItem2 as any).avatarPath}
              noClickEvent={noClickEvent(avatarItem)}
            />
            <Avatar
              size={36}
              conversationType={'direct'}
              id={avatarItem3.id}
              name={realName3}
              avatarPath={(avatarItem3 as any).avatarPath}
              noClickEvent={noClickEvent(avatarItem)}
            />
            <div className={'avatarPlus'}>{'+' + maxUserLen}</div>
          </div>
        </>
      );
    }

    console.log('BeforeJoinMeeting.tsx renderBody error!');
    return null;
  };

  const renderFooter = () => {
    let okText = 'Start';
    if (!buttonCall || existUsers?.length) {
      okText = 'Join';
    }

    return (
      <div className={'foot'}>
        <Button onClick={onCancel} ghost className={'btnGhostBorder'}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={onOk}
          ref={ref => {
            ref?.focus();
          }}
        >
          {okText}
        </Button>
      </div>
    );
  };

  return (
    <div className={'before-join-meeting-root'}>
      {renderTitle()}
      {renderOtherInMeetingSubTitle()}
      {renderBody()}
      {renderFooter()}
    </div>
  );
}
