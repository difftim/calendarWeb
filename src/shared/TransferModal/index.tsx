import React, {
  CSSProperties,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  cloneElement,
  useEffect,
  useRef,
} from 'react';
import { AutoSizer, List } from 'react-virtualized';
import { Button, ButtonProps, Flex, Modal, Spin } from 'antd';
import classNames from 'classnames';
import { uniqBy } from 'lodash';
import { searchUsers } from '@difftim/jsbridge-utils';

import { SearchInput } from '../Input';
import Select from '../Select';
import { unstable_batchedUpdates } from 'react-dom';
import {
  AfterSearchFn,
  ShouldSearchRemoteFn,
  TransferModalStoreProvider,
  useTranferModalStore,
} from './TransferModalContext';
import { useI18n } from '@/hooks/useI18n';
import { LocalizerType } from '@/types/Util';
import { IconCloseF, TablerSearch } from '@/shared/IconsNew';
import { ExcludeOnClose } from './useTransferModal';
import ConfigProvider from '../ConfigProvider';

type BtnComponent = React.FC<ButtonProps & { okText?: string; cancelText?: string }>;

type renderNoResultParams = { searchText: string; i18n: LocalizerType };

type IsSearchMatch<T> = (item: T, searchText: string, i18n: LocalizerType) => boolean;

export type Store<T extends { id: string }> = ReturnType<typeof useTranferModalStore<T>>;

export type OnConfirm<T extends { id: string }> = (
  payload: Store<T>['payload'],
  onClose: () => void
) => Promise<void> | void;

export type ModalProps<T extends { id: string }, U = {}> = U & {
  list: T[];
  onClose: () => void;
  onConfirm: OnConfirm<T>;
} & Partial<TransferModalProps<T>>;

export interface TransferModalProps<T extends { id: string }> {
  title: ReactNode;
  className?: string;
  rowHeight?: number;
  showDisabledItemInRight?: boolean;
  isSearchMatch?: IsSearchMatch<T>;
  renderTopArea?: (store: Store<T>) => ReactNode;
  renderSelectedTitle?: (store: Store<T>) => ReactNode;
  renderSearchInput?: (store: Store<T>) => ReactElement;
  enableTypeFilter?: boolean;
  typeFilterOptions?: Array<{ value: 'direct' | 'group'; label: ReactNode }>;
  defaultTypeFilter?: 'direct' | 'group';
  typeFilterSelectTypeMap?: Partial<Record<'direct' | 'group', string>>;
  emptySearchTip?: ReactNode;
  renderRow: (props: {
    item: T;
    style: CSSProperties;
    type: 'from' | 'to';
    selected: T[];
  }) => ReactElement;
  renderNoResult?: (props: renderNoResultParams) => ReactNode;
  renderFooter?: (props: {
    OkBtn: BtnComponent;
    CancelBtn: BtnComponent;
    payload: Store<T>['payload'];
    disabledItems?: T[];
  }) => ReactElement;
  afterSearch?: AfterSearchFn<T>;
  shouldSearchRemote?: ShouldSearchRemoteFn<T>;
  onClose: () => void;
  onConfirm: OnConfirm<T>;
}

export type RemoteUser = {
  id: string;
  name?: string;
  email?: string;
  avatarPath?: string;
  timeZone?: string;
};

export const searchRemoteUsers = async (keyword: string): Promise<RemoteUser[]> => {
  if (!keyword) return [];
  let users = await searchUsers(
    { keyword, scope: ['userName', 'email', 'id'] },
    { excludeBots: true }
  ).catch(() => []);
  if (!users.length) {
    const legacyParams = keyword.includes('@') ? { email: keyword } : { name: keyword };
    users = await searchUsers(legacyParams as any).catch(() => []);
  }
  return users as RemoteUser[];
};

export const defalutSortFn = <T extends Record<string, any>>(arr: T[]) => {
  const itemSort = (left: T, right: T) => {
    const collator = new Intl.Collator();
    const leftTimestamp = left.timestamp;
    const rightTimestamp = right.timestamp;
    if (leftTimestamp && !rightTimestamp) {
      return -1;
    }
    if (rightTimestamp && !leftTimestamp) {
      return 1;
    }
    if (leftTimestamp && rightTimestamp && leftTimestamp !== rightTimestamp) {
      return rightTimestamp - leftTimestamp;
    }

    const getName = (item: any) => {
      if (item.name) {
        return item.name.toLowerCase();
      }
      return item.id;
    };

    const leftTitle = getName(left);
    const rightTitle = getName(right);
    return collator.compare(leftTitle, rightTitle);
  };

  return arr.slice().sort(itemSort);
};

