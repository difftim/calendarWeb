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

**注意**: 项目已精简依赖，仅保留核心必需的 9 个依赖包。详见 [DEPENDENCIES_CLEANUP.md](./DEPENDENCIES_CLEANUP.md)

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
├── api/          # 接口层：定义业务 API 与 axios 拦截器
├── atoms/        # 状态层：基于 Jotai 的全局状态定义 (用户、时区、主题、编辑器等)
├── bridge/       # 桥接层：负责与跨端宿主环境的 JSBridge 通信
├── components/   # 组件层：包含通用 UI (shared) 与业务大组件
├── hooks/        # 逻辑封装：从 UI 中抽离的业务逻辑 (数据处理、日期操作等)
├── layout/       # 布局层：页面的整体框架结构
├── pages/        # 页面层：具体的业务模块页面 (日历主视图、列表视图、编辑器)
├── provider/     # 提供者：国际化 (I18n) 等全局 Context Provider
├── shims/        # 适配层：环境差异适配与全局变量 Mock
├── styles/       # 样式目录：SCSS 变量、Mixin 与全局样式
└── util/         # 工具类：纯函数工具集
```

## 页面与布局架构

项目采用 **侧边栏 + 主内容区** 的布局模式，利用 `react-router-dom` 的 `Outlet` 实现动态内容切换。

- **Layout (`src/layout/index.tsx`)**:
  - **左侧面板**: 常驻展示。包含新建按钮、迷你日历控件、日历分类选择列表。
  - **右侧面板 (`Outlet`)**: 根据路由映射展示 `pages/calendar` 或 `pages/list`。
  - **视图切换 (`ViewChangePanel`)**: 浮动在右下角的视图切换器（List/Week/Day）。
  - **编辑器弹窗**: `ScheduleMeetingDialog` 挂载在 Layout 顶层，由全局状态 `showPannelAtom` 控制。

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

- **跨组件/React 外部操作**: 定义了全局 `store` 实例。在 `main.tsx` 启动时或接口拦截器中，可以直接使用 `store.set(atom, value)` 操作状态，而无需处于 React 组件生命周期内。这在处理如“启动时预加载主题”等逻辑时非常有用。
