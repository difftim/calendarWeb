# Calendar Web 项目报告

> 本报告以 `src/main.tsx` 为入口，按实际代码路径梳理项目结构、页面拆分，以及核心数据获取逻辑。

## 1. 目录结构（按模块职责）

```
src/
├── api/                # API 请求封装与业务接口定义
│   ├── index.ts        # 业务 API（日历、会议、详情等）
│   └── request.ts      # ky 请求封装、鉴权、响应处理
├── atoms/              # Jotai 原子状态（全局状态与异步查询）
│   ├── index.ts        # 用户、时区、主题、日历选中等基础状态
│   ├── detail.ts       # Schedule Detail 结构与编辑器状态
│   ├── query.ts        # jotai-tanstack-query 查询 atom
│   ├── store.ts        # 自定义 Jotai store（Provider 外部可写入）
│   └── userInfo.ts     # 用户信息缓存/请求
├── bridge/             # 与宿主环境的 JSBridge 接口封装
├── constants/          # 常量（枚举、默认值、配置）
├── hooks/              # 业务逻辑 hooks（日期、时区、详情、表单等）
├── layout/             # 统一布局壳（左侧日历+右侧内容）
├── pages/              # 页面层（calendar/list/scheduler）
│   ├── calendar/       # 周/日视图日历页面
│   ├── list/           # 列表视图页面
│   └── scheduler/      # 会议编辑器（Drawer 中的内容区）
├── shared/             # 通用 UI 组件（Button/Select/Radio/ConfigProvider 等）
├── styles/             # SCSS 变量与模块样式
├── translate/          # 多语言资源
├── util/               # 工具函数（格式化、转换、业务辅助）
├── utils/              # 适配与全局工具（如 globalAdapter）
├── Router.tsx          # 路由入口（Provider + Routes）
├── main.tsx            # 应用入口（渲染、QueryClient、主题预置）
└── vite-env.d.ts       # TS 环境声明
```

**入口链路**

- `main.tsx`：创建 `QueryClient`，初始化主题 `themeAtom`，渲染 `<Router />`。
- `Router.tsx`：包裹 `<Provider store={store}>`，并挂载所有路由。

## 2. 页面结构与拆分（Layout / Pages）

### 2.1 路由与 Layout 关系

路由定义在 `src/Router.tsx`：

- 根路由 `/` → `Layout`
- 子路由：
  - `/calendar` → `pages/calendar`
  - `/list` → `pages/list`
  - 其他路径 → fallback 到 `/calendar`

`Layout`（`src/layout/index.tsx`）是**统一外壳**：

- 左侧固定区域（常驻）：
  - 顶部工具区（新建 Meeting/Event/Live 等）
  - 迷你日历（日历组件）
  - My Calendars / Other Calendars 选择列表
- 右侧内容区域：通过 `<Outlet />` 渲染 page 级内容
- `ScheduleMeetingDialog`（Scheduler Drawer）作为全局弹层挂在 Layout 内部

### 2.2 Page 拆分说明

#### `pages/calendar`
- 渲染周/日视图大日历组件
- 读取 `calendarQueryAtom` 提供的事件与成员列表
- 使用 `useFormatCalendarList` 进行事件格式化并生成 `members`
- 事件点击触发 `setDetailData(getDetailData(...))` 打开 scheduler

#### `pages/list`
- 列表式日历展示（逻辑类似 calendar，但布局为 list）

#### `pages/scheduler`
- Drawer 中的会议编辑器/详情面板
- `ScheduleProvider` 控制 Drawer 的打开、数据加载与关闭
- UI 拆分为 `Title/TimePicker/Duration/Guest/Host/Repeat/More/Permit/Bottom` 等多个子模块

---

## 3. 数据获取逻辑

### 3.1 Calendar 列表数据：`calendarQueryAtom`

**位置：** `src/atoms/query.ts`  
**类型：** `atomWithQuery`（jotai-tanstack-query）

**核心流程：**

1. **依赖触发**：
   - `dateAtom`（当前选中日期）
   - `userIdAtom`（当前用户）
   - `bridgeSupportedAtom`（bridge 是否可用）

2. **queryKey 生成**：
   - 使用选中日期计算当前周起止日期
   - `queryKey = ['myEvents', 'YYYY-MM-DD_YYYY-MM-DD']`

3. **请求**：
   - `getSchedulerDashboard({ start, end })`
   - 根据返回 `version` 决定是否需要更新

4. **数据格式化**：
   - `formatDashboardResponse(data, userId)`
   - 返回结构包含：`events`, `myUsers`, `otherUsers`

5. **同步副作用**：
   - 写入 `bossCalendarAtom`（代理日历信息）
   - 写入 `calendarVersionAtom`
   - 过滤 `myCalendarCheckedAtom` 和 `otherCalendarCheckedAtom`

6. **缓存策略**：
   - `keepPreviousData: true`
   - `staleTime: Infinity`
   - `cacheTime: Infinity`

**设计目的：**
- 让日历列表随日期变化自动刷新
- 在数据更新时保持 UI 稳定（避免闪烁）
- 统一格式化后传递给 Calendar/List 页面

---

### 3.2 Schedule Detail 数据逻辑

#### (1) 数据结构

- 结构定义在 `src/atoms/detail.ts`：`DetailData`
- 包含编辑器完整字段：
  - `mode`（create/view/update）
  - `topic`, `start`, `end`, `members`, `permissions` 等
  - `recurringRule`, `guests`, `host`, `group` 等

#### (2) 数据来源（查询）

- `useQueryDetail` (`src/hooks/useQueryDetail.ts`)：
  - 调用 `getMeetingScheduleDetail({ eventId, calendarId, source })`
  - 通过 `formarDetailResponse()` 标准化为 `DetailData`
  - 异常时 `toastError` 并抛出错误

#### (3) 数据存储（Atom）

- `schedulerDataAtom` 存储 `DetailData` or Promise
- `showPannelAtom` 控制 Drawer 开关

#### (4) 更新入口（useSetDetailData）

`useSetDetailData` 支持三种写入方式：

- **Promise**（异步）
  - 传入 API Promise（如 `getDetailData()`）
  - Jotai 自动处理 loading

- **Partial<DetailData>**（同步局部更新）
  - 用于表单输入或局部字段修改

- **函数式更新**
  - `(prev) => Partial<DetailData>`
  - 避免闭包问题，适合依赖旧值的改动

#### (5) Drawer 生命周期

- `ScheduleProvider`：
  - 通过 `useLoadableDetailData()` 获取 `schedulerDataAtom` 状态
  - `loading` 状态下展示加载 UI
  - Drawer 关闭时重置为 `INITIAL_DETAIL_DATA`

**整体流程：**

```
日历点击 → setShowPannel(true)
         → setDetailData(getDetailData(...))
         → useQueryDetail 获取数据
         → formarDetailResponse 标准化
         → schedulerDataAtom 更新
         → ScheduleProvider 渲染 Drawer 内容
```

---

## 4. 备注

- `main.tsx` 初始化主题：直接写 `themeAtom`，并同步 body class (`light-theme` / `dark-theme`)。
- 该项目大量依赖 Jotai 的原子状态来驱动 UI，避免 Redux。

---

如需补充：
- 组件依赖树
- 业务事件流（创建/更新/删除会议）
- 权限逻辑或 API 字段说明

请告诉我你希望追加的部分。
