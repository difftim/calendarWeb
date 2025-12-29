# Calendar Web 项目移植总结

## 项目概述

成功将 `difft-desktop` 中的 `IndependentPageEntry` 组件移植到独立的 Calendar Web 项目中。

## 技术栈

- **构建工具**: Vite 6.3.6
- **框架**: React 17.0.2
- **TypeScript**: 5.6.3
- **UI 库**: Ant Design 5.22.7
- **状态管理**: @tanstack/react-query 4.36.1
- **样式**: SCSS

## 完成的工作

### ✅ 1. 项目初始化
- 创建 Vite 6.3.6 项目结构
- 配置 TypeScript（tsconfig.json, tsconfig.node.json）
- 配置 Vite（vite.config.ts）
- 设置 package.json，包含所有必要依赖

### ✅ 2. 核心组件移植

#### IndependentPageEntry 组件
**源文件**: `/Users/primo/Documents/difft-desktop/ts/components/CalendarTab/IndependentPageEntry/index.tsx`
**目标**: `src/components/IndependentPageEntry/index.tsx`

功能包括：
- React Query 集成
- 会议数据状态管理
- 定时更新逻辑（每分钟刷新）
- ConfigProvider 集成
- 加载状态管理

#### ConfigProvider 组件
**源文件**: `/Users/primo/Documents/difft-desktop/ts/components/shared/ConfigProvider/ConfigProvider.tsx`
**目标**: `src/components/shared/ConfigProvider/index.tsx`

功能包括：
- Ant Design 主题定制
- 亮色/暗色主题切换
- useTheme hook
- 主题颜色系统

#### CalendarList 组件（简化版）
**源文件**: `/Users/primo/Documents/difft-desktop/ts/components/CalendarTab/CalendarList.tsx` (1500+ 行)
**目标**: `src/components/CalendarList/index.tsx` (简化版)

简化版包括：
- 基本 UI 布局（左侧面板 + 主面板）
- 视图切换按钮（List/Week/Day）
- Ant Design Calendar 集成
- 响应式样式

### ✅ 3. 工具函数和类型定义

#### 类型定义
- `src/types/Util.ts`: LocalizerType, ThemeSettingType 等
- `src/vite-env.d.ts`: 全局类型声明

#### 工具函数
- `src/utils/loopCall.ts`: 循环调用工具（定时任务）
- `src/utils/initDayjs.ts`: Dayjs 初始化和国际化配置
- `src/utils/i18n.ts`: 国际化支持（mock）
- `src/utils/globalAdapter.ts`: 全局适配器（Electron API mock）
- `src/utils/exported_variables.ts`: 主题颜色变量

### ✅ 4. 样式系统

- `src/styles/variables.scss`: SCSS 变量定义
- `src/styles/index.scss`: 全局样式和主题类
- `src/components/CalendarList/CalendarList.scss`: CalendarList 组件样式

### ✅ 5. 入口和配置

- `index.html`: HTML 模板
- `src/main.tsx`: 应用入口
- `.gitignore`: Git 忽略配置
- `README.md`: 项目文档
- `QUICKSTART.md`: 快速开始指南

## 项目结构

```
calendarWeb/
├── src/
│   ├── components/
│   │   ├── CalendarList/            # 日历列表组件（简化版）
│   │   │   ├── index.tsx
│   │   │   └── CalendarList.scss
│   │   ├── IndependentPageEntry/    # 根组件
│   │   │   └── index.tsx
│   │   └── shared/
│   │       └── ConfigProvider/      # 主题配置
│   │           ├── index.tsx
│   │           └── useTheme.ts
│   ├── styles/                      # 全局样式
│   │   ├── variables.scss
│   │   └── index.scss
│   ├── types/                       # TypeScript 类型
│   │   └── Util.ts
│   ├── utils/                       # 工具函数
│   │   ├── exported_variables.ts
│   │   ├── globalAdapter.ts
│   │   ├── i18n.ts
│   │   ├── initDayjs.ts
│   │   └── loopCall.ts
│   ├── main.tsx                     # 应用入口
│   └── vite-env.d.ts                # Vite 类型声明
├── index.html                       # HTML 模板
├── vite.config.ts                   # Vite 配置
├── tsconfig.json                    # TypeScript 配置
├── tsconfig.node.json               # Node TypeScript 配置
├── package.json                     # 项目配置
├── .gitignore                       # Git 忽略配置
├── README.md                        # 项目文档
├── QUICKSTART.md                    # 快速开始
└── MIGRATION.md                     # 本文件
```

## 依赖对照表

### 从 difft-desktop 复用的依赖

| 依赖包 | 版本 | 用途 |
|--------|------|------|
| @difftim/scheduler-component | 0.1.8 | 日历调度组件 |
| @emoji-mart/data | 1.2.1 | Emoji 数据 |
| @emoji-mart/react | 1.1.1 | React Emoji 组件 |
| @react-spring/web | 9.7.4 | 动画库 |
| @tanstack/react-query | 4.36.1 | 数据获取和缓存 |
| antd | 5.22.7 | UI 组件库 |
| dayjs | 1.11.13 | 日期时间处理 |
| lodash | 4.17.21 | 工具函数库 |
| react | 17.0.2 | React 框架 |
| react-dom | 17.0.2 | React DOM |
| react-pull-to-refresh | ^2.0.1 | 下拉刷新 |
| classnames | 2.3.2 | CSS 类名工具 |
| lz-string | 1.5.0 | 字符串压缩 |

