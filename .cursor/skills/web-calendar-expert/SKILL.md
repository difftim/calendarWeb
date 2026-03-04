---
name: web-calendar-expert
description: Expert knowledge for the calendarWeb standalone web project. Use when modifying calendar dashboard, scheduler dialog, find-a-time, calendar settings, or any feature under /Users/primo/Documents/calendarWeb/. Triggers on keywords like "calendarWeb", "web 日历", "独立日历", "scheduler web", "web calendar", "日程 web".
globs: /Users/primo/Documents/calendarWeb/**/*
---

# CalendarWeb 领域知识

calendarWeb 是从 difft-desktop 剥离出来的**独立 Web 日历项目**，运行在 WebView 中，通过 JSBridge 与原生 App 通信。仅包含日历功能，不包含会议中（Meeting in-progress）相关功能。

## ⚠️ 强制规则（每次修改必须遵守）

### 规则 1：代码架构自迭代

本文档最核心的价值是**业务架构和执行流程**。每次修改本项目文件时，**必须**在完成代码变更后自迭代本文档：

**优先级最高 — 架构与流程：**
- 阅读代码过程中理解到的业务流程（数据如何刷新、事件如何创建、Jotai atom 间的依赖关系等），如果本文档中缺少或不完整，必须补充
- 发现新的数据流、JSBridge 通信、状态管理模式，必须整理写入

**次优先级 — 文件索引与样式：**
- 新增/删除文件时，更新文件索引
- 样式变化时，同步更新样式 section

### 规则 2：Figma 设计稿严格还原

UI 修改**必须严格遵循 Figma 设计稿**的精确数值，禁止凭感觉自定义。

### 规则 3：样式修改必须深挖现有逻辑

修改样式前，**必须先完整理解现有样式的实现方式**，再决定如何改动：

1. **读透基础样式**：找到目标元素的**所有生效样式**（基础 class、父级继承、组件库内部结构），不能只看要改的那一层。典型案例：
   - `.item` 用了 `grid-template-columns: 72px 1fr`，隐藏 `.item-title` 不会释放 72px 列空间，必须改 `display: block`
   - `.save-btn-wrapper` 基础样式是 `position: fixed; width: 359.5px; right: 0`，override 时必须逐个属性覆盖
   - antd 组件的真实 DOM 结构（如 Input 带 `allowClear` 时外层是 `.ant-input-affix-wrapper`，不是裸 `<input>`）

2. **识别 CSS 优先级陷阱**：
   - antd 5 的 CSS-in-JS 内联样式优先级高于普通选择器，可能需要 `!important`
   - `:first-of-type` 基于标签类型而非 class，混合不同 class 的同类型元素时会失效
   - `box-shadow` 和 `border` 视觉效果相似但属性不同，排查"线条"问题时两者都要检查

3. **涉及定位方案时对比思考**：
   - 滚动容器内固定元素：`position: absolute`（配合父级 `padding` 留空间）优于 `sticky`
   - 需要不跟随滚动的元素（如关闭按钮）：`absolute + z-index + 背景色` 确保遮盖

4. **改动可能影响其他模式时，先确认再动手**：
   - 同一组件在不同 `mode`（create / view / update）下表现不同，改动前确认所有模式的预期行为
   - 新增 class 时确认不会影响非目标状态（如 `.with-find-time` 下的样式不应泄漏到普通模式）

**核心原则：多问、问清楚了再实现，减少返工。不确定的地方停下来和用户确认。**

---

## 0. 与 difft-desktop 的核心差异

