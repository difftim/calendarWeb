import React from 'react';
import ReactDOM from 'react-dom';
import CalendarIndependentEntry from './components/IndependentPageEntry';
import { createI18n } from './utils/i18n';
import { initDayjs } from './utils/initDayjs';
import './styles/index.scss';

// Initialize dayjs with locale
const locale = 'en';
const i18n = createI18n(locale);
initDayjs(locale, i18n);

// Set up mock CALENDAR_API for standalone mode
if (!window.CALENDAR_API) {
  window.CALENDAR_API = {
    ourNumber: 'demo-user',
    i18n,
    isWebApiReady: async () => {
      console.log('Web API ready (mock)');
    },
    registerMeetingUpdateIpc: _callback => {
      console.log('registerMeetingUpdateIpc called (mock)');
    },
    getMeetingsFromReduxStore: async () => {
      return {};
    },
    fetchGlobalConfig: async () => {
      return {};
    },
    getConversationFromMainThread: async () => {
      return [];
    },
  };
}

// Apply default theme
document.body.classList.add('light-theme');

// Render the app
const rootElement = document.getElementById('root');

ReactDOM.render(<CalendarIndependentEntry />, rootElement);
