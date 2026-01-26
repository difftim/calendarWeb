# Calendar Web

Standalone version of calendar migrated from difft-desktop

## 项目说明

这是一个从 `difft-desktop` 的 `IndependentPageEntry` 组件移植而来的独立日历 Web 应用。

## 技术栈

- **构建工具**: Vite 6.3.6
- **框架**: React 17.0.2
- **UI 库**: Ant Design 5.22.7
- **状态管理**: @tanstack/react-query 4.36.1
- **样式**: SCSS
- **TypeScript**: 5.6.3

## 主要依赖

- `@difftim/scheduler-component`: 日历调度组件
- `@tanstack/react-query`: 数据获取和缓存
- `antd`: Ant Design UI 组件库
- `dayjs`: 日期时间处理
- `lodash`: 工具函数库
- `lz-string`: 字符串压缩

## 开发

### 安装依赖

```bash
npm install
# 或
yarn install
```

**首次安装或依赖更新后**，建议清理旧的 node_modules：

```bash
rm -rf node_modules package-lock.json
npm install
```

### 启动开发服务器

```bash
npm run dev
# 或
yarn dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
# 或
yarn build
```

### 预览生产构建

```bash
npm run preview
# 或
yarn preview
```

### 类型检查

```bash
npm run type-check
# 或
yarn type-check
```

## 项目目录结构

```text
src/
├── api/              # 接口层：定义业务 API 与请求封装
├── atoms/            # 状态层：基于 Jotai 的全局状态定义 (用户、时区、主题、编辑器等)
├── constants/        # 常量定义
├── hooks/            # 逻辑封装：从 UI 中抽离的业务逻辑 (数据处理、日期操作等)
├── layout/           # 布局层：页面的整体框架结构
├── pages/            # 页面层：具体的业务模块页面
│   ├── calendar/     # 日历主视图 (周视图/日视图)
│   ├── calendarSetting/ # 日历设置 (管理日历、时区、权限代理等)
│   ├── list/         # 列表视图
│   └── scheduler/    # 日程编辑器 (会议/事件/直播创建与编辑)
├── schema/           # Schema 跳转：通过 URL Schema 与原生客户端交互
├── shared/           # 通用组件：Button、Input、Select、Modal 等 UI 组件
├── styles/           # 样式目录：SCSS 变量、Mixin 与全局样式
├── translate/        # 国际化：多语言翻译文件
├── types/            # TypeScript 类型定义
├── util/             # 工具类：纯函数工具集
└── utils/            # 工具函数：国际化、全局适配器等
```

## 页面与布局架构

项目采用 **侧边栏 + 主内容区** 的布局模式，利用 `react-router-dom` 的 `Outlet` 实现动态内容切换。

- **Layout (`src/layout/index.tsx`)**:
  - **左侧面板**: 常驻展示。包含新建按钮（Meeting、Event、Instant Meet、Live Stream、My Room、Web Call）、迷你日历控件、日历分类选择列表。
  - **右侧面板 (`Outlet`)**: 根据路由映射展示 `pages/calendar` 或 `pages/list`。
  - **视图切换 (`ViewChangePanel`)**: 浮动在右下角的视图切换器（List/Week/Day）及设置按钮。
  - **编辑器弹窗**: `ScheduleMeetingDialog` 挂载在 Layout 顶层，由全局状态 `showPannelAtom` 控制。
  - **设置弹窗**: `CalendarSettingDialog` 挂载在 Layout 顶层，由全局状态 `showSettingAtom` 控制。

## 日历设置页面 (Calendar Setting)

`CalendarSettingDialog` 是一个抽屉式设置面板，提供以下功能：

### 功能模块

| 功能 | 说明 |
|------|------|
| **My Calendars** | 查看和管理我的日历列表，支持取消关联 |
| **Other Calendars** | 管理订阅的其他用户日历，支持订阅、取消订阅、重命名 |
| **Grant Management Permissions** | 日历代理权限管理，可授权他人管理自己的日历（最多 10 人） |
| **Time Zone** | 时区设置，支持自动跟随系统时区或手动选择 |
| **Import ICS** | 导入 ICS 格式的日历文件 |

### 组件结构

```text
pages/calendarSetting/
├── index.tsx           # 主组件 CalendarSettingDialog
├── utils.ts            # 工具函数与类型定义
└── components/
    ├── AddOtherForm.tsx     # 订阅其他日历表单
    ├── AddProxyForm.tsx     # 添加代理权限表单
    ├── CalendarUserItem.tsx # 日历用户列表项
    ├── EditUserForm.tsx     # 编辑用户信息表单
    ├── IcsUploader.tsx      # ICS 文件上传器
    └── TimeZoneList.tsx     # 时区选择列表
```

