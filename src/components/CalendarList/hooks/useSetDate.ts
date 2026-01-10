import { useCallback } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { useAtom } from 'jotai';
import { Dayjs } from 'dayjs';
import { dateAtom, showDateAtom } from '@/atoms';

export const useSetDate = () => {
  const [date, setRealDate] = useAtom(dateAtom);
  const [showDate, setShowDate] = useAtom(showDateAtom);
  const setDate = useCallback(
    (d: Dayjs) => {
      unstable_batchedUpdates(() => {
        d = d.startOf('day');
        setRealDate(d);
        setShowDate(d);
      });
    },
    [setRealDate, setShowDate]
  );

  return {
    date,
    setDate,
    showDate,
    setShowDate,
  };
};
