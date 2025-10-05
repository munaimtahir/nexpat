import { DefaultTheme, MD3LightTheme } from 'react-native-paper';
import { colors } from './colors';
import { typography } from './typography';
import { elevations } from './elevations';
import { surfaces } from './surfaces';

export const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    surface: colors.surface,
    background: colors.background
  },
  fonts: {
    displayLarge: {
      fontSize: typography.display.fontSize,
      fontWeight: typography.display.fontWeight,
      lineHeight: typography.display.lineHeight,
      letterSpacing: typography.display.letterSpacing
    },
    titleLarge: {
      fontSize: typography.title.fontSize,
      fontWeight: typography.title.fontWeight,
      lineHeight: typography.title.lineHeight,
      letterSpacing: typography.title.letterSpacing
    },
    bodyLarge: {
      fontSize: typography.body.fontSize,
      fontWeight: typography.body.fontWeight,
      lineHeight: typography.body.lineHeight,
      letterSpacing: typography.body.letterSpacing
    }
  }
};

export const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    notification: colors.primary
  }
};

export const designSystem = {
  colors,
  typography,
  elevations,
  surfaces
};

export type DesignSystem = typeof designSystem;
