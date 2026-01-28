import { useCallback, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { uniqBy } from 'lodash';

import {
  useShowEditAttendeeDialog,
  EditAttendeeItem,
} from '@/pages/scheduler/components/EditAttendeeDialog';
import { groupListAtom } from '@/atoms';
import { toastWarning } from '@/shared/Message';
import { getUserEmail } from '@/api';

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

const mapSelectedToMembers = async (
  items: EditAttendeeItem[],
  disabledList: EditAttendeeItem[]
): Promise<Member[]> => {
  if (items.some(item => item.type === 'group')) {
    toastWarning('暂不支持添加群组');
    return [];
  }

  let result: Member[] = [];

  let appUsers = items.filter(user => Boolean(!user.extUser && user.id));
  let externalUsers = items.filter(user => Boolean(user.extUser && user.id));

  result.push(
    ...appUsers.map(item => ({
      ...item,
      uid: item.id,
      role: 'attendee' as const,
      going: 'maybe' as const,
      name: item.name || item.id,
      isRemovable: true,
      isGroupUser: false,
    }))
  );

  if (externalUsers.length > 0) {
    try {
      const data = await getUserEmail(externalUsers.map(item => item.id));
      result.push(
        ...data.map((info: any) => ({
          ...info,
          role: 'attendee' as const,
          going: 'maybe' as const,
          name: info.name || info.id,
          validUser: info.validUser,
          extUser: true,
          isRemovable: true,
          isGroupUser: false,
        }))
      );
    } catch (error) {
      externalUsers = [];
    }
  }

  return uniqBy(
    result.filter(item => !disabledList.some(disabled => disabled.id === item.uid)),
    item => item.uid
  ) as any;
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
            const members = await mapSelectedToMembers(selected, disabledList);
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
