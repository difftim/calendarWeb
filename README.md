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

## 项目结构

```
calendarWeb/
├── src/
│   ├── components/
│   │   ├── IndependentPageEntry/  # 根组件
│   │   └── shared/
│   │       └── ConfigProvider/    # 主题配置提供者
│   ├── styles/                    # 样式文件
│   │   ├── variables.scss         # SCSS 变量
│   │   └── index.scss             # 全局样式
│   ├── types/                     # TypeScript 类型定义
│   │   └── Util.ts
│   ├── utils/                     # 工具函数
│   │   ├── exported_variables.ts  # 主题变量
│   │   ├── globalAdapter.ts       # 全局适配器
│   │   ├── i18n.ts                # 国际化
│   │   ├── initDayjs.ts           # Dayjs 初始化
│   │   └── loopCall.ts            # 循环调用工具
│   └── main.tsx                   # 应用入口
├── index.html                     # HTML 模板
├── vite.config.ts                 # Vite 配置
├── tsconfig.json                  # TypeScript 配置
└── package.json                   # 项目配置

```

## 特性

- ✅ 基于 Vite 的快速开发环境
- ✅ TypeScript 支持
- ✅ 亮色/暗色主题切换
- ✅ Ant Design 组件库集成
- ✅ SCSS 样式预处理
- ✅ React Query 数据管理
- ✅ 国际化支持
- ✅ **精简依赖**：仅 9 个核心依赖，快速安装

## 注意事项

由于这是从 Electron 桌面应用移植的独立 Web 版本，某些依赖于 Electron 的功能已被模拟或移除：

- IPC 通信相关功能
- 本地文件系统访问
- Electron 特定的 API

这些功能在 `src/utils/globalAdapter.ts` 中提供了 mock 实现。

## 后续开发

如果需要完整的 CalendarList 功能，需要进一步移植：

1. CalendarList 组件的完整实现
2. ListView 和相关子组件
3. 会议调度相关的业务逻辑
4. 与后端 API 的集成

## License

GPL-3.0