| 维度 | difft-desktop | calendarWeb |
|------|--------------|-------------|
| 运行环境 | Electron 桌面应用 | WebView（Vite + React 17） |
| 状态管理 | React Query + Props/Context | **Jotai atoms** + `jotai-tanstack-query` |
| HTTP 客户端 | `requestSchedulerServer`（自定义） | **`ky`**（`/scheduler` 前缀） |
| 认证 | Electron IPC | **JSBridge** `getMiniProgramToken` |
| ScheduleMeetingDialog | 单文件 ~3000 行 | **拆分为 ~15 个子组件** + `ScheduleProvider` |
| Find a Time | ScheduleMeetingHeader 内的 Popover | **内嵌面板**（`FindTime.tsx`）与表单并排显示 + Popover Calendar 日期选择 |
| 路由 | 无（单窗口 Tab 切换） | **react-router-dom** HashRouter |
| 原生通信 | Electron IPC + CustomEvent | **WKWebViewJavascriptBridge** |
| 会议中功能 | 完整（RTM、屏幕共享、悬浮条） | **无** |
| 数据刷新 | 多种 CustomEvent 事件 | `workspaceNotifyHandler` + `invalidateQueries` |

## 1. 技术栈

- **构建**: Vite 6 + TypeScript 5.6
- **UI**: React 17 + antd 5.22 + SCSS
- **状态**: Jotai 2.7 + jotai-tanstack-query 0.11 + React Query 4.36
- **路由**: react-router-dom 6
- **HTTP**: ky
- **日历组件**: `@difftim/scheduler-component`（MyCalendar）
- **原生桥接**: `@difftim/jsbridge-utils`

## 2. 项目结构

```
src/
├── main.tsx              — 入口，初始化 + 渲染
├── init.ts               — 主题/群组/AppName 初始化 + workspaceNotifyHandler 注册
├── Router.tsx             — 路由定义（/ → /dashboard, /list, /dashboard?view=day）
├── layout/index.tsx       — 主布局（侧边栏日历 + 主面板 + ScheduleMeetingDialog）
├── atoms/                 — Jotai 全局状态
│   ├── index.ts           — 核心 atoms（date, timeZone, userInfo, calendarChecked 等）
│   ├── detail.ts          — schedulerDataAtom + DetailData 类型定义
│   ├── query.ts           — atomWithQuery 定义（calendarQueryAtom, queryScheduleConfigAtom）
│   ├── store.ts           — Jotai store 实例
│   └── userInfo.ts        — 用户信息缓存
├── api/
│   ├── request.ts         — ky 实例配置（token 注入、错误处理、响应解包）
│   └── index.ts           — 所有 REST API 函数
├── pages/
│   ├── calendar/index.tsx — 日历主视图（周视图/日视图，使用 MyCalendar）
│   ├── list/index.tsx     — 列表视图（react-virtualized）
│   ├── scheduler/         — 预约会议弹窗（拆分后的组件）
│   └── calendarSetting/   — 日历设置
├── hooks/                 — 自定义 hooks
├── shared/                — 通用组件（Button, Input, Select, IconsNew, ConfigProvider）
├── styles/                — SCSS 样式
└── util/index.ts          — 工具函数
```

## 3. 状态管理架构（Jotai）

### 核心 Atoms（`atoms/index.ts`）

| Atom | 类型 | 说明 |
|------|------|------|
| `dateAtom` | 派生 atom | 当前选中日期（自动应用 timeZone + locale） |
| `showDateAtom` | 读写 atom | 侧边栏日历显示的月份（可独立于 dateAtom） |
| `timeZoneAtom` | 原始 atom | 当前时区（默认 `dayjs.tz.guess()`） |
| `userInfoAtom` | 派生 atom | 用户信息（从 JSBridge `getUserInfo` 获取） |
| `userIdAtom` | 派生 atom | 用户 ID |
| `myCalendarCheckedAtom` | 持久化 atom | 我的日历勾选列表（localStorage `myChecked`） |
| `otherCalendarCheckedAtom` | 持久化 atom | 他人日历勾选列表（localStorage `otherChecked`） |
| `calendarVersionAtom` | 持久化 atom | 日历数据版本号 |
| `bossCalendarAtom` | 持久化 atom | 代理日历列表 |
| `bridgeSupportedAtom` | loadable async | JSBridge 是否可用 |
| `themeAtom` | 原始 atom | 主题模式（light/dark） |

### 详情/弹窗 Atoms（`atoms/detail.ts`）

