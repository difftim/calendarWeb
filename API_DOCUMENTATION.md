# Calendar Web API 文档

本文档整理了项目中所有的 HTTP 请求接口。

---

## 请求基础配置

- **HTTP 客户端**: [ky](https://github.com/sindresorhus/ky)
- **Base URL**: `/`
- **认证方式**: 请求头 `Authorization` 携带 Token（通过 `@difftim/jsbridge-utils` 的 `getMiniProgramToken` 获取）

---

## 日历仪表盘

### 获取日程仪表盘

| 属性 | 值 |
|------|-----|
| **函数名** | `getSchedulerDashboard` |
| **方法** | `GET` |
| **路径** | `v1/calendar/dashboard` |

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `start` | `number` | 是 | 开始时间戳 |
| `end` | `number` | 是 | 结束时间戳 |
| `type` | `string` | 否 | 日历类型 |

**示例**:
```
GET v1/calendar/dashboard?start=1768290840&end=1768305240&t=1706428800000&type=difft
```

---

## 用户日历管理

### 添加用户日历

| 属性 | 值 |
|------|-----|
| **函数名** | `addUserCalendar` |
| **方法** | `POST` |
| **路径** | `v1/user/calendar` |

**请求体**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `cid` | `string` | 是 | 日历 ID |
| `type` | `string` | 是 | 日历类型 |
| `name` | `string` | 否 | 日历名称 |

---

### 删除用户日历

| 属性 | 值 |
|------|-----|
| **函数名** | `deleteUserCalendar` |
| **方法** | `DELETE` |
| **路径** | `v1/user/calendar` |

**请求体**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `cid` | `string` | 是 | 日历 ID |
| `type` | `string` | 是 | 日历类型 |

---

### 更新用户日历

| 属性 | 值 |
|------|-----|
| **函数名** | `updateUserCalendar` |
| **方法** | `PUT` |
| **路径** | `v1/user/calendar` |

**请求体**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `cid` | `string` | 是 | 日历 ID |
| `type` | `string` | 是 | 日历类型 |
| `name` | `string` | 否 | 日历名称 |

---

## ICS 文件处理

### 上传 ICS 数据

| 属性 | 值 |
|------|-----|
| **函数名** | `uploadIcsData` |
| **方法** | `POST` |
| **路径** | `v1/ics/upload` |

**请求体**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `ics` | `string` | 是 | ICS 文件内容 |
| `email` | `string` | 否 | 关联邮箱 |

---

## 代理权限管理

### 获取代理权限列表

| 属性 | 值 |
|------|-----|
| **函数名** | `getProxyPermission` |
| **方法** | `GET` |
| **路径** | `v1/proxy/permissions` |

**请求参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `type` | `'given' \| 'own'` | 否 | `'own'` | 权限类型 |

**示例**:
```
GET v1/proxy/permissions?type=own
```

---

### 添加代理权限

| 属性 | 值 |
|------|-----|
| **函数名** | `addProxyPermission` |
| **方法** | `POST` |
| **路径** | `v1/proxy/permissions` |

**请求体**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `users` | `string[]` | 是 | 用户 ID 数组 |

---

### 删除代理权限

| 属性 | 值 |
|------|-----|
| **函数名** | `deleteProxyPermission` |
| **方法** | `DELETE` |
| **路径** | `v1/proxy/permissions` |

**请求体**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `uid` | `string` | 是 | 用户 ID |

---

## 直播/活动管理

### 添加直播到日历

| 属性 | 值 |
|------|-----|
| **函数名** | `addLiveStreamToCalendar` |
| **方法** | `POST` |
| **路径** | `v1/calendar/{cid}/livestream` |

**路径参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `cid` | `string` | 否 | `'default'` | 日历 ID |

**请求体**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `eid` | `string` | 是 | 活动 ID |

---

## 日程事件管理

### 删除会议日程

| 属性 | 值 |
|------|-----|
| **函数名** | `deleteMeetingSchedule` |
| **方法** | `DELETE` |
| **路径** | `v1/calendar/{calendarId}/events/{eventId}` |

**路径参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `calendarId` | `string` | 否 | `'default'` | 日历 ID |
| `eventId` | `string` | 是 | - | 事件 ID |

**查询参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `isAllEvent` | `boolean` | 否 | `false` | 是否全部事件 |
| `isRecurring` | `boolean` | 否 | `false` | 是否重复事件 |

**示例**:
```
DELETE v1/calendar/default/events/abc123?isAllEvent=false&isRecurring=false
```

---

### 更新会议出席状态

| 属性 | 值 |
|------|-----|
| **函数名** | `goingScheduleMeeting` |
| **方法** | `PUT` |
| **路径** | `v1/calendar/{calendarId}/events/{eventId}/going` |

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `calendarId` | `string` | 是 | 日历 ID |
| `eventId` | `string` | 是 | 事件 ID |

**请求体**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `going` | `string` | 是 | 出席状态 (`yes`/`no`/`maybe`) |
| `isRecurring` | `boolean` | 是 | 是否重复事件 |
| `isAllEvent` | `boolean` | 是 | 是否全部事件 |

---

### 更新会议通知设置

| 属性 | 值 |
|------|-----|
| **函数名** | `scheduleMeetingReceiveNotify` |
| **方法** | `PUT` |
| **路径** | `v1/calendar/{calendarId}/events/{eventId}/notification` |

**路径参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `calendarId` | `string` | 否 | `'default'` | 日历 ID |
| `eventId` | `string` | 是 | - | 事件 ID |

**请求体**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `receiveNotification` | `boolean` | 否 | `false` | 是否接收通知 |
| `isRecurring` | `boolean` | 否 | `false` | 是否重复事件 |
| `isAllEvent` | `boolean` | 否 | `false` | 是否全部事件 |

---

### 复制日程会议信息

| 属性 | 值 |
|------|-----|
| **函数名** | `copyScheduleMeetingInfo` |
| **方法** | `GET` |
| **路径** | `v1/calendar/{calendarId}/events/{eventId}/copy` |

**路径参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `calendarId` | `string` | 否 | `'default'` | 日历 ID |
| `eventId` | `string` | 是 | - | 事件 ID |

**查询参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `type` | `string` | 是 | `'difft'` | 类型 |
| `action` | `string` | 否 | `'copy'` | 操作类型 |

**示例**:
```
GET v1/calendar/default/events/abc123/copy?type=difft&action=copy
```

---

### 获取日程创建配置

| 属性 | 值 |
|------|-----|
| **函数名** | `getSchedulerCreateConfig` |
| **方法** | `POST` |
| **路径** | `v1/calendar/{calendarId}/events/precreate` |

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `calendarId` | `string` | 是 | 日历 ID |

**请求体**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `calendarId` | `string` | 是 | 日历 ID |
| `features` | `string[]` | 是 | 功能列表，如 `['canSyncGoogle']` |

---

### 创建会议日程

| 属性 | 值 |
|------|-----|
| **函数名** | `createMeetingSchedule` |
| **方法** | `POST` |
| **路径** | `v1/calendar/{calendarId}/events` |

**路径参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `calendarId` | `string` | 否 | `'default'` | 日历 ID |

**请求头**:

| 参数名 | 值 | 说明 |
|--------|-----|------|
| `x-full-response` | `'1'` | 返回完整响应 |

**请求体**: 事件详细信息对象

---

### 更新会议日程

| 属性 | 值 |
|------|-----|
| **函数名** | `updateMeetingSchedule` |
| **方法** | `PUT` |
| **路径** | `v1/calendar/{calendarId}/events/{eventId}` |

**路径参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `calendarId` | `string` | 否 | `'default'` | 日历 ID |
| `eventId` | `string` | 是 | - | 事件 ID |

**请求头**:

| 参数名 | 值 | 说明 |
|--------|-----|------|
| `x-full-response` | `'1'` | 返回完整响应 |

**请求体**: 事件更新信息对象

---

## 组织信息

### 获取组织用户列表

| 属性 | 值 |
|------|-----|
| **函数名** | `getSchedulerOrgInfo` |
| **方法** | `GET` |
| **路径** | `v1/org/users` |

**示例**:
```
GET v1/org/users
```

---

## 空闲/忙碌时间查询

### 批量查询用户空闲时间

| 属性 | 值 |
|------|-----|
| **函数名** | `getMeetingViewScheduleList` |
| **方法** | `POST` |
| **路径** | `v1/user/freebusy` |

**请求体**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `users` | `string[]` | 是 | 用户 ID 数组 |
| `start` | `number` | 是 | 开始时间戳 |
| `end` | `number` | 是 | 结束时间戳 |

---

### 查询单用户空闲时间

| 属性 | 值 |
|------|-----|
| **函数名** | `scheduleMeetingGetFreeTime` |
| **方法** | `GET` |
| **路径** | `v1/user/{uid}/freebusy` |

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `uid` | `string` | 是 | 用户 ID |

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `start` | `number` | 是 | 开始时间戳 |
| `end` | `number` | 是 | 结束时间戳 |

**示例**:
```
GET v1/user/+72556268884/freebusy?start=1768290840&end=1768305240
```

---

### 查询群组空闲时间

| 属性 | 值 |
|------|-----|
| **函数名** | `scheduleMeetingGetGroupFreeTime` |
| **方法** | `GET` |
| **路径** | `v1/group/{gid}/freebusy` |

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `gid` | `string` | 是 | 群组 ID |

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `start` | `number` | 是 | 开始时间戳 |
| `end` | `number` | 是 | 结束时间戳 |

**示例**:
```
GET v1/group/abc123/freebusy?start=1768290840&end=1768305240
```

---

## Mock 函数（开发/测试用）

以下函数目前返回模拟数据，不发送真实 HTTP 请求：

### 静音会议

| 属性 | 值 |
|------|-----|
| **函数名** | `onMuteMeeting` |
| **状态** | Mock |
| **说明** | 返回模拟的成功响应 |

---

### 获取会议日程详情

| 属性 | 值 |
|------|-----|
| **函数名** | `getMeetingScheduleDetail` |
| **状态** | Mock |
| **说明** | 返回模拟的会议详情数据，包含随机逻辑 |

---

## API 接口汇总表

| 序号 | 函数名 | 方法 | 路径 | 说明 |
|------|--------|------|------|------|
| 1 | `getSchedulerDashboard` | GET | `v1/calendar/dashboard` | 获取日程仪表盘 |
| 2 | `addUserCalendar` | POST | `v1/user/calendar` | 添加用户日历 |
| 3 | `deleteUserCalendar` | DELETE | `v1/user/calendar` | 删除用户日历 |
| 4 | `updateUserCalendar` | PUT | `v1/user/calendar` | 更新用户日历 |
| 5 | `uploadIcsData` | POST | `v1/ics/upload` | 上传 ICS 数据 |
| 6 | `getProxyPermission` | GET | `v1/proxy/permissions` | 获取代理权限列表 |
| 7 | `addProxyPermission` | POST | `v1/proxy/permissions` | 添加代理权限 |
| 8 | `deleteProxyPermission` | DELETE | `v1/proxy/permissions` | 删除代理权限 |
| 9 | `addLiveStreamToCalendar` | POST | `v1/calendar/{cid}/livestream` | 添加直播到日历 |
| 10 | `deleteMeetingSchedule` | DELETE | `v1/calendar/{calendarId}/events/{eventId}` | 删除会议日程 |
| 11 | `goingScheduleMeeting` | PUT | `v1/calendar/{calendarId}/events/{eventId}/going` | 更新出席状态 |
| 12 | `scheduleMeetingReceiveNotify` | PUT | `v1/calendar/{calendarId}/events/{eventId}/notification` | 更新通知设置 |
| 13 | `copyScheduleMeetingInfo` | GET | `v1/calendar/{calendarId}/events/{eventId}/copy` | 复制会议信息 |
| 14 | `getSchedulerCreateConfig` | POST | `v1/calendar/{calendarId}/events/precreate` | 获取创建配置 |
| 15 | `createMeetingSchedule` | POST | `v1/calendar/{calendarId}/events` | 创建会议日程 |
| 16 | `updateMeetingSchedule` | PUT | `v1/calendar/{calendarId}/events/{eventId}` | 更新会议日程 |
| 17 | `getSchedulerOrgInfo` | GET | `v1/org/users` | 获取组织用户列表 |
| 18 | `getMeetingViewScheduleList` | POST | `v1/user/freebusy` | 批量查询空闲时间 |
| 19 | `scheduleMeetingGetFreeTime` | GET | `v1/user/{uid}/freebusy` | 查询用户空闲时间 |
| 20 | `scheduleMeetingGetGroupFreeTime` | GET | `v1/group/{gid}/freebusy` | 查询群组空闲时间 |

---

## 响应格式

所有接口统一响应格式：

```json
{
  "status": 0,
  "data": { ... },
  "reason": null
}
```

- `status`: 状态码，`0` 表示成功
- `data`: 响应数据
- `reason`: 错误原因（失败时）

**注意**: 当请求头包含 `x-full-response: 1` 时，返回完整响应对象；否则仅返回 `data` 字段。

---

*文档生成时间: 2026-01-28*

