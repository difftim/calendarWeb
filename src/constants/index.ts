export const PREVIEW_ITEM_STYLE = {
  color: `var(--dsw-color-text-secondary)`,
  lineHeight: '20px',
  height: '40px',
  padding: '10px 12px',
  borderRadius: '4px',
  border: `1px solid var(--dsw-color-bg-3)`,
};

export const prefixCls = 'dsw-shared';

export const DURATION_OPTIONS = [
  { value: 15, label: '15 minutes' },
  { value: 20, label: '20 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
];

export const REPEAT_OPTIONS = [
  { value: 'Never', label: 'Never' },
  {
    value: 'FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,TU,WE,TH,FR',
    label: 'Weekdays',
  },
  { value: 'FREQ=DAILY;INTERVAL=1', label: 'Daily' },
  { value: 'FREQ=WEEKLY;INTERVAL=1', label: 'Weekly' },
  {
    value: 'FREQ=WEEKLY;INTERVAL=2',
    label: 'Biweekly',
  },
  {
    value: 'FREQ=MONTHLY;INTERVAL=1',
    label: 'Monthly',
  },
];

export const POPOVER_INNER_STYLE = {
  backgroundColor: 'var(--dsw-color-bg-popup)',
  overflow: 'hidden',
  boxShadow: 'var(--dsw-elevation-02)',
  borderRadius: 'var(--dsw-radius-large)',
  padding: '6.5px 4px',
};