| Atom | 说明 |
|------|------|
| `showPannelAtom` | 控制 ScheduleMeetingDialog 显示/隐藏 |
| `showSettingAtom` | 控制日历设置弹窗 |
| `schedulerDataAtom` | 预约会议的完整数据（`DetailData` 类型，支持 Promise） |

### 数据查询 Atoms（`atoms/query.ts`）

| Atom | queryKey | 说明 |
|------|----------|------|
| `calendarQueryAtom` | `['myEvents', weekKey]` | 日历主数据，`staleTime: Infinity`，由 `dateAtom` 驱动 |
| `queryScheduleConfigAtom` | `['googleSyncConfig']` | Google 同步配置（仅 create 模式） |

### 关键数据流

```
dateAtom 变化
  → calendarQueryAtom 的 queryKey 变化
  → React Query 触发 refetch（如果该 queryKey 无缓存）
  → queryFn 调用 getSchedulerDashboard API
  → 响应经 formatDashboardResponse 处理
  → 更新 calendarVersionAtom, bossCalendarAtom, myCalendarCheckedAtom
  → 返回 { events, myUsers, otherUsers }
  → CalendarPage / ListView 通过 useAtomValue(calendarQueryAtom) 消费
```

## 4. API 层

### 请求配置（`api/request.ts`）

- 基于 `ky`，前缀 `/scheduler`
- **Token 注入**：`beforeRequest` hook 调用 `getMiniProgramToken` 获取 JWT
- **Token 刷新**：`beforeRetry` 在 token 过期时自动重试（最多 3 次）
- **响应解包**：`afterResponse` 自动检查 `body.status !== 0` 抛错，返回 `body.data`
- **全量响应**：请求头带 `x-full-response: 1` 时返回完整 `{ data, status, reason }`

### 主要 API（`api/index.ts`）

| 函数 | 方法 | 路径 | 用途 |
|------|------|------|------|
| `getSchedulerDashboard` | GET | `v1/calendar/dashboard` | 日历主数据 |
| `getMeetingScheduleDetail` | GET | `v1/calendar/:cid/events/:eid` | 事件详情 |
| `createMeetingSchedule` | POST | `v1/calendar/:cid/events` | 创建事件 |
| `updateMeetingSchedule` | PUT | `v1/calendar/:cid/events/:eid` | 更新事件 |
| `deleteMeetingSchedule` | DELETE | `v1/calendar/:cid/events/:eid` | 删除事件 |
| `getMeetingViewScheduleList` | POST | `v1/user/freebusy` | Find a Time 数据 |
| `goingScheduleMeeting` | PUT | `.../going` | RSVP |
| `copyScheduleMeetingInfo` | GET | `.../copy` | 复制会议信息 |
| `getProxyPermission` | GET | `v1/proxy/permissions` | 代理权限 |

## 5. ScheduleMeetingDialog 组件架构（拆分后）

```
ScheduleMeetingDialog (pages/scheduler/index.tsx)
└── ScheduleProvider (ScheduleProvider.tsx)
    ├── antd Drawer (width: showFindTime ? '100vw' : 360)
    │   ├── title: Header.tsx（显示标题 + 关闭按钮）
    │   └── children: .schedule-body-wrapper（flex 双栏布局）
    │       ├── .meeting-main（左侧 360px，表单）
    │       │   ├── Title.tsx        — 会议主题输入
    │       │   ├── TimePicker.tsx   — 日期时间选择
    │       │   ├── Duration.tsx     — 时长选择
    │       │   ├── UserListButton   — 参会人数量 + 点击展开
    │       │   ├── Guest.tsx        — 嘉宾管理
    │       │   ├── Host.tsx         — 主持人
    │       │   ├── Repeat.tsx       — 重复规则
    │       │   ├── FileManager.tsx  — 附件
    │       │   ├── Desc.tsx         — 描述
    │       │   ├── Permit.tsx       — 权限设置
    │       │   ├── More.tsx         — 更多选项（Speech Timer 等）
    │       │   ├── GoogleMeetButton — Google Meet 链接
    │       │   ├── Bottom.tsx       — 底部按钮（Schedule/Save/Join）
    │       │   └── UserList.tsx     — 参会人列表 Drawer
    │       └── FindTime.tsx（右侧 flex:1，Find a Time 面板，仅 create/可修改 update 时显示）
```

