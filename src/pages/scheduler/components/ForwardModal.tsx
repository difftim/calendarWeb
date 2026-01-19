import React, { useCallback, useEffect } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { uniqBy } from 'lodash';

import { useTranferModalStore } from '@/shared/TransferModal/TransferModalContext';
import { useTransferModalWithContent } from '@/shared/TransferModal/useTransferModal';
import {
  createTranferModal,
  defalutSortFn,
  defaultIsSearchMatch,
  ModalProps,
  TransferModalConsumer,
} from '@/shared/TransferModal';
import { ConversationItem } from '@/shared/SimpleComponent';

export type ForwardModalItem = {
  id: string;
  type: 'group' | 'direct';
  name?: string;
  members?: string[];
  email?: string;
  avatarPath?: string;
  isMe?: boolean;
};

const normalizeRemoteItems = (items: ForwardModalItem[]) =>
  items.map(item => ({ ...item, type: 'direct' as const }));

const getLocalMatches = (list: ForwardModalItem[], keyword: string) => {
  if (!keyword) return [];
  const matches = list.filter(item => defaultIsSearchMatch(item, keyword));
  return defalutSortFn(matches);
};

const ForwardModalContent = ({
  list,
  onClose,
  onConfirm,
  disabledList = [],
  ...props
}: ModalProps<ForwardModalItem, { disabledList?: ForwardModalItem[] }>) => {
  const { setDataSource, setDisabledItems, disabledItems } =
    useTranferModalStore<ForwardModalItem>();

  useEffect(() => {
    unstable_batchedUpdates(() => {
      setDataSource(defalutSortFn(list));
      setDisabledItems(disabledList);
    });
  }, [list, disabledList]);

  const afterSearch = useCallback(
    (
      params: {
        keyword: string;
        remoteItems: ForwardModalItem[];
      } | null
    ) => {
      if (!params) return [];
      const { keyword, remoteItems } = params;
      const localMatches = getLocalMatches(list, keyword);
      return uniqBy([...normalizeRemoteItems(remoteItems), ...localMatches], item => item.id);
    },
    [list]
  );

  return (
    <TransferModalConsumer<ForwardModalItem>
      title="Share livestream to"
      onClose={onClose}
      onConfirm={onConfirm}
      afterSearch={afterSearch}
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

export const useShowForwardModal = () => {
  const showForwardModal = useTransferModalWithContent(ForwardModalContent);
  return { showForwardModal };
};

export const ForwardModal = createTranferModal(ForwardModalContent);
