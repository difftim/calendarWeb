import React from 'react';
import ReactDOM from 'react-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import Router from '@/Router';
import { initApp } from '@/init';
import { queryClient } from './atoms/query';

import '@/styles/index.scss';

// 打印构建时间
console.log(
  '%c📅 Build Time: %c' + (import.meta.env.VITE_BUILD_TIME || 'Unknown'),
  'color: #1890ff; font-weight: bold;',
  'color: #52c41a; font-weight: bold;'
);

// 初始化主题、联系人和群组
initApp();

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