### 与 difft-desktop 的关键区别

- **ScheduleProvider** 取代了原来 `ScheduleMeetingDialog.tsx` 中的 3000 行代码
- 状态通过 **Jotai atom** (`schedulerDataAtom`) 全局共享，子组件直接读写
- `useSetDetailData` hook 封装了同步/异步两种写入模式
- `useLoadableDetailData` 用 `loadable()` 包装，避免 Suspense
- 子组件通过 `childModalType` 控制嵌套 Drawer（attendee / guest）
- `DetailData` 类型在 `atoms/detail.ts` 中定义，包含 `mode: 'create' | 'view' | 'update'`
- **FindTime 不再通过 `childModalType` 控制**，而是作为内嵌面板与表单并排显示（`ScheduleProvider` 层渲染）

## 6. Find a Time 架构

### 布局模式（2026-03-03 重构）

FindTime 不再是嵌套 Drawer，而是与 Schedule 表单**并排显示**在同一个全屏 Drawer 中：

- **显示条件**：`mode === 'create'` 或 `mode === 'update' && canModify` 时显示（`useShowFindTime` hook 在 `ScheduleProvider.tsx` 中）
- **布局**：Drawer 宽度 `100vw`，`.schedule-body-wrapper` flex 布局，左侧 `.meeting-main` 固定 360px，右侧 `.find-time-panel` flex: 1
- **非编辑模式**（view / update 无权限）：Drawer 保持 360px，不显示 FindTime
- **时段选择**：点击日历空白区域（`onSelectSlot`）直接写入 `schedulerDataAtom` 的 date/time，无需 Confirm 按钮
- **FreeTimeSelector 蓝色覆盖条**保留，跟随选中时段位置

### 日期导航

FindTime 的日期导航使用 **Popover + antd Calendar**：

- **触发方式**：点击日期文字 + `IconChevronDown` 下拉箭头
- **弹出内容**：antd `Calendar` (fullscreen=false)，通过 Popover 显示
- **月份切换**：Calendar headerRender 中使用 `IconChevronRight1`（描边版，16x16）
- **日期禁用**：`disabledDate` 禁止选择过去的日期
- **选择行为**：点击日期 → 更新 queryDate → 关闭 Popover
- **样式**：`.view-schedule-calendar-popover`（使用 CSS 变量适配暗色主题）

### 关键数据流

```
用户点击 FindTime 日历空白区域
  → MyCalendar onSelectSlot 触发
  → 同时更新本地 wantDate（FreeTimeSelector 蓝色覆盖条位置）
  → 同时调用 onConfirm → setData({ date, time, start, end })
  → schedulerDataAtom 更新 → 左侧表单 TimePicker 自动反映新时间
```

## 7. 数据刷新机制

### 与 difft-desktop 的对比

| difft-desktop | calendarWeb |
|--------------|-------------|
| `refresh-calendar-dashboard` CustomEvent | `workspaceNotifyHandler` JSBridge 回调 |
| 多种 CustomEvent（sleep/force-update 等） | **仅一种**：`workspaceNotifyHandler` |
| `invalidateQueries` + `refetchQueries` | 仅 `invalidateQueries` |
| localStorage 缓存 + lz-string 压缩 | **无 localStorage 缓存**（React Query 内存缓存） |

### 刷新流程

```
原生 App 推送通知
  → WKWebViewJavascriptBridge.register('workspaceNotifyHandler')
  → 检查 appData.calendarVersion > 本地 calendarVersionAtom
  → queryClient.invalidateQueries({ queryKey: ['myEvents'] })
  → React Query 重新请求 → UI 更新
```

## 8. 路由与视图

