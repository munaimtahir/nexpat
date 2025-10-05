import { Platform } from 'react-native';

const shadow = (elevation: number) => ({
  shadowColor: '#0F172A',
  shadowOpacity: Platform.OS === 'ios' ? 0.12 : 0.18,
  shadowOffset: { width: 0, height: Math.max(1, Math.floor(elevation / 2)) },
  shadowRadius: elevation,
  elevation
});

export const elevations = {
  level1: shadow(4),
  level2: shadow(8),
  level3: shadow(12)
};

export type ElevationTokens = typeof elevations;