### 新增的依赖

| 依赖包 | 版本 | 用途 |
|--------|------|------|
| vite | 6.3.6 | 构建工具 |
| @vitejs/plugin-react | ^4.3.4 | Vite React 插件 |
| sass | 1.89.2 | SCSS 编译器 |

## Mock 实现

由于从 Electron 应用移植到 Web 应用，以下功能需要 Mock：

### globalAdapter.ts

```typescript
// Electron IPC 相关
- isCurrentWindowIndependent()
- getWebApi()
- instantMeeting()
- registerReadScheduleNotifyCallback()
- registerIPCScheduleWithSomeone()
- getUserBaseInfo()
- getConversations()
- updateTodayUnreadSchedule()
- isInsiderUpdate()
- isDev()
```

### CALENDAR_API

```typescript
window.CALENDAR_API = {
  ourNumber: 'demo-user',
  i18n: (key: string) => key,
  isWebApiReady: async () => {},
  registerMeetingUpdateIpc: () => {},
  getMeetingsFromReduxStore: async () => ({}),
  fetchGlobalConfig: async () => ({}),
  getConversationFromMainThread: async () => [],
}
```

## 简化说明

### CalendarList 组件

原始文件：`/Users/primo/Documents/difft-desktop/ts/components/CalendarTab/CalendarList.tsx`
- 代码行数：**1500+ 行**
- 复杂度：**高**

简化版本：`src/components/CalendarList/index.tsx`
- 代码行数：**~150 行**
- 保留：基本 UI 框架、视图切换、日历选择
- 移除：复杂业务逻辑、会议调度、IPC 通信

### 未移植的相关组件

如需完整功能，还需移植以下组件：

1. **ListView** - 列表视图组件
2. **SelectList** - 日历选择列表
3. **ListItem** - 列表项组件
4. **CalendarSettingDialog** - 日历设置对话框
5. **ScheduleMeetingDialog** - 会议调度对话框
6. **joinMeeting** - 加入会议逻辑
7. **各种 hooks**:
   - useFormatCalendarList
   - useFormatMeetingList
   - useQueryEvents
   - useQueryInComingEvents
   - useAntdLocale
   - useTimeZoneDayjs
   - useMeetingStatusCheck

## 运行指南

### 安装依赖

```bash
cd /Users/primo/Documents/calendarWeb
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问: http://localhost:3000

### 构建生产版本

```bash
npm run build
```

输出目录: `dist/`

### 类型检查

```bash
npm run type-check
```

## 下一步建议

### 短期目标

1. ✅ 基础项目结构搭建
2. ✅ 核心组件移植
3. ⏸️ 完善 CalendarList 组件功能
4. ⏸️ 集成真实的后端 API
5. ⏸️ 添加会议数据管理

### 中期目标

1. 实现完整的日历视图（Week/Day/List）
2. 添加会议创建和编辑功能
3. 集成 @difftim/scheduler-component
4. 实现日历同步功能
5. 添加用户认证

### 长期目标

1. 移植所有子组件
2. 实现完整的业务逻辑
3. 性能优化
4. 单元测试和 E2E 测试
5. 部署和 CI/CD

## 技术债务和注意事项

### ⚠️ Mock 实现
- globalAdapter 中的所有函数都是 mock
- 需要真实的 API 集成

### ⚠️ 简化组件
- CalendarList 是简化版本
- 缺少完整的业务逻辑

### ⚠️ 缺失功能
- 用户认证
- 会议调度
- 实时更新
- 通知系统

### ⚠️ 依赖问题
- @difftim/scheduler-component 可能需要额外配置
- 某些 Electron 特定的依赖已移除

## 参考文档

### 原始项目
- 路径: `/Users/primo/Documents/difft-desktop`
- 核心文件: `ts/components/CalendarTab/IndependentPageEntry/index.tsx`
- CalendarList: `ts/components/CalendarTab/CalendarList.tsx`

### 相关文档
- [Vite 文档](https://vitejs.dev/)
- [React 文档](https://react.dev/)
- [Ant Design 文档](https://ant.design/)
- [React Query 文档](https://tanstack.com/query/latest)
- [Dayjs 文档](https://day.js.org/)

## 总结

✅ **成功完成**:
- 项目基础架构搭建
- 核心组件移植
- 开发环境配置
- 样式系统建立
- 文档编写

⏸️ **待完成**:
- CalendarList 完整功能
- 真实 API 集成
- 完整的业务逻辑实现

📊 **移植进度**: ~30%（核心框架完成，业务逻辑待实现）

---

**移植完成日期**: 2025-12-29
**移植者**: AI Assistant
**项目状态**: 可运行的基础版本 ✅

