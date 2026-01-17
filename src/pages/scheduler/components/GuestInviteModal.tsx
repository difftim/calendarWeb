import React, { ReactNode, useEffect, useState } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { Flex } from 'antd';

import { useTranferModalStore } from '@/shared/TransferModal/TransferModalContext';
import { useTransferModalWithContent } from '@/shared/TransferModal/useTransferModal';
import { useI18n } from '@/hooks/useI18n';
import {
  createTranferModal,
  defalutSortFn,
  defaultIsSearchMatch,
  ModalProps,
  TransferModalConsumer,
} from '@/shared/TransferModal';
import { SearchInput } from '@/shared/Input';
import Select from '@/shared/Select';
import { ConversationItem } from '@/shared/SimpleComponent';

export type GuestInviteItem = {
  id: string;
  type: 'group' | 'direct';
  name?: string;
  members?: string[];
  activeAt?: number;
  email?: string;
  isMe?: boolean;
  timestamp?: number;
  avatarPath?: string;
};

const EditSelectSearch = () => {
  const primaryColor = 'var(--dsw-color-text-primary)';
  const { dataSource, searchText, setSearchText, setPayload, setLeftItems, setNoResult } =
    useTranferModalStore<GuestInviteItem>();
  const { i18n } = useI18n();
  const t = (key: string, substitutions?: string | string[]) => i18n(key as never, substitutions);
  const [type, setType] = useState<'direct' | 'group'>('direct');

  const options = [
    { value: 'group', label: '群组' },
    { value: 'direct', label: '联系人' },
  ];

  useEffect(() => {
    let sources = dataSource.filter(item => item.type === type);
    if (searchText) {
      sources = sources.filter(u => defaultIsSearchMatch(u, searchText));
    }
    unstable_batchedUpdates(() => {
      if (!sources.length && searchText) {
        setNoResult(<Flex justify="center">{t('noSearchResults', [searchText])}</Flex>);
      } else if (!sources.length && !searchText) {
        setNoResult(<Flex justify="center">{t('searchToAddGuests')}</Flex>);
      } else {
        setNoResult(null);
      }
      setLeftItems(sources);
    });
  }, [type, searchText, dataSource]);

  const onChange = (selectType: 'direct' | 'group') => {
    unstable_batchedUpdates(() => {
      setType(selectType);
      setPayload({
        selected: [],
        selectType,
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
      placeholder={t('search')}
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
            options={options}
            value={type}
            onChange={onChange}
          />
          <div className="search-icon" />
        </Flex>
      }
    />
  );
};

const EditLiveGuestContent = ({
  list,
  onClose,
  onConfirm,
  disabledList,
  ...props
}: ModalProps<GuestInviteItem, { disabledList: GuestInviteItem[] }>) => {
  const { setDataSource, setDisabledItems, disabledItems, setPayload } =
    useTranferModalStore<GuestInviteItem>();

  useEffect(() => {
    unstable_batchedUpdates(() => {
      setDataSource(defalutSortFn(list));
      setDisabledItems(disabledList);
      setPayload(v => ({ ...v, selectType: 'group' }));
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
      {payload.selectType === 'group' ? 'Selected groups' : 'Selected guests'}
    </div>
  );

  return (
    <TransferModalConsumer<GuestInviteItem>
      title="Guests"
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

export const useShowEditLiveGuestDialog = () => {
  const showEditLiveGuestDialog = useTransferModalWithContent(EditLiveGuestContent);
  return { showEditLiveGuestDialog };
};

export const EditLiveGuestModal = createTranferModal(EditLiveGuestContent);
