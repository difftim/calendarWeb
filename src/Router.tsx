import React from 'react';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { Provider } from 'jotai';

import Layout from './layout';
import ListPage from './pages/list';
import CalendarPage from './pages/calendar';
import { store } from './atoms/store';

const userId = '+747099999222';

const Router = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* 根路径默认重定向到 /list */}
            <Route index element={<Navigate to="/calendar" replace />} />
            {/* /list 路由显示列表页面 */}
            <Route path="list" element={<ListPage userId={userId} />} />
            <Route path="calendar" element={<CalendarPage userId={userId} />} />
            {/* 404 时也显示列表页面 */}
            <Route path="*" element={<CalendarPage userId={userId} />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
};
export default Router;