export const defaultIsSearchMatch = (c: any, searchTerm: string) => {
  const search = searchTerm.toLowerCase();
  let name = c.id;

  if (name && name.toLowerCase().includes(search)) {
    return true;
  }

  name = c.name;
  if (name && name.toLowerCase().includes(search)) {
    return true;
  }

  name = c.profileName;
  if (name && name.toLowerCase().includes(search)) {
    return true;
  }

  name = c.title;
  if (name && name.toLowerCase().includes(search)) {
    return true;
  }

  name = c.email;
  if (name && name.toLowerCase().includes(search)) {
    return true;
  }

  name = c.signature;
  if (name && name.toLowerCase().includes(search)) {
    return true;
  }

  if (c.isMe) {
    if (name.toLowerCase().includes(search)) {
      return true;
    }
  }

  return false;
};

const DefaultSearch = <T extends { id: string }>(props: {
  isSearchMatch: (item: T, searchText: string, i18n: any) => boolean;
  enableTypeFilter?: boolean;
  typeFilterOptions?: Array<{ value: 'direct' | 'group'; label: ReactNode }>;
  defaultTypeFilter?: 'direct' | 'group';
  typeFilterSelectTypeMap?: Partial<Record<'direct' | 'group', string>>;
  emptySearchTip?: ReactNode;
  [key: string]: any;
}) => {
  const { i18n } = useI18n();
  const t = (key: string, substitutions?: string | string[]) => i18n(key as never, substitutions);
  const {
    isSearchMatch,
    enableTypeFilter,
    typeFilterOptions = [
      { value: 'direct', label: 'contact' },
      { value: 'group', label: 'group' },
    ],
    defaultTypeFilter = 'direct',
    typeFilterSelectTypeMap = { direct: 'direct', group: 'group' },
    emptySearchTip,
    ...rest
  } = props;
  const {
    dataSource,
    payload,
    setLeftItems,
    searchText,
    setSearchText,
    setNoResult,
    setSearchLoading,
    setPayload,
    afterSearch,
    shouldSearchRemote,
  } = useTranferModalStore<T>();
  const [filterType, setFilterType] = React.useState<'direct' | 'group'>(defaultTypeFilter);
  const payloadRef = useRef(payload);

  useEffect(() => {
    payloadRef.current = payload;
  }, [payload]);

  // hook to set left sources
  useEffect(() => {
    let active = true;
    const keyword = searchText.trim();
    const effectiveSource = enableTypeFilter
      ? dataSource.filter((item: any) => item.type === filterType)
      : dataSource;

    const finalize = (items: T[], hasSearch: boolean) => {
      unstable_batchedUpdates(() => {
        if (!items.length && hasSearch) {
          setNoResult(<Flex justify="center">{t('noSearchResults', [keyword])}</Flex>);
        } else if (!items.length && !hasSearch && emptySearchTip) {
          setNoResult(<Flex justify="center">{emptySearchTip}</Flex>);
        } else {
          setNoResult(null);
        }
        setLeftItems(items);
        setSearchLoading(false);
      });
    };
    if (!keyword) {
      setSearchLoading(false);
      finalize(effectiveSource, false);
      return () => {
        active = false;
      };
    }

    const localMatches = effectiveSource.filter(item => isSearchMatch(item, keyword, i18n));
    if (localMatches.length) {
      finalize(localMatches, true);
      return () => {
        active = false;
      };
    }

    if (
      shouldSearchRemote &&
      !shouldSearchRemote({ keyword, payload: payloadRef.current, dataSource: effectiveSource })
    ) {
      finalize([], true);
      return () => {
        active = false;
      };
    }

    setSearchLoading(true);
    setLeftItems([]);

    (async () => {
      const remoteUsers = await searchRemoteUsers(keyword);
      if (!active) return;
      const remoteItems = remoteUsers as unknown as T[];
      if (afterSearch) {
        const extra = await afterSearch({
          keyword,
          localItems: localMatches,
          remoteItems,
          dataSource: effectiveSource,
        });
        if (!active) return;
        if (extra && extra.length) {
          finalize(extra, true);
          return;
        }
      }
      finalize(remoteItems, true);
    })();

    return () => {
      active = false;
    };
  }, [dataSource, searchText, enableTypeFilter, filterType]);

  useEffect(() => {
    if (!enableTypeFilter) return;
    const selectType = typeFilterSelectTypeMap[filterType] || filterType;
    setPayload((prev: any) => ({
      ...prev,
      selected: [],
      selectType,
    }));
  }, [enableTypeFilter, filterType]);

  const renderPrefix = () => {
    if (!enableTypeFilter) {
      return <TablerSearch className="module-common-header__searchinput-prefix" />;
    }

    const renderLabel = (label: ReactNode) => (
      <Flex
        justify="space-between"
        gap="5px"
        align="center"
        style={{
          padding: '0 1px',
          color: 'var(--dsw-color-text-primary)',
        }}
      >
        <span>{label}</span>
        <span className="arrow" />
      </Flex>
    );

    return (
      <Flex align="center" gap="6px">
        <Select
          popupClassName="edit-select-search-popup"
          className="edit-select-search-select"
          suffixIcon={null}
          labelRender={v => renderLabel(v.label)}
          optionRender={v => <div className="edit-select-search-option">{v.label}</div>}
          onClick={e => e.stopPropagation()}
          popupMatchSelectWidth={false}
          dropdownAlign={{ offset: [-6, 8] }}
          options={typeFilterOptions}
          value={filterType}
          onChange={(next: 'direct' | 'group') => setFilterType(next)}
        />
        <TablerSearch className="search-icon" />
      </Flex>
    );
  };

  return (
    <SearchInput
      prefix={renderPrefix()}
      variant={enableTypeFilter ? 'borderless' : undefined}
      className={enableTypeFilter ? 'edit-select-search' : undefined}
      style={{ width: '100%' }}
      placeholder={t('search')}
      dir="auto"
      value={searchText}
      onChange={e => setSearchText(e.target.value)}
      spellCheck={false}
      {...rest}
    />
  );
};

