import { useCallback, useLayoutEffect, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { themeAtom } from '@/atoms';
import { getUserBgColor } from '@/util';

export type ThemeMode = 'light' | 'dark';

const useTheme = () => {
  const mode = useAtomValue(themeAtom);

  // 同步更新 body class
  useLayoutEffect(() => {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(mode === 'dark' ? 'dark-theme' : 'light-theme');
  }, [mode]);

  return mode;
};

export const useGetEventColors = () => {
  const mode = useTheme();
  const { checkBoxBg, eventBg, textColor } = useMemo(() => getUserBgColor(mode), [mode]);
  const getEventColor = useCallback(
    (calendars: any[], isListView: boolean = false) => {
      return calendars.reduce((sum, item, index) => {
        sum[item.id] = {
          bgColor: isListView ? checkBoxBg[index] : eventBg[index],
          color: textColor[index],
        };
        return sum;
      }, {});
    },
    [checkBoxBg, eventBg, textColor]
  );
  return { getEventColor };
};

export default useTheme;