## Schema 跳转模块

`src/schema/index.ts` 提供了通过 URL Schema 与原生客户端交互的能力，用于在 WebView 中触发客户端的原生功能。

### Schema 协议识别

根据 User-Agent 自动识别客户端类型，返回对应的 Schema 前缀：

| UA 标识 | Schema |
|---------|--------|
| `cc/` | `ccm://` |
| `wea/` | `wea://` |
| `cctest/` | `cctm://` |
| `weatest/` | `weatest://` |
| `bycew/` | `wea://` |
| `bycec/` | `ccm://` |
| 默认 | `wea://` |

### 跳转方法

| 方法 | 说明 | 示例 URL |
|------|------|----------|
| `createInstantMeeting()` | 创建即时会议 | `wea://calendar-app?action=instant-meeting` |
| `createRoom(info)` | 进入我的个人会议室 | `wea://meeting?v=1&meetingname=...&channelname=...` |
| `createWebCall()` | 创建 Web Call | `wea://calendar-app?action=new-web-call` |
| `goToGoogle(members, topic?, channelName?)` | 跳转到 Google Meet | `wea://calendar-app?action=go-to-google&members=...` |
| `joinMeeting(info)` | 加入会议/直播 | `wea://meeting?channelName=...&meetingName=...` |
| `shareLiveStream(content, selected)` | 分享直播到指定会话 | `wea://calendar-app?action=share-live&...` |

### 使用示例

```typescript
import { createInstantMeeting, joinMeeting } from '@/schema';

// 创建即时会议
createInstantMeeting();

// 加入会议
joinMeeting({
  channelName: 'meeting-channel-123',
  meetingName: 'Team Standup',
  isLiveStream: false,
  eid: 'event-id-abc',
});
```

## 数据结构

### 1. 日历列表数据 (`calendarQueryAtom`)

通过 `jotai-tanstack-query` 获取的周数据，核心结构包含：

- `events`: 经过格式化的事件数组，包含 `eid`, `start`, `end`, `topic`, `source` 等。
- `myUsers` / `otherUsers`: 用于侧边栏日历勾选列表的数据，包含用户信息及颜色配置。

### 2. 详情/编辑器数据 (`DetailData`)

存储在 `schedulerDataAtom` 中，包含创建、查看或编辑一个会议所需的所有信息。

- `mode`: `'create' | 'view' | 'update'` 决定编辑器行为。
- `members`: 参与者详情，包括权限、角色及响应状态。
- `permissions`: 按钮级权限配置（由后端返回，决定用户能否编辑或删除）。

## 同步与异步处理机制

项目深度集成了 **Jotai**，通过不同的 Atom 类型和 Hook 实现了高效的同步与异步协同：

### 1. 异步数据流 (`jotai-tanstack-query`)

- **自动触发**: `calendarQueryAtom` 依赖于 `dateAtom` (当前选中日期) 和 `userIdAtom`。当用户在左侧迷你日历切换日期或周时，这些 Atom 发生变化，Jotai 会自动重新触发异步请求获取该周的日历数据。
- **持久化与缓存**: 利用 React Query 的特性，数据在获取后会进行缓存。`keepPreviousData: true` 确保在加载新数据时，旧数据依然可见，避免界面闪烁。

### 2. 异步状态同步化 (`loadable`)

- **非阻塞式获取**: 使用 `jotai/utils` 的 `loadable` 包装异步 Atom。
- **优势**: 传统的异步 Atom 在读取时会触发 React Suspense，导致组件树挂起。`loadable` 将异步状态转化为一个同步对象（包含 `state`, `data`, `error`），允许我们在组件中通过 `state === 'loading'` 同步地判断加载状态，提供更好的用户体验。

### 3. 数据更新机制 (`useSetDetailData`)

- **多态 Setter**: 该 Hook 返回一个高度封装的 setter 函数。
- **同步更新**: 传入 `Partial<DetailData>` 对象时，立即同步更新状态中的部分字段（如修改标题、勾选选项）。
- **异步更新**: 传入一个 `Promise` 时（例如调用 `getDetailData` 接口），setter 会自动识别并将状态设为 `loading: true`，待 Promise resolve 后再同步结果并重置 loading。
- **原子化更新**: 通过传入函数 `(prev) => Partial<DetailData>`，利用前一次的状态进行计算更新，避免闭包导致的旧数据覆盖问题。

### 4. 外部 Store 访问 (`atoms/store.ts`)

- **跨组件/React 外部操作**: 定义了全局 `store` 实例。在 `main.tsx` 启动时或接口拦截器中，可以直接使用 `store.set(atom, value)` 操作状态，而无需处于 React 组件生命周期内。这在处理如"启动时预加载主题"等逻辑时非常有用。
