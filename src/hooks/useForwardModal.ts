import { useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';

import { groupListAtom } from '@/atoms';
import { ForwardModalItem, useShowForwardModal } from '@/pages/scheduler/components/ForwardModal';
import { OnConfirm } from '@/shared/TransferModal';

type OpenOptions = {
  onConfirm: OnConfirm<ForwardModalItem>;
  disabledIds?: string[];
  afterClose?: () => void;
  zIndex?: number;
};

const normalizeList = (groups: Array<{ groupId: string; groupName: string }>) =>
  groups.map(item => ({
    id: item.groupId,
    name: item.groupName,
    type: 'group' as const,
    isMe: false,
  }));

const buildDisabledList = (list: ForwardModalItem[], disabledIds: string[]) => {
  if (!disabledIds.length) return [];
  const map = new Map(list.map(item => [item.id, item]));
  return disabledIds
    .map(id => map.get(id) || ({ id, type: 'direct' as const } as ForwardModalItem))
    .filter(Boolean);
};

export const useForwardModal = () => {
  const { showForwardModal } = useShowForwardModal();
  const groups = useAtomValue(groupListAtom);
  const list = useMemo(() => normalizeList(groups), [groups]);

  const openDialog = useCallback(
    (options: OpenOptions) => {
      const disabledIds = options.disabledIds || [];
      const disabledList = buildDisabledList(list, disabledIds);
      showForwardModal({
        list,
        disabledList,
        onConfirm: options.onConfirm,
        afterClose: options.afterClose,
        zIndex: options.zIndex,
      });
    },
    [list, showForwardModal]
  );

  return { showForwardModal: openDialog };
};
