# Learnings Log

Structured learnings captured during development. Format: `[LRN-YYYYMMDD-XXX]`

---

### [LRN-20260316-001] precreate API response has no `data` wrapper
- **Priority:** high
- **Status:** resolved
- **Area:** frontend
- **Context:** Porting bot auto-join feature, `getSchedulerCreateConfig` API call
- **Expected:** Response structure `{ data: { canSyncGoogle, availableBots } }` as per type annotation
- **Actual:** Response is directly `{ canSyncGoogle, availableBots }` — no `data` wrapper
- **Fix/Learning:** Use `res.data ?? res` to handle both structures. The TypeScript type annotation in `src/api/index.ts` is misleading.
- **Related Files:** `src/api/index.ts`, `src/atoms/query.ts`
- **Recurrence-Count:** 1

### [LRN-20260316-002] TransferModal remote search overrides local matches
- **Priority:** high
- **Status:** resolved
- **Area:** frontend
- **Context:** Bot items added to dataSource but not showing in search results
- **Expected:** Local bot items should appear alongside remote search results
- **Actual:** Remote search clears local results via `setLeftItems([])`, then `afterSearch` callback was ignoring local matches
- **Fix/Learning:** In `afterSearch`, explicitly re-match from `dataSource` using `defaultIsSearchMatch` and merge with remote results. Don't rely on `localItems` param alone — do keyword matching inside `afterSearch` for self-contained logic.
- **Related Files:** `src/pages/scheduler/components/EditAttendeeDialog.tsx`, `src/shared/TransferModal/index.tsx`
- **Recurrence-Count:** 1

### [LRN-20260316-003] atomWithQuery returns query result, not data directly
- **Priority:** medium
- **Status:** resolved
- **Area:** frontend
- **Context:** `useAtom(queryScheduleConfigAtom)` access pattern
- **Expected:** `const [data] = useAtom(atom)` gives data directly
- **Actual:** Returns `QueryObserverResult` — actual data is at `.data` property
- **Fix/Learning:** Always access via `result.data?.field` when using `atomWithQuery` from jotai-tanstack-query.
- **Related Files:** `src/atoms/query.ts`, all consumers of `queryScheduleConfigAtom`
- **Recurrence-Count:** 1
