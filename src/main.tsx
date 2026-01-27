import React from 'react';
import ReactDOM from 'react-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Router from '@/Router';
import { initApp } from '@/init';
import '@/styles/index.scss';

// 打印构建时间
console.log(
  '%c📅 Build Time: %c' + (import.meta.env.VITE_BUILD_TIME || 'Unknown'),
  'color: #1890ff; font-weight: bold;',
  'color: #52c41a; font-weight: bold;'
);

// 初始化主题、联系人和群组
initApp();

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
