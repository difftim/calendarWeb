# CLAUDE.md — AI Assistant Guide for calendarWeb

This document describes the codebase structure, development conventions, and workflows for AI assistants working on this project.

---

## Project Overview

`calendarWeb` is a standalone React web application for calendar and meeting management, migrated from `difft-desktop`. It runs as a WebView inside a native mobile/desktop client and communicates with the host app via a JavaScript bridge (`@difftim/jsbridge-utils`).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Build | Vite 6.3.6 |
| Framework | React 17.0.2 (legacy `ReactDOM.render`, not `createRoot`) |
| UI Library | Ant Design 5.22.7 |
| State Management | Jotai 2.7.0 + jotai-tanstack-query 0.11.0 |
| Data Fetching | @tanstack/react-query 4.36.1 |
| HTTP Client | ky 1.x |
| Routing | react-router-dom 6.x (HashRouter) |
| Date/Time | dayjs 1.11.x (with timezone plugin) |
| Styling | SCSS (with global variable injection) |
| Language | TypeScript 5.6.3 (strict mode) |
| Package Manager | yarn (use yarn, not npm) |

---

## Directory Structure

```
src/
├── api/              # HTTP API functions (ky-based, all calendar endpoints)
│   ├── index.ts      # All API call definitions
│   └── request.ts    # ky instance with auth token interceptor
├── atoms/            # Jotai global state
│   ├── index.ts      # Core atoms: userInfo, date, timeZone, theme, locale
│   ├── detail.ts     # DetailData type, schedulerDataAtom, showPannelAtom, showSettingAtom
│   ├── query.ts      # atomWithQuery: calendarQueryAtom, queryScheduleConfigAtom + QueryClient
│   ├── store.ts      # Global Jotai store instance (used outside React)
│   └── userInfo.ts   # User info fetching logic
├── constants/        # App-wide constants (duration/repeat options, CSS vars)
├── hooks/            # Custom React hooks
├── init.ts           # App startup: theme, groups, appName (via jsbridge)
├── layout/           # Root Layout component (sidebar + Outlet)
├── main.tsx          # Entry point
├── pages/
│   ├── calendar/     # Week/Day calendar view (@difftim/scheduler-component)
│   ├── calendarSetting/ # Settings drawer (calendars, timezone, proxy, ICS)
│   ├── list/         # List view of upcoming events
│   └── scheduler/    # Event create/edit/view dialog (ScheduleMeetingDialog)
├── Router.tsx        # HashRouter routes: / → /dashboard, /list, /dashboard
├── schema/           # URL schema helpers to trigger native client actions
├── shared/           # Reusable UI components (Button, Input, Select, Avatar, etc.)
├── styles/           # Global SCSS (variables, colors, mixins — auto-injected)
├── translate/        # i18n JSON files (en.json; keys used via useI18n hook)
├── types/            # Shared TypeScript type definitions
└── util/             # Pure utility functions
```

---

## Development Commands

```bash
yarn dev          # Start dev server at http://localhost:3000
yarn build        # Production build (sets VITE_WEB_MEETING_URL=https://webmeeting.i365724.com)
yarn build:test   # Test/staging build (sets VITE_WEB_MEETING_URL=https://webmeeting.bdb.im)
yarn preview      # Preview production build
yarn type-check   # Run tsc --noEmit (no build output)
yarn format       # Prettier format all src files
```

> **Node requirement**: >= 18.0.0

---

## Routing

Uses `HashRouter` — all URLs are hash-based (`/#/dashboard`, `/#/list`).

| Route | Component | Notes |
|-------|-----------|-------|
| `/` | redirect | → `/dashboard` |
| `/dashboard` | `CalendarPage` | Week view (default) |
| `/dashboard?view=day` | `CalendarPage` | Day view |
| `/list` | `ListPage` | List of upcoming events |
| `*` | `CalendarPage` | Fallback |

The `Layout` component wraps all routes with the sidebar (mini calendar + calendar list) and hosts two global dialogs controlled by atoms:
- `showPannelAtom` → `ScheduleMeetingDialog`
- `showSettingAtom` → `CalendarSettingDialog`

---

## State Management Patterns

### Atoms (`src/atoms/`)

- **`atoms/index.ts`** — Core app state: `userIdAtom`, `userInfoAtom`, `dateAtom`, `timeZoneAtom`, `themeAtom`, `localeAtom`, `myCalendarCheckedAtom`, `otherCalendarCheckedAtom`
- **`atoms/detail.ts`** — `schedulerDataAtom` (holds `DetailData` for the open scheduler), `showPannelAtom`, `showSettingAtom`
- **`atoms/query.ts`** — `calendarQueryAtom` (auto-fetches weekly events when `dateAtom` or `userIdAtom` changes), `queryScheduleConfigAtom`
- **`atoms/store.ts`** — Global `store` instance for accessing atoms outside React (e.g., in `init.ts` and API interceptors)

### Key Patterns

1. **`loadable` wrapping**: Async atoms are wrapped with `loadable` from `jotai/utils` to avoid React Suspense and allow synchronous state checks (`state === 'loading' | 'hasData' | 'hasError'`).

2. **`atomWithStorage`**: Persists checked calendar lists (`myChecked`, `otherChecked`) and `calendarVersion` to `localStorage`.

3. **`useSetDetailData` hook** (`src/hooks/useDetailData.ts`): The canonical way to update `schedulerDataAtom`. Accepts:
   - `Partial<DetailData>` — synchronous partial update
   - `Promise<DetailData>` — triggers async load (sets `loading: true` until resolved)
   - `(prev) => Partial<DetailData>` — functional update to avoid stale closure issues

