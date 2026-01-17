import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { Flex, Spin } from 'antd';
import { uniq, uniqBy } from 'lodash';
import { searchUsers } from '@difftim/jsbridge-utils';

import { useTranferModalStore } from '@/shared/TransferModal/TransferModalContext';
import { useTransferModalWithContent } from '@/shared/TransferModal/useTransferModal';
import { ConversationItem } from '@/shared/SimpleComponent';
import { TablerSearch } from '@/shared/IconsNew';
import { SearchInput } from '@/shared/Input';
import Select from '@/shared/Select';
import { useI18n } from '@/hooks/useI18n';
import {
  createTranferModal,
  defalutSortFn,
  defaultIsSearchMatch,
  ModalProps,
  TransferModalConsumer,
} from '@/shared/TransferModal';
import { userCacheAtom } from '@/atoms';
import { store } from '@/atoms/store';

export type EditAttendeeItem = {
  id: string;
  type: 'group' | 'direct';
  name?: string;
  members?: string[];
  activeAt?: number;
  email?: string;
  isMe?: boolean;
  timestamp?: number;
  ext?: boolean;
  extUser?: boolean;
  validUser?: boolean;
  avatarPath?: string;
  timeZone?: string;
};

enum FoundUser {
  found = 1,
  notFound = 2,
  notMatch = 3,
}

const isSearchMatchEmail = (searchText: string) => {
  return /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
    searchText
  );
};
const isSearchMatchId = (searchText: string) => /^(\+)?\d{11}$/.test(searchText);

const getRealId = (searchText: string) =>
  searchText.startsWith('+') ? searchText : `+${searchText}`;

const findAppUser = (list: EditAttendeeItem[], emailOrIdLike: string) => {
  if (isSearchMatchId(emailOrIdLike)) {
    return list.find(item => item.id === getRealId(emailOrIdLike)) ?? FoundUser.notFound;
  }

  if (isSearchMatchEmail(emailOrIdLike)) {
    return (
      list.find(item => item.email?.toLowerCase() === emailOrIdLike.toLowerCase()) ??
      FoundUser.notFound
    );
  }

  return FoundUser.notMatch;
};

const getMatchedUserFromSearchText = (source: EditAttendeeItem[], searchText: string) => {
  if (!searchText.includes(',')) {
    return [];
  }

  const list = uniq(searchText.split(',').filter(item => Boolean(item.trim())));

  const result = list.reduce<EditAttendeeItem[]>((sum, emailOrIdLike) => {
    emailOrIdLike = emailOrIdLike.trim();
    const appUser = findAppUser(source, emailOrIdLike);
    if (appUser === FoundUser.notMatch) {
      return sum;
    }

    if (appUser === FoundUser.notFound) {
      const realId = isSearchMatchId(emailOrIdLike) ? getRealId(emailOrIdLike) : emailOrIdLike;
      sum.push({
        id: realId,
        email: realId,
        name: realId.split('@')[0],
        extUser: true,
        ext: true,
        type: 'direct',
      });
    } else {
      sum.push(appUser);
    }

    return sum;
  }, []);

  return uniqBy(result, item => item.id);
};

const getExternalUser = (source: EditAttendeeItem[], searchText: string) => {
  if (isSearchMatchEmail(searchText) || isSearchMatchId(searchText)) {
    const name = searchText.split('@')[0];
    return [
      {
        id: isSearchMatchId(searchText) ? getRealId(searchText) : searchText,
        email: searchText,
        name,
        extUser: true,
        ext: true,
        type: 'direct',
      },
    ] as EditAttendeeItem[];
  }

  return getMatchedUserFromSearchText(source, searchText);
};

const updateUserCache = (users: EditAttendeeItem[]) => {
  const latestCache = store.get(userCacheAtom);
  const newCache = new Map(latestCache);
  users.forEach(user => {
    if (user.id) {
      newCache.set(user.id, {
        id: user.id,
        name: user.name || user.email || user.id,
        email: user.email,
        avatarPath: user.avatarPath,
        avatar: user.avatarPath,
        timeZone: user.timeZone,
      });
    }
  });
  store.set(userCacheAtom, newCache);
};

