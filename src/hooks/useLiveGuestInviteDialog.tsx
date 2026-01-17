import { useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';

import {
  useShowEditLiveGuestDialog,
  GuestInviteItem,
} from '@/pages/scheduler/components/GuestInviteModal';
import { groupListAtom } from '@/atoms';
import { isBotId } from '@/util';

type OpenOptions = {
  disabledIds?: string[];
};

const normalizeList = (
  groups: Array<{ groupId: string; groupName: string }>
): GuestInviteItem[] => {
  const groupItems = groups.map(item => ({
    id: item.groupId,
    name: item.groupName,
    type: 'group' as const,
  }));
  return groupItems;
};

const buildDisabledList = (list: GuestInviteItem[], disabledIds: string[]) => {
  if (!disabledIds.length) return [];
  const map = new Map(list.map(item => [item.id, item]));
  return disabledIds
    .map(id => map.get(id) || ({ id, type: 'direct' as const } as GuestInviteItem))
    .filter(Boolean);
};

const normalizeSelectedGuests = (selected: GuestInviteItem[]) => {
  const result: string[] = [];
  selected.forEach(item => {
    if (item.type === 'group') {
      item.members?.forEach(uid => {
        if (!isBotId(uid)) {
          result.push(uid);
        }
      });
      return;
    }
    if (!isBotId(item.id)) {
      result.push(item.id);
    }
  });
  return Array.from(new Set(result));
};

export const useLiveGuestInviteDialog = () => {
  const { showEditLiveGuestDialog } = useShowEditLiveGuestDialog();
  const groups = useAtomValue(groupListAtom);

  const list = useMemo(() => normalizeList(groups), [groups]);

  const openDialog = useCallback(
    (options: OpenOptions = {}) => {
      const disabledIds = options.disabledIds || [];
      const disabledList = buildDisabledList(list, disabledIds);

      return new Promise<string[]>(resolve => {
        let resolved = false;
        showEditLiveGuestDialog({
          list,
          disabledList,
          onConfirm: async ({ selected }, close) => {
            const guests = normalizeSelectedGuests(selected);
            resolved = true;
            resolve(guests);
            close();
          },
          afterClose: () => {
            if (!resolved) {
              resolve([]);
            }
          },
        });
      });
    },
    [list, showEditLiveGuestDialog]
  );

  return { openDialog };
};
