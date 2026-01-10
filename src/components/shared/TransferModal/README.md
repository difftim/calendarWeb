## TransferModal 如何使用

### 1. 创建组件

```jsx
type XXXItem = {
  id: string;
  name: string;
  email: string;
};
const XxxModalContent = ({
  list
  onClose,
  onConfirm,
  gender,
  ...props
}: ModalProps<XXXItem, { gender: 'male' | 'female' }>) => {

  const store = useTranferModalStore()

  useEffect(() => {
    store.setDataSource(list)
  }, [list])

  const MyCustomSearch = ({ searchText, dataSource, payload, setNoResult, setSearchText, leftItems }) => {
    const [type, setType] = useState<'direct' | 'group'>('direct')
    const { i18n } = useI18n()
    // ‼️ 需要在search的 hook 自己处理左边显示的 items
    useEffect(() => {
      if (!dataSource.length) {
        return;
      }
      // custom logic
      data = filterByType(data, type)

      data = dataSource.filter(
        item => !payload.selected.some(select => select.id === item.id)
      );

      if (searchText) {
        data = data.filter(item =>
          isSearchMatch(item, searchText, i18n)
        );
      }

      unstable_batchedUpdates(() => {
        if (!data.length) {
          setNoResult(
            <div className="no-result">
              {'尽力了，真搜不到啊'}
            </div>
          );
          return;
        }
        setNoResult(null);
        setLeftItems(data);
      });
    }, [dataSource, searchText, payload, type]);

    return (
      <div>
        <DropDown
          onChange={v => {
            setType(v)
            setLeftItems([])
            setPayload(prev => (prev => ({ ...prev, selected: [] })))
          }}
          value={type} options={options}>
        <SearchInput value={searchText} onChange={setSearchText}>
      </div>
    )
  }

  return (
    <TransferModalConsumer<XXXItem>
      onClose={onClose} // required ✅
      onConfirm={onConfirm}  // required ✅
      title={'title of the modal'} // required ✅
      rowHeight={120}
      isSearchMatch={defaultIsSearchMatch}
      disabledItems={[{ id: 'xxx', name: 'yyy', email: 'zzz' }]}
      renderRow={({ item, style }) => <ListItem style={style} {...item} /> } // required ✅
      renderTopArea={(store) => <div>hello {store.searchText}----{gender}</div>}
      renderSearchInput={(store) => <MyCustomSearch {...store} />}
      renderFooter={({ OkBtn, CancelBtn, payload }) => (
        <>
          <MyButton
            disabled={payload.selected.length === 0 || !payload.groupName}
            onClick={() => {console.log('import')}}>Import</MyButton>
          <CancelBtn />
          <OkBtn />
        </>
      )}
      {...props}
    />
  )
};
```

### 2. 如何使用

2.1 hooks （推荐 ✅）

```jsx
export const useXXXModal = () => {
  const showXXXModal = useTransferModalWithContent(XxxModalContent);

  return {
    showXXXModal,
  };
};

showXXXModal({
  list: xxx.getList(),
  onConfirm: async (payload, onClose) => {
    const { selected } = payload;
    const isSuccess = await someApi({ data: selected.map(u => u.id) });
    if (isSuccess) {
      toastSuccess('succeed! 😺');
      onClose();
    } else {
      toastError('try again later 😖');
    }
  },
});
```

2.2 使用 Modal 组件

```jsx
const XXXXTransferModal = createTransferModal(XxxModalContent);

const [show, setShow] = useState(false)

<XXXXTransferModal
  show={show}
  onClose={() => setShow(false)}
  title="xxxxx"
  renderRow=() =>  <div>hahahaaha</div>
  onConfirm={console.log}
/>
```

### 3 Store 类型定义

```typescript
interface Store<T> = {
  dataSource: T[],
  setDataSource: SetAtom<[SetStateAction<T[]>], void>
  searchText: string,
  setSearchText: SetAtom<[string], void>,
  leftItems: T[],
  setLeftItems: T[],
  payload: { selected: T[], [key: string]: any }
  setPayload: SetAtom<[SetStateAction<T[]>], void>,
  loading: boolean,
  setLoading: SetAtom<[SetStateAction<boolean>], void>,
  disabledItems: T[],
  setDisabledItems: SetAtom<[SetStateAction<T[]>], void>,
  noResult: ReactNode,
  setNoResult: SetAtom<[SetStateAction<ReactNode>], void>,
}
```

### 4 也支持调用时动态改变

```jsx
showXXXModal({
  renderSearchInput: store => <MySearchVersion2 {...store} />,
  sortFn: list => mySort(list),
});
```
