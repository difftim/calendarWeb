import { useCallback, useLayoutEffect, useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { themeModeAtom } from '@/atoms';
import { getUserBgColor } from '@/util';

export type ThemeMode = 'light' | 'dark';

const useTheme = () => {
  const themeMode = useAtomValue(themeModeAtom);

  useLayoutEffect(() => {
    if (themeMode.state === 'hasData') {
      const theme = themeMode.data;
      document.body.classList.replace(
        'light-theme',
        theme === 'dark' ? 'dark-theme' : 'light-theme'
      );
    }
  }, [themeMode]);

  const mode = useMemo(() => {
    if (themeMode.state === 'hasData') {
      return themeMode.data === 'dark' ? 'dark' : 'light';
    }
    return 'light';
  }, [themeMode]);

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
