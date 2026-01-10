import React from 'react';
import { merge, pickBy } from 'lodash';
import { ConfigProvider as AntdConfigProvider } from 'antd';
import { theme } from 'antd';

import type { ConfigProviderProps, ThemeConfig } from 'antd/es/config-provider';
import useTheme from './useTheme';
import { AliasToken } from 'antd/es/theme/interface';

const tokens = {
  // Light theme colors
  dswColorBackground1Light: '#ffffff',
  dswColorBackground2Light: '#f5f5f5',
  dswColorBackground4Light: '#e8e8e8',
  dswColorBackgroundModalLight: '#ffffff',
  dswColorBackgroundPopupLight: '#ffffff',
  dswColorBackgroundDisableLight: '#f0f0f0',
  dswColorBackgroundTooltipLight: 'rgba(0, 0, 0, 0.85)',
  dswColorTextPrimaryLight: '#000000',
  dswColorTextThirdLight: '#666666',
  dswColorTextDisableLight: '#999999',
  dswColorTextInfoLight: '#056ffa',
  dswColorLineLight: '#d9d9d9',
  dswColorPrimaryLight: '#056ffa',

  // Dark theme colors
  dswColorBackground1Dark: '#1f1f1f',
  dswColorBackground2Dark: '#2a2a2a',
  dswColorBackground4Dark: '#3a3a3a',
  dswColorBackgroundModalDark: '#2a2a2a',
  dswColorBackgroundPopupDark: '#2a2a2a',
  dswColorBackgroundDisableDark: '#333333',
  dswColorBackgroundTooltipDark: 'rgba(255, 255, 255, 0.85)',
  dswColorTextPrimaryDark: '#ffffff',
  dswColorTextThirdDark: '#999999',
  dswColorTextDisableDark: '#666666',
  dswColorTextInfoDark: '#378cfb',
  dswColorLineDark: '#444444',
  dswColorPrimaryDark: '#378cfb',

  // Z-index values
  dswZindexDropdown: '1050',
  dswZindexPopover: '1060',
};

// special for brand color, global variable
// not theme-able, use it as a constant
const BRAND_COLOR = '#056ffa';
const HOVER_COLOR = '#378cfb';

const antdAlgoMap: Record<'light' | 'dark' | 'default', (...args: any) => Partial<AliasToken>> = {
  dark: theme.darkAlgorithm,
  light: theme.defaultAlgorithm,
  default: theme.defaultAlgorithm,
};

type Props = {} & ConfigProviderProps & {
    themeConfig?: ThemeConfig;
    isIOSTheme?: boolean;
    isLightlyDisableMode?: boolean;
    forceUseTheme?: 'dark' | 'light';
  };

type KeyOfColors = keyof typeof tokens;

type GetColorParam<T extends string> = T extends `${infer R}Light`
  ? R
  : T extends `${infer P}Dark`
    ? P
    : never;

export const getZIndexToken = (tokenName: string): number | undefined => {
  const dswZindex = pickBy(tokens, (_, key) => key.startsWith('dswZindex'));
  const dswZindexNumber = Object.fromEntries(
    Object.entries(dswZindex).map(([key, value]) => [key, Number(value)])
  );
  if (tokenName in dswZindexNumber) {
    return dswZindexNumber[tokenName];
  }

  return undefined;
};

const capitalizeFirstLetter = (str?: string) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

const complete = (mode?: 'dark' | 'light') => (colorName: string) => {
  const tokenName = `${colorName}${capitalizeFirstLetter(mode)}` as KeyOfColors;

  return tokenName;
};

export const getColorByMode = (mode?: 'dark' | 'light') => (token: GetColorParam<KeyOfColors>) => {
  return tokens[complete(mode)(token)];
};

export const useGetColor = () => {
  const mode = useTheme();
  const getColor = getColorByMode(mode);

  return {
    getColor,
  };
};

