import { useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';

import {
  useShowEditAttendeeDialog,
  EditAttendeeItem,
} from '@/pages/scheduler/components/EditAttendeeDialog';
import { groupListAtom } from '@/atoms';
import { getUserBaseInfoSync } from '@/atoms/userInfo';
import { toastWarning } from '@/shared/Message';

export type Member = {
  going: 'maybe' | 'yes' | 'no';
  isGroupUser: boolean;
  isRemovable: boolean;
  name: string;
  role: 'host' | 'attendee';
  uid: string;
  email?: string;
  validUser?: boolean;
};

type OpenOptions = {
  disabledIds?: string[];
};

const mapSelectedToMembers = (items: EditAttendeeItem[], disabledIds: string[]) => {
  const disabledSet = new Set(disabledIds.filter(Boolean));
  const result: Member[] = [];
  let skippedGroups = 0;

  items.forEach(item => {
    if (item.type === 'group') {
      if (!item.members || item.members.length === 0) {
        skippedGroups += 1;
        return;
      }
      item.members.forEach(uid => {
        if (disabledSet.has(uid)) return;
        const info = getUserBaseInfoSync(uid);
        result.push({
          uid,
          name: info.name || uid,
          email: info.email,
          role: 'attendee',
          isGroupUser: true,
          isRemovable: true,
          going: 'maybe',
        });
      });
      return;
    }

    if (disabledSet.has(item.id)) return;
    result.push({
      uid: item.id,
      name: item.name || item.email || item.id,
      email: item.email,
      role: 'attendee',
      isGroupUser: false,
      isRemovable: true,
      going: 'maybe',
      validUser: item.validUser,
    });
  });

  if (skippedGroups > 0) {
    toastWarning('部分群组无法获取成员，已跳过');
  }

  const uniqMap = new Map<string, Member>();
  result.forEach(item => {
    if (item.uid) {
      uniqMap.set(item.uid, item);
    }
  });
  return Array.from(uniqMap.values());
};

export const useEditAttendeeDialog = () => {
  const { showEditAttendeeDialog } = useShowEditAttendeeDialog();
  const groups = useAtomValue(groupListAtom);

  const list = useMemo<EditAttendeeItem[]>(() => {
    const groupItems = groups.map(item => ({
      id: item.groupId,
      name: item.groupName,
      type: 'group' as const,
    }));
    return [...groupItems];
  }, [groups]);

  const buildDisabledList = useCallback((disabledIds: string[]) => {
    if (!disabledIds.length) return [];
    return disabledIds
      .map(id => {
        const isEmail = id.includes('@');
        return {
          id,
          ...(isEmail ? { email: id } : {}),
          name: isEmail ? id.split('@')[0] : id,
          extUser: isEmail,
          ext: isEmail,
          type: 'direct' as const,
        } as EditAttendeeItem;
      })
      .filter((item): item is EditAttendeeItem => Boolean(item));
  }, []);

  const openDialog = useCallback(
    (options: OpenOptions = {}) => {
      const disabledIds = options.disabledIds || [];
      const disabledList = buildDisabledList(disabledIds);

      return new Promise<Member[]>(resolve => {
        let resolved = false;
        showEditAttendeeDialog({
          list,
          disabledList,
          onConfirm: async ({ selected }, close) => {
            const members = mapSelectedToMembers(selected, disabledIds);
            resolved = true;
            resolve(members);
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
    [buildDisabledList, list, showEditAttendeeDialog]
  );

  return { openDialog };
};

const getDisabledIds = (members: Array<{ uid?: string; email?: string }>) =>
  members.map(item => item.uid || item.email).filter((value): value is string => Boolean(value));

export const mergeMembersUniq = (members: Member[], newMembers: Member[]) => {
  const merged = [...members, ...newMembers];
  const uniqMap = new Map<string, Member>();
  merged.forEach(item => {
    if (item.uid) {
      uniqMap.set(item.uid, item);
    }
  });
  return Array.from(uniqMap.values());
};

export const useAddMembersDialog = () => {
  const { openDialog } = useEditAttendeeDialog();

  const openForMembers = async (members: Array<{ uid?: string; email?: string }>) => {
    const disabledIds = getDisabledIds(members);
    return openDialog({ disabledIds });
  };

  return { openForMembers, mergeMembersUniq };
};
