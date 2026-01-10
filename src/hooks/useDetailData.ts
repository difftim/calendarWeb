import { useCallback, useMemo } from 'react';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { DetailData, INITIAL_DETAIL_DATA, schedulerDataAtom } from '@/atoms/detail';
import { loadable } from 'jotai/utils';

export const useSetDetailData = () => {
  const setSchedulerDataAsync = useSetAtom(schedulerDataAtom);
  const setSchedulerDataEager = useSetAtom(
    useMemo(
      () =>
        atom(
          null,
          async (
            get,
            set,
            data: Partial<DetailData> | ((prevData: DetailData) => Partial<DetailData>)
          ) => {
            const prevData = await get(schedulerDataAtom);
            if (typeof data === 'function') {
              data = data(prevData);
            }
            if (data.loading) {
              set(schedulerDataAtom, data as DetailData);
            } else {
              set(schedulerDataAtom, {
                ...prevData,
                ...data,
                loading: false,
              });
            }
          }
        ),
      [schedulerDataAtom]
    )
  );

  return useCallback(
    (
      data:
        | Promise<DetailData>
        | Partial<DetailData>
        | ((prevData: DetailData) => Partial<DetailData>)
    ) => {
      if (data instanceof Promise) {
        setSchedulerDataAsync(data);
      } else {
        setSchedulerDataEager(data);
      }
    },
    [setSchedulerDataAsync, setSchedulerDataEager]
  );
};

export const useResetDetailData = () => {
  const setSchedulerDataAsync = useSetAtom(schedulerDataAtom);
  return () => {
    setSchedulerDataAsync(INITIAL_DETAIL_DATA);
  };
};

export const useLoadableDetailData = () => {
  const detailDataAtom = useMemo(() => loadable(schedulerDataAtom), [schedulerDataAtom]);
  return useAtomValue(detailDataAtom);
};

export const useDetailDataValue = () => {
  return useAtomValue(schedulerDataAtom);
};
