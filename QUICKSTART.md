# 快速开始指南

## 安装和运行

1. **安装依赖**
   ```bash
   cd /Users/primo/Documents/calendarWeb
   npm install
   # 或使用 yarn
   yarn install
   ```

2. **启动开发服务器**
   ```bash
   npm run dev
   # 或
   yarn dev
   ```

   浏览器会自动打开 http://localhost:3000

3. **构建生产版本**
   ```bash
   npm run build
   # 或
   yarn build
   ```

   构建产物在 `dist` 目录

## 项目结构概览

```
calendarWeb/
├── src/
│   ├── components/
│   │   ├── IndependentPageEntry/    # 根组件（已移植）
│   │   ├── CalendarList/            # 日历列表（简化版）
│   │   └── shared/
│   │       └── ConfigProvider/      # 主题配置（已移植）
│   ├── styles/                      # 样式文件
│   ├── types/                       # TypeScript 类型
│   ├── utils/                       # 工具函数
│   └── main.tsx                     # 入口文件
├── index.html
├── vite.config.ts
└── package.json
```

## 已移植的核心功能

✅ **IndependentPageEntry 组件**
- 作为根组件
- 集成 React Query
- 主题配置
- 会议数据管理

✅ **ConfigProvider**
- 亮色/暗色主题支持
- Ant Design 主题定制
- 响应式主题切换

✅ **工具函数**
- dayjs 初始化和配置
- 循环调用工具 (loopCall)
- 国际化支持 (i18n)
- 全局适配器 (mock 实现)

## 简化说明

由于原始的 `CalendarList` 组件有 **1500+ 行代码**，包含：
- 复杂的日历视图逻辑
- 会议调度功能
- Electron IPC 通信
- 多种业务集成

当前版本提供了一个**简化框架**，展示了：
- 基本的 UI 布局
- 视图切换按钮
- 左侧面板结构
- 日历选择器

## 进一步开发

如需完整的 CalendarList 功能，参考原始文件：
```
/Users/primo/Documents/difft-desktop/ts/components/CalendarTab/CalendarList.tsx
```

需要移植的其他组件：
- ListView
- SelectList
- CalendarSettingDialog
- ScheduleMeetingDialog
- 各种 hooks (useFormatCalendarList, useQueryEvents, 等)

## 依赖说明

核心依赖已在 package.json 中配置：
- React 17.0.2
- Ant Design 5.22.7
- @tanstack/react-query 4.36.1
- @difftim/scheduler-component 0.1.8
- dayjs 1.11.13
- 等其他依赖...

## 注意事项

⚠️ 某些 Electron 特定功能已被 mock：
- IPC 通信
- 本地文件系统
- 窗口管理

这些在 `src/utils/globalAdapter.ts` 中有占位实现。

## 开发建议

1. 先运行项目查看基础界面
2. 根据需求逐步添加完整的 CalendarList 功能
3. 实现与后端 API 的真实集成
4. 添加真实的会议数据管理逻辑

## 问题排查

如遇到依赖安装问题：
```bash
rm -rf node_modules package-lock.json
npm install
```

TypeScript 类型错误：
```bash
npm run type-check
```

## 主题切换

在浏览器控制台中测试主题切换：
```javascript
// 切换到暗色主题
document.body.classList.remove('light-theme');
document.body.classList.add('dark-theme');
window.dispatchEvent(new CustomEvent('themeSettingChanged'));

// 切换到亮色主题
document.body.classList.remove('dark-theme');
document.body.classList.add('light-theme');
window.dispatchEvent(new CustomEvent('themeSettingChanged'));
```

