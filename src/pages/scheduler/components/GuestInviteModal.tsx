import React, { useCallback, useEffect } from 'react';
import { unstable_batchedUpdates } from 'react-dom';

import { useTranferModalStore } from '@/shared/TransferModal/TransferModalContext';
import { useTransferModalWithContent } from '@/shared/TransferModal/useTransferModal';
import {
  createTranferModal,
  defalutSortFn,
  ModalProps,
  TransferModalConsumer,
} from '@/shared/TransferModal';
import { ConversationItem } from '@/shared/SimpleComponent';
import { useI18n } from '@/hooks/useI18n';

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

const EditLiveGuestContent = ({
  list,
  onClose,
  onConfirm,
  disabledList,
  ...props
}: ModalProps<GuestInviteItem, { disabledList: GuestInviteItem[] }>) => {
  const { setDataSource, setDisabledItems, disabledItems, setPayload } =
    useTranferModalStore<GuestInviteItem>();
  const { i18n } = useI18n();
  const t = (key: string, substitutions?: string | string[]) => i18n(key as never, substitutions);

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
      {payload.selectType === 'group' ? t('groups') : t('contacts')}
    </div>
  );

  const shouldSearchRemoteHandler = useCallback(
    ({ payload }: { payload: { selectType?: string; [key: string]: any } }) =>
      payload.selectType !== 'group',
    []
  );

  return (
    <TransferModalConsumer<GuestInviteItem>
      title="Guests"
      onClose={onClose}
      onConfirm={onConfirm}
      shouldSearchRemote={shouldSearchRemoteHandler}
      enableTypeFilter
      defaultTypeFilter="direct"
      typeFilterOptions={[
        { value: 'group', label: t('groups') },
        { value: 'direct', label: t('contacts') },
      ]}
      typeFilterSelectTypeMap={{ direct: 'direct', group: 'group' }}
      emptySearchTip={t('searchToAddGuests')}
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
