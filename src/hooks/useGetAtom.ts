import { Atom, PrimitiveAtom } from 'jotai';
import { useAtomCallback } from 'jotai/utils';
import { useCallback } from 'react';

export const useGetAtom = <Value extends unknown>(atom: PrimitiveAtom<Value> | Atom<Value>) => {
  return useAtomCallback(useCallback(get => get(atom), []));
};