const EditSelectSearch = () => {
  const primaryColor = 'var(--dsw-color-text-primary)';
  const {
    dataSource,
    searchText,
    setSearchText,
    setPayload,
    setLeftItems,
    setNoResult,
    setSearchLoading,
  } = useTranferModalStore<EditAttendeeItem>();
  const { i18n } = useI18n();
  const [type, setType] = useState<'direct' | 'group'>('direct');
  const searchIdRef = useRef(0);

  const options = [
    { value: 'direct', label: '联系人' },
    { value: 'group', label: '群组' },
  ];

  useEffect(() => {
    let active = true;
    const currentSearchId = ++searchIdRef.current;
    const source = dataSource.filter(item => item.type === type);

    const updateLeftItems = (sources: EditAttendeeItem[]) => {
      unstable_batchedUpdates(() => {
        if (!sources.length && searchText) {
          setNoResult(<Flex justify="center">{i18n('noSearchResults', [searchText])}</Flex>);
        } else if (!sources.length && !searchText) {
          setNoResult(<Flex justify="center">{i18n('searchToAddMembers')}</Flex>);
        } else {
          setNoResult(null);
        }
        setLeftItems(sources);
        setSearchLoading(false);
      });
    };

    if (!searchText) {
      setSearchLoading(false);
      updateLeftItems(source);
      return () => {
        active = false;
      };
    }

    const localMatches = source.filter(u => defaultIsSearchMatch(u, searchText));
    if (localMatches.length || type === 'group') {
      updateLeftItems(localMatches);
      return () => {
        active = false;
      };
    }

    if (searchText.includes(',')) {
      updateLeftItems(getExternalUser(source, searchText));
      return () => {
        active = false;
      };
    }

    setSearchLoading(true);
    setNoResult(
      <Flex justify="center" style={{ paddingTop: 12 }}>
        <Spin size="small" />
      </Flex>
    );
    setLeftItems([]);

    (async () => {
      try {
        const remoteUsers = await searchUsers({ name: searchText, email: searchText } as any, {
          excludeBots: true,
        });
        console.log('remoteUsers', remoteUsers);
        if (!active || currentSearchId !== searchIdRef.current) return;
        const remoteItems = remoteUsers.map(user => ({
          ...user,
          type: 'direct',
        })) as EditAttendeeItem[];
        updateUserCache(remoteItems);
        if (remoteItems.length) {
          updateLeftItems(remoteItems);
          return;
        }
        updateLeftItems(getExternalUser(source, searchText));
      } catch {
        if (!active || currentSearchId !== searchIdRef.current) return;
        updateLeftItems(getExternalUser(source, searchText));
      } finally {
        if (active && currentSearchId === searchIdRef.current) {
          setSearchLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [type, searchText, dataSource]);

  const onChange = (value: 'direct' | 'group') => {
    unstable_batchedUpdates(() => {
      setType(value);
      setPayload({
        selected: [],
        selectType: value === 'group' ? 'groups' : 'members',
      });
      setSearchText('');
    });
  };

  const renderLabel = (label: ReactNode) => (
    <Flex
      justify="space-between"
      gap="5px"
      align="center"
      style={{
        padding: '0 1px',
        color: primaryColor,
      }}
    >
      <span>{label}</span>
      <span className="arrow" />
    </Flex>
  );

  return (
    <SearchInput
      variant="borderless"
      className="edit-select-search"
      value={searchText}
      placeholder={i18n('search')}
      onChange={e => setSearchText(e.target.value)}
      prefix={
        <Flex align="center" gap="6px">
          <Select
            popupClassName="edit-select-search-popup"
            className="edit-select-search-select"
            suffixIcon={null}
            labelRender={v => renderLabel(v.label)}
            optionRender={v => <div className="edit-select-search-option">{v.label}</div>}
            onClick={e => e.stopPropagation()}
            dropdownAlign={{ offset: [-6, 8] }}
            options={options}
            value={type}
            onChange={onChange}
          />
          <TablerSearch className="search-icon" />
        </Flex>
      }
    />
  );
};

const EditAttendeeContent = ({
  list,
  onClose,
  onConfirm,
  disabledList,
  ...props
}: ModalProps<EditAttendeeItem, { disabledList: EditAttendeeItem[] }>) => {
  const { setDataSource, setDisabledItems, disabledItems, setPayload } =
    useTranferModalStore<EditAttendeeItem>();

  useEffect(() => {
    unstable_batchedUpdates(() => {
      console.log('list....', list);
      setDataSource(defalutSortFn(list));
      setDisabledItems(disabledList);
      setPayload(v => ({ ...v, selectType: 'members' }));
    });
  }, [list, disabledList]);

  const renderSelectedTitle = ({ payload }: any) => (
    <div
      style={{
        padding: 16,
        fontWeight: 500,
        fontSize: 14,
        color: 'var(--dsw-color-text-primary)',
      }}
    >
      {payload.selectType === 'groups' ? '选择群组' : '选择成员'}
    </div>
  );

  return (
    <TransferModalConsumer<EditAttendeeItem>
      title="Attendees"
      onClose={onClose}
      onConfirm={onConfirm}
      renderSearchInput={() => <EditSelectSearch />}
      renderSelectedTitle={renderSelectedTitle}
      renderRow={({ item, style, selected, type }) => (
        <ConversationItem
          key={item.id}
          style={style}
          showCheckbox={type === 'from'}
          checked={[...selected, ...disabledItems].some(u => u.id === item.id)}
          disabled={disabledList.some(d => d.id === item.id)}
          {...item}
        />
      )}
      {...props}
    />
  );
};

export const useShowEditAttendeeDialog = () => {
  const showEditAttendeeDialog = useTransferModalWithContent(EditAttendeeContent);
  return { showEditAttendeeDialog };
};

export const EditAttendeeDialog = createTranferModal(EditAttendeeContent);
