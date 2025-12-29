import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ConfigProvider from '../shared/ConfigProvider';
import { LocalizerType } from '@/types/Util';
import { loopCall } from '@/utils/loopCall';

type Meetings = Record<string, any>;

interface CalendarAPI {
  ourNumber: string;
  i18n: LocalizerType;
  isWebApiReady: () => Promise<void>;
  registerMeetingUpdateIpc: (setMeetings: (meetings: Meetings) => void) => void;
  getMeetingsFromReduxStore: () => Promise<Meetings>;
  fetchGlobalConfig: () => Promise<Record<string, any>>;
  getConversationFromMainThread: () => Promise<unknown[]>;
}

// Declare global CALENDAR_API
declare global {
  interface Window {
    CALENDAR_API: CalendarAPI;
    globalConfig: Record<string, any>;
  }
}

export const CalendarIndependentEntry = (props: { meetings?: Meetings }) => {
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState(props.meetings || {});

  // Import CalendarList component
  const CalendarList = useMemo(() => {
    const component = require('../CalendarList').default;
    return component;
  }, []);

  useEffect(() => {
    if (!loading) {
      document.querySelector('.fake')?.remove();
    }
  }, [loading]);

  useLayoutEffect(() => {
    const renderPage = async () => {
      try {
        await window.CALENDAR_API?.isWebApiReady();
        const [meetingsData, globalConfig] = await Promise.all([
          window.CALENDAR_API?.getMeetingsFromReduxStore() || Promise.resolve({}),
          window.CALENDAR_API?.fetchGlobalConfig() || Promise.resolve({}),
          window.CALENDAR_API?.getConversationFromMainThread() || Promise.resolve([]),
        ]);
        window.globalConfig = globalConfig;

        unstable_batchedUpdates(() => {
          setMeetings(meetingsData);
          setLoading(false);
        });
      } catch (error) {
        console.error('Failed to initialize calendar:', error);
        setLoading(false);
      }
    };

    const updateListEveryMinutes = () => {
      const loopCallEveryMinute = loopCall(60 * 1000, { type: 'next' });
      loopCallEveryMinute(async () => {
        window.dispatchEvent(new CustomEvent('force-update-meeting-list'));
      });
    };

    if (window.CALENDAR_API) {
      window.CALENDAR_API.registerMeetingUpdateIpc?.(setMeetings);
      renderPage();
      updateListEveryMinutes();
    } else {
      // If no CALENDAR_API, just show the UI
      setLoading(false);
    }
  }, []);

  if (loading) {
    return null;
  }

  const { ourNumber = 'demo-user', i18n = (key: string) => key } = window.CALENDAR_API || {};

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider isLightlyDisableMode>
        <CalendarList
          meetings={meetings}
          ourNumber={ourNumber}
          i18n={i18n}
          currentTab="meetingSchedule"
        />
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default CalendarIndependentEntry;