| 路由 | 组件 | 视图 |
|------|------|------|
| `/dashboard` | `CalendarPage` | 周视图（默认） |
| `/dashboard?view=day` | `CalendarPage` | 日视图 |
| `/list` | `ListPage` | 列表视图（react-virtualized） |
| `/` | 重定向到 `/dashboard` | — |

Layout 组件包含固定的**左侧面板**（侧边栏日历 + 创建按钮 + 日历选择列表）和**右侧主面板**（通过 `<Outlet />` 渲染路由子组件）。

## 9. 初始化流程

```
main.tsx
├── initApp()                          — init.ts
│   ├── initTheme()                    — JSBridge getTheme → themeAtom → body class
│   ├── initGroups()                   — JSBridge getGroups → groupListAtom
│   └── initAppName()                  — JSBridge getClientName → appNameAtom
├── ReactDOM.render()
│   ├── QueryClientProvider
│   └── Router
│       └── Provider (Jotai store)
│           └── Layout
│               ├── initListener()     — 注册 workspaceNotifyHandler
│               ├── 侧边栏日历
│               ├── <Outlet /> (路由内容)
│               ├── ScheduleMeetingDialog
│               └── CalendarSettingDialog
```

## 10. 关键文件索引

### 页面组件

| 文件 | 职责 |
|------|------|
| `layout/index.tsx` | 主布局：侧边栏日历 + 主面板 + ScheduleMeetingDialog |
| `pages/calendar/index.tsx` | 日历主视图（周/日，使用 MyCalendar） |
| `pages/calendar/components/HeaderAvatar.tsx` | 日历头部头像 |
| `pages/calendar/components/SelectList.tsx` | 日历勾选列表 |
| `pages/list/index.tsx` | 列表视图（react-virtualized） |
| `pages/list/components/ListItem.tsx` | 列表项 |
| `pages/calendarSetting/index.tsx` | 日历设置弹窗 |

### 预约会议弹窗

| 文件 | 职责 |
|------|------|
| `pages/scheduler/index.tsx` | ScheduleMeetingDialog 组合入口 |
| `pages/scheduler/ScheduleProvider.tsx` | Provider + Drawer 容器 |
| `pages/scheduler/Header.tsx` | 弹窗头部 |
| `pages/scheduler/Title.tsx` | 主题输入 |
| `pages/scheduler/TimePicker.tsx` | 日期时间选择 |
| `pages/scheduler/Duration.tsx` | 时长 |
| `pages/scheduler/UserList.tsx` | 参会人 Drawer |
| `pages/scheduler/UserListButton.tsx` | 参会人数量按钮 |
| `pages/scheduler/FindTime.tsx` | Find a Time 内嵌面板（与表单并排，由 ScheduleProvider 渲染） |
| `pages/scheduler/FindTimeButton.tsx` | 已废弃（返回 null），保留文件以备后用 |
| `pages/scheduler/Host.tsx` | 主持人 |
| `pages/scheduler/Guest.tsx` | 嘉宾 |
| `pages/scheduler/Repeat.tsx` | 重复规则 |
| `pages/scheduler/FileManager.tsx` | 附件 |
| `pages/scheduler/Desc.tsx` | 描述 |
| `pages/scheduler/Permit.tsx` | 权限 |
| `pages/scheduler/More.tsx` | 更多选项 |
| `pages/scheduler/GoogleMeetButton.tsx` | Google Meet |
| `pages/scheduler/Bottom.tsx` | 底部按钮 |
| `pages/scheduler/components/findTime/ViewSchedule.tsx` | Find a Time 日历视图 |
| `pages/scheduler/components/findTime/TimeGutterHeader.tsx` | 时间轴头部 |
| `pages/scheduler/components/findTime/FreeTimeSelector.tsx` | 空闲时段选择 |
| `pages/scheduler/components/findTime/utils.tsx` | Find a Time 工具函数 |

### 状态与数据

