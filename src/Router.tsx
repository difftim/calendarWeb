import React from 'react';
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom';
import { Provider } from 'jotai';

import Layout from './layout';
import ListPage from './pages/list';
import CalendarPage from './pages/calendar';
import { store } from './atoms/store';

const Router = () => {
  return (
    <Provider store={store}>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* 根路径默认重定向到 /dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            {/* /list 路由显示列表页面 */}
            <Route path="/list" element={<ListPage />} />
            {/* /dashboard 路由，用 ?view=day 区分视图 */}
            <Route path="/dashboard" element={<CalendarPage />} />
            {/* 404 时显示日历页面 */}
            <Route path="*" element={<CalendarPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </Provider>
  );
};
export default Router;
