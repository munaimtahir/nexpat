import { DefaultTheme, configureFonts, MD3LightTheme } from 'react-native-paper';
import { colors } from './colors';

const fontConfig = {
  default: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '600' as const
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300' as const
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '200' as const
    }
  }
};

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    surface: colors.surface,
    background: colors.background
  },
  fonts: configureFonts({ config: fontConfig })
};

export const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border
  }
};