| 文件 | 职责 |
|------|------|
| `atoms/index.ts` | 核心 atoms（date, timeZone, userInfo 等） |
| `atoms/detail.ts` | DetailData 类型 + schedulerDataAtom |
| `atoms/query.ts` | atomWithQuery 定义 + queryClient |
| `atoms/store.ts` | Jotai store 实例 |
| `atoms/userInfo.ts` | 用户信息缓存管理 |

### Hooks

| 文件 | 职责 |
|------|------|
| `hooks/useDetailData.ts` | schedulerDataAtom 的读写封装 |
| `hooks/useCreateSchedule.ts` | 创建预约的逻辑 |
| `hooks/useQueryDetail.ts` | 查询事件详情 |
| `hooks/useSetDate.ts` | 日期设置（同步 dateAtom + showDateAtom） |
| `hooks/useFormatCalendarList.tsx` | 按勾选过滤事件 |
| `hooks/useFormatMeetingList.ts` | 列表视图格式化 |
| `hooks/useTimeZoneDayjs.ts` | 时区 dayjs 工具 |
| `hooks/useCurrentTimeZone.ts` | 当前时区 |
| `hooks/useI18n.ts` | 国际化 |
| `hooks/useAntdLocale.ts` | antd 国际化 |
| `hooks/useGetAtom.ts` | 从 store 同步读取 atom 值 |
| `hooks/useEditAttendeeDialog.tsx` | 编辑参会人弹窗 |
| `hooks/useRadioModal.tsx` | 单选弹窗 |
| `hooks/useForwardModal.ts` | 转发弹窗 |
| `hooks/useLiveGuestInviteDialog.tsx` | 直播嘉宾邀请 |

### 样式

| 文件 | 职责 |
|------|------|
| `styles/index.scss` | 入口 |
| `styles/variables.scss` | CSS 变量 |
| `styles/colors.scss` | 颜色定义 |
| `styles/schedule.scss` | 日历主界面样式 |
| `styles/scheduler.scss` | 预约会议弹窗 + Find a Time 样式（含 `.view-schedule-calendar-popover`） |
| `styles/shared.scss` | 通用组件样式 |
| `styles/mixin.scss` | SCSS mixins |

## 11. 注意事项

### Jotai 特有模式

- `schedulerDataAtom` 支持存储 **Promise**（`atom<DetailData | Promise<DetailData>>`），使用 `loadable()` 包装后可同步获取 loading/error 状态
- `useSetDetailData` 区分同步写入和异步写入：Promise 直接 set，对象/函数则先 await 读取 prevData 再 merge
- `atomWithQuery` 的 `enabled` 依赖 `bridgeSupportedAtom` 和 `userIdAtom`，在 bridge 未就绪时不会发请求
- `atomWithStorage` 用于持久化（`myChecked`, `otherChecked`, `calendarVersion`, `bossCalendar`）

### 图标使用

- 图标定义在 `shared/IconsNew/index.tsx`
- `IconChevronRight` 是**填充**版（粗，16x16），`IconChevronRight1` 是**描边**版（细，tabler 风格，24x24）
- Find a Time 日历 Popover 的月份切换使用 `IconChevronRight`（填充版）
- 侧边栏日历的月份切换也使用 `IconChevronRight`（layout/index.tsx）
- `IconChevronDown` 用于 Find a Time 的日期触发器下拉箭头（16x16，展开时旋转 180°）

### 与 difft-desktop 共享的逻辑

- `formatDashboardResponse` — 日历数据格式化（`util/index.ts`）
- `formarDetailResponse` — 事件详情格式化
- `uid2cid` / `cid2uid` — ID 转换
- `estimateTime` — 时间取整
- `getQueryKey` — React Query key 生成
- `@difftim/scheduler-component` — 日历 UI 组件

### 已同步的 difft-desktop UI 修改

- **Find a Time 日期选择**（2026-03-02）：左右箭头 → Popover + antd Calendar，与 difft-desktop commit `769604a60` 对齐

### FindTime 外置重构（2026-03-03）

FindTime 从 `childModalType` 嵌套 Drawer 改为与表单并排的全屏布局：

