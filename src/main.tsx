import React from 'react';
import ReactDOM from 'react-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Router from '@/Router';
import '@/styles/index.scss';
import { getTheme } from '@difftim/jsbridge-utils';
import { themeAtom } from './atoms';
import { store } from './atoms/store';

// 预获取主题并设置到 store（使用与 Provider 相同的 store 实例）
getTheme()
  .then(theme => {
    const mode = theme === 'dark' ? 'dark' : 'light';
    store.set(themeAtom, mode);
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(mode === 'dark' ? 'dark-theme' : 'light-theme');
  })
  .catch(() => {
    store.set(themeAtom, 'light');
  });

// 创建 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
  },
});

// // Set up mock CALENDAR_API for standalone mode
// if (!window.CALENDAR_API) {
//   window.CALENDAR_API = {
//     ourNumber: 'demo-user',
//     i18n,
//     isWebApiReady: async () => {
//       console.log('Web API ready (mock)');
//     },
//     registerMeetingUpdateIpc: _callback => {
//       console.log('registerMeetingUpdateIpc called (mock)');
//     },
//     getMeetingsFromReduxStore: async () => {
//       return {};
//     },
//     fetchGlobalConfig: async () => {
//       return {};
//     },
//     getConversationFromMainThread: async () => {
//       return [];
//     },
//   };
// }

// Apply default theme
document.body.classList.add('light-theme');

// Render the app
const rootElement = document.getElementById('root');
ReactDOM.render(
  <QueryClientProvider client={queryClient}>
    <Router />
  </QueryClientProvider>,
  rootElement
);
