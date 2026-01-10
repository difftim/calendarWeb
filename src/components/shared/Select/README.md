# Select

## Example

```tsx
<Select
  className="setting-dialog-select"
  value={notifyIndex}
  onChange={async selectedValue => {
    setOperationLoading(true);
    await setNotifyIndex(parseInt(selectedValue));
    setOperationLoading(false);
  }}
  options={[
    {
      value: 3,
      label: i18n('default', [i18n(defaultNotificationSetting)]),
    },
    {
      value: 0,
      label: i18n('notifyAll'),
    },
    {
      value: 1,
      label: i18n('notifyAtMe'),
    },
    {
      value: 2,
      label: i18n('notifyNone'),
    },
  ]}
>
```

## Props (WIP)

| Name           | Type    | Default                 | Description                            |
| :------------- | :------ | :---------------------- | :------------------------------------- |
| className      | boolean | dsw-shared-select       | className                              |
| virtual        | boolean | false                   | turn off virtual scrolling for default |
| popupClassName | string  | dsw-shared-select-popup | class name for popup layer             |

Details see [here](https://ant.design/components/select-cn)
