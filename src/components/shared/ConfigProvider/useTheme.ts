import { useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark';

const getThemeMode = (): ThemeMode => {
  const isDark = document.body.classList.contains('dark-theme');
  return isDark ? 'dark' : 'light';
};

const useTheme = () => {
  const [mode, setMode] = useState<ThemeMode>(() => getThemeMode());

  useEffect(() => {
    const handleThemeChanged = () => {
      const theme = getThemeMode();
      setMode(theme);
    };

    window.addEventListener('themeSettingChanged', handleThemeChanged);

    return () => {
      window.removeEventListener('themeSettingChanged', handleThemeChanged);
    };
  }, []);

  return mode;
};

export default useTheme;