export const TransferModalConsumer = <T extends { id: string }>({
  title = '',
  className = '',
  onClose,
  onConfirm,
  rowHeight = 56,
  showDisabledItemInRight = false,
  isSearchMatch = defaultIsSearchMatch,
  renderRow,
  renderTopArea = () => null,
  renderSelectedTitle = () => null,
  renderSearchInput,
  enableTypeFilter = false,
  typeFilterOptions,
  defaultTypeFilter = 'direct',
  typeFilterSelectTypeMap,
  emptySearchTip,
  afterSearch,
  shouldSearchRemote,
  renderFooter = ({ OkBtn, CancelBtn }) => (
    <>
      <CancelBtn />
      <OkBtn />
    </>
  ),
}: PropsWithChildren<TransferModalProps<T>>) => {
  const { i18n } = useI18n();
  const t = (key: string, substitutions?: string | string[]) => i18n(key as never, substitutions);
  const store = useTranferModalStore<T>();
  const {
    // dataSource,
    payload,
    leftItems,
    // setLeftItems,
    loading,
    setLoading,
    setPayload,
    disabledItems,
    // searchText,
    noResult,
    searchLoading,
    setAfterSearch,
    setShouldSearchRemote,
  } = store;
  const lastAfterSearchRef = useRef(afterSearch);
  const lastShouldSearchRemoteRef = useRef(shouldSearchRemote);

  useEffect(() => {
    if (lastAfterSearchRef.current === afterSearch) return;
    lastAfterSearchRef.current = afterSearch;
    setAfterSearch(() => afterSearch ?? null);
  }, [afterSearch]);

  useEffect(() => {
    if (lastShouldSearchRemoteRef.current === shouldSearchRemote) return;
    lastShouldSearchRemoteRef.current = shouldSearchRemote;
    setShouldSearchRemote(() => shouldSearchRemote ?? null);
  }, [shouldSearchRemote]);

  const rightList = uniqBy(
    [...payload.selected, ...(showDisabledItemInRight ? disabledItems : [])],
    item => item.id
  );

  const okButtonDisabled = rightList.length === 0;

  const CancelBtn: BtnComponent = ({ cancelText, ...rest }) => (
    <Button type="default" onClick={onClose} {...rest}>
      {cancelText || t('cancel')}
    </Button>
  );

  const OkBtn: BtnComponent = ({ okText, ...rest }) => (
    <Button
      type="primary"
      disabled={okButtonDisabled}
      loading={false}
      onClick={async () => {
        try {
          if (loading) {
            return;
          }
          setLoading(true);
          await onConfirm(payload, onClose);
          setLoading(false);
        } catch (error) {
          setLoading(false);
        }
      }}
      {...rest}
    >
      {okText || t('confirmNumber', ['' + (rightList.length || '')])}
    </Button>
  );

  return (
    <ConfigProvider
      themeConfig={{
        components: {
          Button: {
            defaultHoverBg: 'var(--dsw-color-modal-btn-default-hover-bg)',
          },
        },
      }}
    >
      <div className={classNames('dsw-shared-transfer-modal', className)}>
        <Flex align="center" justify="space-between">
          <h3>{title}</h3>
          <IconCloseF className="close" onClick={onClose} />
        </Flex>
        {renderTopArea(store)}
        <Flex gap="36px">
          <div className="left">
            <div style={{ padding: '15px' }}>
              {renderSearchInput?.(store) || (
                <DefaultSearch<T>
                  isSearchMatch={isSearchMatch}
                  enableTypeFilter={enableTypeFilter}
                  typeFilterOptions={typeFilterOptions}
                  defaultTypeFilter={defaultTypeFilter}
                  typeFilterSelectTypeMap={typeFilterSelectTypeMap}
                  emptySearchTip={emptySearchTip}
                />
              )}
            </div>
            {!searchLoading &&
              (noResult || (
                <AutoSizer className="list">
                  {({ height, width }) => (
                    <List
                      width={width}
                      height={height}
                      className="module-left-pane__virtual-list overflow-style-normal"
                      rowCount={leftItems.length}
                      rowHeight={rowHeight}
                      rowRenderer={({ style, index }) => {
                        const item = leftItems[index];
                        const itemEle = renderRow({
                          item,
                          style,
                          type: 'from',
                          selected: payload.selected,
                        });

                        if (typeof itemEle.props.onClick !== 'function') {
                          return cloneElement(itemEle, {
                            onClick(e: React.MouseEvent) {
                              e?.stopPropagation?.();
                              if (disabledItems?.some(u => u.id === item.id)) {
                                return;
                              }

                              unstable_batchedUpdates(() => {
                                const checked = payload.selected.some(u => u.id === item.id);

                                setPayload(v => ({
                                  ...v,
                                  selected: checked
                                    ? v.selected.filter(u => u.id !== item.id)
                                    : uniqBy([...v.selected, item], 'id'),
                                }));
                              });
                            },
                          });
                        }
                        return itemEle;
                      }}
                    />
                  )}
                </AutoSizer>
              ))}
            <Spin spinning={searchLoading} />
          </div>
          <div className="right">
            {renderSelectedTitle(store)}
            {rightList.length > 0 ? (
              <AutoSizer className="list">
                {({ height, width }) => (
                  <List
                    className={'module-left-pane__virtual-list overflow-style-normal'}
                    height={height}
                    rowCount={rightList.length}
                    rowHeight={rowHeight}
                    rowRenderer={({ style, index }) => {
                      const item = rightList[index];
                      const itemEle = renderRow({
                        item,
                        style,
                        type: 'to',
                        selected: rightList,
                      });

                      if (typeof itemEle.props.onClick !== 'function') {
                        return cloneElement(itemEle, {
                          onClick(e: React.MouseEvent) {
                            e?.stopPropagation?.();
                            if (
                              showDisabledItemInRight &&
                              disabledItems?.some(u => u.id === item.id)
                            ) {
                              return;
                            }
                            unstable_batchedUpdates(() => {
                              setPayload(v => ({
                                ...v,
                                selected: v.selected.filter(u => u.id !== item.id),
                              }));
                            });
                          },
                        });
                      }
                      return itemEle;
                    }}
                    width={width}
                  />
                )}
              </AutoSizer>
            ) : null}
          </div>
        </Flex>

        <Flex gap="10px" justify="flex-end" align="center" style={{ padding: '15px 0' }}>
          {renderFooter({ OkBtn, CancelBtn, payload, disabledItems })}
        </Flex>
      </div>
    </ConfigProvider>
  );
};

export const createTranferModal =
  <T extends unknown>(Component: React.FC<T>) =>
  (props: { show: boolean; onClose: () => void } & ExcludeOnClose<T>) => {
    const { show, onClose, ...rest } = props;
    const mergedProps = { ...rest, onClose } as unknown as PropsWithChildren<T>;

    useEffect(() => {
      if (!show) {
        return;
      }

      const onEscClose = (e: KeyboardEvent) => {
        if (e && e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', onEscClose);

      return () => {
        window.removeEventListener('keydown', onEscClose);
      };
    }, [show]);

    return (
      <Modal
        open={show}
        footer={null}
        width={654}
        closeIcon={null}
        className="dsw-transfer-modal-wrapper"
        destroyOnClose
        keyboard={false}
        centered
      >
        <TransferModalStoreProvider>
          <Component {...mergedProps} />
        </TransferModalStoreProvider>
      </Modal>
    );
  };
