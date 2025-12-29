import React, { useState } from 'react';
import { Calendar, Button, Spin } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import ConfigProvider from '../shared/ConfigProvider';
import { LocalizerType } from '@/types/Util';
import './CalendarList.scss';

interface CalendarListProps {
  i18n: LocalizerType;
  ourNumber: string;
  currentTab: string;
  meetings: Record<string, any>;
}

/**
 * CalendarList 组件 - 简化版
 * 这是从 difft-desktop 移植的简化版本
 * 完整版本包含复杂的会议调度、日历视图切换等功能
 */
const CalendarList: React.FC<CalendarListProps> = props => {
  const { i18n, ourNumber, meetings } = props;
  const [view, setView] = useState<'list' | 'day' | 'week'>('week');
  const [date, setDate] = useState(dayjs());
  const [loading] = useState(false);

  const renderLeft = () => {
    return (
      <div className="calendar-left-panel">
        <div className="title">Calendar</div>

        <div className="main-block">
          <div className="meeting-block book">
            <span>📹</span>
            <div>Meeting</div>
          </div>
          <div className="meeting-block instant">
            <span>📅</span>
            <div>Event</div>
          </div>
          <div className="meeting-block instant">
            <span>⚡</span>
            <div>Instant Meet</div>
          </div>
          <div className="meeting-block instant">
            <span>📡</span>
            <div>Live Stream</div>
          </div>
          <div className="meeting-block instant">
            <span>🔗</span>
            <div>My Room</div>
          </div>
        </div>

        <Calendar fullscreen={false} value={date} onSelect={newDate => setDate(newDate)} />

        <div className="calendar-info">
          <p>User: {ourNumber}</p>
          <p>Meetings: {Object.keys(meetings).length}</p>
        </div>
      </div>
    );
  };

  const renderRight = () => {
    return (
      <div className="calendar-main-panel">
        <div className="sticky-header is-sticky">
          <div className="header-left">
            <span className="today">Today</span>
            <span className="date-str">{date.format('ddd, MMM D')}</span>
          </div>
          <div className="btn-wrapper">
            <Button type={view === 'list' ? 'primary' : 'default'} onClick={() => setView('list')}>
              List
            </Button>
            <Button type={view === 'week' ? 'primary' : 'default'} onClick={() => setView('week')}>
              Week
            </Button>
            <Button type={view === 'day' ? 'primary' : 'default'} onClick={() => setView('day')}>
              Day
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="loading-indicator">
            <Spin />
          </div>
        ) : (
          <div className="calendar-content">
            <div className="placeholder">
              <h3>Calendar View - {view.toUpperCase()}</h3>
              <p>这是一个简化版的日历视图</p>
              <p>完整版本需要集成 @difftim/scheduler-component</p>
              <p>当前选中日期: {date.format('YYYY-MM-DD')}</p>
              <p>当前用户: {ourNumber}</p>
              <p>会议数量: {Object.keys(meetings).length}</p>

              <div style={{ marginTop: '20px', textAlign: 'left', maxWidth: '600px' }}>
                <h4>原始组件功能包括：</h4>
                <ul>
                  <li>✅ 多视图切换（列表/周/日）</li>
                  <li>✅ 会议创建和编辑</li>
                  <li>✅ 日历同步（我的日历/其他日历）</li>
                  <li>✅ 时区支持</li>
                  <li>✅ 下拉刷新</li>
                  <li>✅ 实时会议状态</li>
                  <li>✅ 即时会议</li>
                  <li>✅ 直播流</li>
                  <li>✅ 个人会议室</li>
                </ul>

                <h4 style={{ marginTop: '20px' }}>移植说明：</h4>
                <p>
                  由于完整的 CalendarList 组件有 1500+ 行代码， 包含大量业务逻辑和 Electron
                  特定功能， 这里提供了一个简化的框架版本。
                </p>
                <p>
                  如需完整功能，请参考：
                  <br />
                  <code>
                    /Users/primo/Documents/difft-desktop/ts/components/CalendarTab/CalendarList.tsx
                  </code>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="meeting-schedule-pane-wrapper">
      {renderLeft()}
      {renderRight()}
    </div>
  );
};

export default CalendarList;