1. **`ScheduleProvider.tsx`**：新增 `useShowFindTime` hook，Drawer 宽度动态切换（`100vw` / `360`），body 改为 `.schedule-body-wrapper` flex 双栏布局，直接渲染 `<FindTime />`
2. **`FindTime.tsx`**：移除 antd Drawer 包裹，改为 `<div className="find-time-panel">`；移除 `childModalType` 依赖和 Back 按钮
3. **`ViewSchedule.tsx`**：移除 Confirm 按钮，`onSelectSlot` 直接调用 `onConfirm` 写回 date/time
4. **`atoms/detail.ts`**：`childModalType` 类型移除 `'findTime'`，只保留 `'attendee' | 'guest' | ''`
5. **`scheduler/index.tsx`**：移除 `<FindTimeButton />` 和 `<FindTime />` 引用
6. **`scheduler.scss`**：新增 `.with-find-time` 全屏模式样式（`box-shadow: none` 消除顶部阴影线）、`.schedule-body-wrapper` 双栏布局、`.meeting-main` 内 `.save-btn-wrapper` 用 `position: absolute` 固定底部（配合 `padding-bottom: 88px`）、`.find-time-panel` 面板样式；原 `.find-time-drawer` 样式替换为 `.find-time-panel`
7. **左侧表单头部**（`with-find-time` 模式）：`.meeting-main-close` 关闭按钮 `position: absolute; top: 0`（24x24，`z-index: 10`，带背景色），`.meeting-main` 加 `padding-top: 40px` 留出空间；Title `.item-topic` 改为 `display: block` 去掉 grid 布局，`.item-title` 隐藏，input 24px/32px 字号，`.ant-input-affix-wrapper` 底部下划线（`padding: 16px 0 4px`），下方 `margin-bottom: 24px`

### Find a Time 时区显示修复（2026-03-04）

- **`ViewSchedule.tsx`**：`onRenderHeader` 中参会人时区偏移量获取逻辑从 `getOffset(item)` 改为 `getUidTimezone(item.id) ?? getOffset(item)`，优先使用 `getUidTimezone` 从 UID 时区映射表中获取精确时区，fallback 到 `getOffset` 计算值，修复部分参会人时区显示不准确的问题。UID 时区映射表（`uidTimezoneMap`）是 `utils.tsx` 中的模块级 `Map<string, number>`，在 `formateResponse` 处理 freebusy API 响应时，遍历每个 `userEvent` 并调用 `setUidTimezoneMap(uid, parsedTimeZone)` 写入，数据源自服务端返回的 `userEvent.timeZone` 字段

### calendarWeb 差异化改造（2026-03-02）

以下改动是 calendarWeb 独有的，**不同步回 difft-desktop**：

1. **左侧面板背景色**：`var(--dsw-color-bg-1)` → `var(--dsw-color-bg-2)`
2. **日历头部布局**：日期文字左对齐，两个箭头右对齐（gap 8px）；图标从 `IconChevronRight`（填充版 20x20）换为 `IconChevronRight1`（描边版 16x16），hover 容器 24x24
3. **FindTime Popover Calendar 箭头 hover**：同步侧边栏的背景 hover 效果（`background-color: var(--dsw-color-bg-3)`，24x24 容器 + padding 4px + border-radius 4px）
4. **日历与 MyCalendars 之间的 divider**：新增 `.calendar-divider`（1px solid `var(--dsw-color-line-1)`）
5. **MyCalendars 固定展开**：`SelectList` 新增 `collapsible` prop（默认 `true`），MyCalendars 传 `collapsible={false}` 隐藏折叠按钮
6. **OtherCalendars 空列表**：`list.length === 0` 时隐藏 chevron 图标，标题仍显示
7. **Meeting 按钮背景色**：`var(--dsw-color-bg-1)`（非 `bg-popup`），下拉菜单同理
8. **antd Calendar 背景透明**：`.ant-picker-panel`/`.ant-picker-date-panel`/`.ant-picker-body`/`.ant-picker-content` 全部 `background: transparent !important`，确保继承面板 bg2