export default function ConfigProvider(props: Props) {
  const mode = useTheme();
  const getColor = (token: GetColorParam<KeyOfColors>) =>
    tokens[complete(props.forceUseTheme || mode)(token)];

  let { themeConfig = {}, isIOSTheme, isLightlyDisableMode, ...rest } = props;

  if (isLightlyDisableMode) {
    themeConfig = merge<ThemeConfig, ThemeConfig>(
      {
        components: {
          Input: {
            colorBgContainerDisabled: getColor('dswColorBackground2'),
          },
          Select: {
            colorBgContainerDisabled: getColor('dswColorBackground2'),
          },
          DatePicker: {
            colorBgContainerDisabled: getColor('dswColorBackground2'),
          },
          Button: {
            colorBgContainerDisabled: getColor('dswColorBackground1'),
            borderColorDisabled: getColor('dswColorTextDisable'),
          },
        },
      },
      themeConfig
    );
  }

  return (
    <AntdConfigProvider
      theme={merge<ThemeConfig, ThemeConfig>(
        {
          algorithm: antdAlgoMap[mode || 'default'] as any,
          token: {
            colorPrimary: BRAND_COLOR,
            colorBorder: getColor('dswColorLine'),
            controlOutline: getColor('dswColorLine'),
            colorBgContainer: getColor('dswColorBackground1'),
            colorBgElevated: getColor('dswColorBackgroundPopup'),
            colorBgContainerDisabled: getColor('dswColorBackgroundDisable'),
            colorTextDisabled: getColor('dswColorTextDisable'),
            // @ts-ignore
            defaultGhostBorderColor: getColor('dswColorLine'),
            defaultGhostColor: getColor('dswColorTextPrimary'),
          },

          components: {
            Checkbox: {
              borderRadiusSM: 2,
              colorBorder: getColor('dswColorTextDisable'),
              colorBgContainer: 'transparent',
              colorBgContainerDisabled: getColor('dswColorBackgroundDisable'),
            },

            Radio: {
              colorBgContainer: 'transparent',
              buttonBg: 'transparent',
              buttonCheckedBg: getColor('dswColorPrimary'),
              buttonCheckedBgDisabled: getColor('dswColorBackgroundDisable'),
              buttonCheckedColorDisabled: getColor('dswColorTextDisable'),
              buttonColor: getColor('dswColorTextPrimary'),
            },

            Button: {
              fontSizeLG: 14,
              colorText: getColor('dswColorTextPrimary'),
              colorBorder: getColor('dswColorLine'),
              colorBgContainer: getColor('dswColorBackground1'),
              colorPrimary: getColor('dswColorPrimary'),
              colorBgContainerDisabled: getColor('dswColorBackgroundDisable'),
              colorPrimaryHover: HOVER_COLOR,
              dangerShadow: 'none',
              defaultShadow: 'none',
              primaryShadow: 'none',
              defaultBg: 'transparent',
              colorLink: getColor('dswColorTextInfo'),
              colorTextDisabled: getColor('dswColorTextDisable'),
              defaultGhostBorderColor: getColor('dswColorLine'),
              defaultGhostColor: getColor('dswColorTextPrimary'),
              borderRadiusSM: 4,
            },

            Tooltip: {
              colorBgSpotlight: getColor('dswColorBackgroundTooltip'),
            },

            DatePicker: {
              borderRadiusLG: 4,
              borderRadius: 4,
              fontSizeLG: 14,
              cellBgDisabled: getColor('dswColorBackgroundDisable'),
            },

            Input: {
              hoverBorderColor: HOVER_COLOR,
              colorBgContainer: getColor('dswColorBackground1'),
              colorBorder: getColor('dswColorLine'),
              colorPrimaryActive: getColor('dswColorPrimary'),
              colorText: getColor('dswColorTextPrimary'),
              borderRadiusLG: 4,
              borderRadius: 4,
              fontSizeLG: 14,
            },

            Select: {
              borderRadiusLG: 4,
              fontSizeLG: 14,
              colorPrimaryHover: HOVER_COLOR,
              colorBgElevated: getColor('dswColorBackgroundModal'),
              optionActiveBg: getColor('dswColorBackground4'),
              optionSelectedColor: getColor('dswColorTextInfo'),
              optionSelectedBg: 'none',
              ...(isIOSTheme && { colorText: getColor('dswColorTextThird') }),
            },

            Calendar: {
              itemActiveBg: getColor('dswColorPrimary'),
              borderRadiusSM: '50%' as any,
              fontSize: 12,
              colorBgContainerDisabled: 'none',
              colorTextDisabled: getColor('dswColorTextDisable'),
              miniContentHeight: 200,
            },

            Collapse: {
              headerPadding: '12px 0',
              contentPadding: '0 12px',
              paddingSM: 0,
            },

            Dropdown: {
              zIndexPopup: getZIndexToken('dswZindexDropdown'),
            },
            Popover: {
              borderRadiusLG: 4,
              colorBgElevated: getColor('dswColorBackgroundPopup'),
              zIndexPopup: getZIndexToken('dswZindexPopover'),
            },
          },
        },
        themeConfig
      )}
      {...rest}
    ></AntdConfigProvider>
  );
}

export { useTheme };