4. **Outside-React store access**: Use `store.set(atom, value)` / `store.get(atom)` when operating outside component lifecycle (e.g., startup initialization, request interceptors).

---

## API Layer

**Base URL**: All requests go to `/scheduler` (proxied to `https://srv.bdb.im/` in dev).

**Authentication**: Every request automatically attaches a Bearer token via `getMiniProgramToken()` from the jsbridge. Set `VITE_TEST_TOKEN` env var to bypass token fetch in local dev.

**Response handling**: The `request` instance in `src/api/request.ts` unwraps the standard `{ status, data, reason }` envelope — callers receive `data` directly. Pass `headers: { 'x-full-response': '1' }` to receive the full envelope (used by create/update mutations to inspect `status`).

**All API functions**: See `src/api/index.ts` and `API_DOCUMENTATION.md` for the full list.

---

## SCSS / Styling Conventions

- **Global variable injection**: `vite.config.ts` auto-injects `@/styles/variables.scss` and `@/styles/colors.scss` into every SCSS file — do not manually import them.
- **CSS custom properties**: Colors and spacing use `var(--dsw-color-*)` and `var(--dsw-radius-*)` tokens for theme support.
- **Theme classes**: `document.body` carries either `light-theme` or `dark-theme` — toggle via `themeAtom`.
- **CSS class prefix**: Shared components use the `dsw-shared` prefix (see `constants/index.ts`).

---

## TypeScript Conventions

- **Strict mode** is on: `noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns` are enforced.
- **Path aliases**: Use `@/` for `src/` and `@shared/` for `src/shared/`.
- **`DetailData` type** (`src/atoms/detail.ts`): The central type for scheduler state — always update this type when adding new event fields.
- Avoid `any` — use `unknown` or proper types. Existing `any` usages are legacy.

---

## Native Bridge Integration

The app runs inside a WebView. Bridge communication uses `@difftim/jsbridge-utils`:

- `getUserInfo()` — get current user (id, name, email)
- `getMiniProgramToken()` — get auth token for API calls
- `getTheme()` — get host app theme (`light` | `dark`)
- `getGroups()` — get user's group list
- `isBridgeSupported()` — check if bridge is available (disables calendar queries if false)
- `callBridgeMethod('getClientName', {})` — get client app name

The bridge is initialized in `src/init.ts` via `initApp()` and `initListener()`.

**`initListener`** registers `workspaceNotifyHandler` on `window.WKWebViewJavascriptBridge` to receive push notifications from the host app (e.g., calendar version updates). Events are processed via a `p-queue` with concurrency 1.

---

## URL Schema (Native Navigation)

`src/schema/index.ts` generates deep-link URLs to trigger native client actions. The schema prefix (`wea://`, `ccm://`, etc.) is auto-detected from the User-Agent.

Key methods:
- `createInstantMeeting()` — open instant meeting flow
- `joinMeeting(info)` — join a meeting/livestream
- `createRoom(info)` — open personal meeting room
- `goToGoogle(members, topic?, channelName?)` — start a Google Meet
- `shareLiveStream(content, selected)` — share livestream to a conversation

---

## i18n

Translation keys live in `src/translate/en.json` in the format `{ "key": { "message": "value" } }`. Use the `useI18n` hook to access translations. Only English is currently shipped; the `localeAtom` supports `'en' | 'zh-cn'`.

---

## Key Shared Components (`src/shared/`)

| Component | Description |
|-----------|-------------|
| `Button` | Styled wrapper around Ant Design Button |
| `Input` / `SearchInput` | Text inputs |
| `Select` | Dropdown select |
| `InputSelect` | Combined input + select (see its README.md) |
| `TransferModal` | Contact/group picker modal (see its README.md) |
| `Avatar` | User avatar with fallback initials |
| `ConfigProvider` | Wraps `antd` ConfigProvider with theme/locale; exports `useTheme()` |
| `IconsNew` | SVG icon components |
| `Radio` | Radio group |
| `TimerPicker` | Time picker |

---

## Scheduler Page (`src/pages/scheduler/`)

The event create/edit/view panel (`ScheduleMeetingDialog`). Key sub-components:

- `ScheduleProvider.tsx` — context provider for the scheduler form state
- `TimePicker.tsx` / `Duration.tsx` — time/duration selectors
- `Guest.tsx` / `UserList.tsx` — attendee management
- `Repeat.tsx` — recurring event rules (RRULE)
- `FindTime.tsx` / `components/findTime/` — free/busy time finder
- `FileManager.tsx` — attachment management
- `GoogleMeetButton.tsx` — Google Meet integration

---

## Vite Proxy (Dev Only)

In development, the following paths are proxied to `https://srv.bdb.im/`:
- `/scheduler` → all calendar API calls
- `/voice` → Google Meet token API calls

---

## Build Notes

- Build output: `dist/` directory
- Source maps: disabled in production builds
- Build time: injected as `import.meta.env.VITE_BUILD_TIME` (Shanghai timezone)
- `esbuild-plugin-react-virtualized` is required as an esbuild optimization workaround for `react-virtualized`

---

## Environment Variables

| Variable | Used in | Description |
|----------|---------|-------------|
| `VITE_WEB_MEETING_URL` | build scripts | Web meeting base URL (set at build time) |
| `VITE_BUILD_TIME` | `main.tsx` | Injected build timestamp |
| `VITE_TEST_TOKEN` | `api/request.ts` | Skip jsbridge token fetch in local dev |
