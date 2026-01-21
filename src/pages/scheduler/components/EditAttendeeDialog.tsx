import React, { useCallback, useEffect } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { uniq, uniqBy } from 'lodash';

import { useTranferModalStore } from '@/shared/TransferModal/TransferModalContext';
import { useTransferModalWithContent } from '@/shared/TransferModal/useTransferModal';
import { ConversationItem } from '@/shared/TransferModal/ConversationItem';
import { useI18n } from '@/hooks/useI18n';
import {
  createTranferModal,
  defalutSortFn,
  ModalProps,
  TransferModalConsumer,
} from '@/shared/TransferModal';
import { getRealId, isSearchMatchId } from '@/util';

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

const EditAttendeeContent = ({
  list,
  onClose,
  onConfirm,
  disabledList,
  ...props
}: ModalProps<EditAttendeeItem, { disabledList: EditAttendeeItem[] }>) => {
  const { setDataSource, setDisabledItems, disabledItems, setPayload } =
    useTranferModalStore<EditAttendeeItem>();
  const { i18n } = useI18n();
  const t = (key: string, substitutions?: string | string[]) => i18n(key as never, substitutions);

  useEffect(() => {
    unstable_batchedUpdates(() => {
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
      {payload.selectType === 'groups' ? t('groups') : t('contacts')}
    </div>
  );

  const afterSearch = useCallback(
    (
      params: {
        keyword: string;
        localItems: EditAttendeeItem[];
        remoteItems: EditAttendeeItem[];
        dataSource: EditAttendeeItem[];
      } | null
    ) => {
      if (!params) return [];
      const { keyword, dataSource } = params;
      return getExternalUser(dataSource, keyword);
    },
    []
  );

  const shouldSearchRemoteHandler = useCallback(
    ({ payload }: { payload: { selectType?: string; [key: string]: any } }) =>
      payload.selectType !== 'groups',
    []
  );

  return (
    <TransferModalConsumer<EditAttendeeItem>
      title="Attendees"
      onClose={onClose}
      onConfirm={onConfirm}
      afterSearch={afterSearch}
      shouldSearchRemote={shouldSearchRemoteHandler}
      enableTypeFilter
      defaultTypeFilter="direct"
      typeFilterOptions={[
        { value: 'direct', label: t('contacts') },
        { value: 'group', label: t('groups') },
      ]}
      typeFilterSelectTypeMap={{ direct: 'members', group: 'groups' }}
      emptySearchTip={t('searchToAddMembers')}
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
