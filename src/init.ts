import { getGroups, getTheme, callBridgeMethod } from '@difftim/jsbridge-utils';

import { appNameAtom, groupListAtom, themeAtom } from '@/atoms';
import { store } from '@/atoms/store';

const applyThemeMode = (mode: 'light' | 'dark') => {
  document.body.classList.remove('light-theme', 'dark-theme');
  document.body.classList.add(mode === 'dark' ? 'dark-theme' : 'light-theme');
};

const initTheme = async () => {
  try {
    const theme = await getTheme();
    const mode = theme === 'dark' ? 'dark' : 'light';
    applyThemeMode(mode);
    store.set(themeAtom, mode);
  } catch {
    store.set(themeAtom, 'light');
  }
};

const initGroups = async () => {
  try {
    const groups = await getGroups();
    store.set(groupListAtom, groups);
  } catch {
    store.set(groupListAtom, []);
  }
};

const initAppName = async () => {
  try {
    const appInfo = await callBridgeMethod<{}, { client: string }>('getClientName', {});
    if (appInfo.client) {
      store.set(appNameAtom, appInfo.client);
    }
  } catch (e) {
    console.log('initAppName error', e);
  }
};

export const initApp = async () => {
  await initTheme();
  await Promise.allSettled([initGroups(), initAppName()]);
};
