import React from 'react';
import { ScheduleProvider as Provider } from './ScheduleProvider';
import Title from './Title';
import TimePicker from './TimePicker';
import Duration from './Duration';
import Guest from './Guest';
import Host from './Host';
import Repeat from './Repeat';
import FileManager from './FileManager';
import Desc from './Desc';
import UserListButton from './UserListButton';
import More from './More';
import GoogleMeetButton from './GoogleMeetButton';
import BotOption from './BotOption';
import Permit from './Permit';
import Bottom from './Bottom';
import UserList from './UserList';

export const ScheduleMeetingDialog = () => {
  return (
    <Provider>
      <Title />
      <TimePicker />
      <Duration />
      <UserListButton />
      <BotOption />
      <Guest />
      <Host />
      <Repeat />
      <FileManager />
      <Desc />
      <Permit />
      <More />
      <GoogleMeetButton />
      <Bottom />
      <UserList />
    </Provider>
  );
};
