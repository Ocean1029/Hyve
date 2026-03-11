/**
 * Hyve design system tokens — ported from ver2 web design.
 * Covers colors, shadows, border radii, and spacing.
 */
import { Platform } from 'react-native';

export const Colors = {
  // Background layers
  bg0: '#060607',
  bg1: '#0C0D10',
  bg2: '#121319',

  // Brand
  gold: '#C9A86A',
  goldDim: 'rgba(201, 168, 106, 0.4)',
  goldFaint: 'rgba(201, 168, 106, 0.1)',
  ivory: '#E6E1D8',

  // Glass surfaces
  surface1: 'rgba(255, 255, 255, 0.05)',
  surface2: 'rgba(255, 255, 255, 0.08)',
  surfaceBorder: 'rgba(255, 255, 255, 0.10)',
  glassBg: 'rgba(255, 255, 255, 0.04)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',

  // Text hierarchy
  text1: 'rgba(255, 255, 255, 0.95)',
  text2: 'rgba(255, 255, 255, 0.75)',
  text3: 'rgba(255, 255, 255, 0.45)',
  muted: 'rgba(255, 255, 255, 0.28)',

  // Semantic
  online: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  success: '#10B981',
} as const;

export const Shadows = {
  soft: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.45,
      shadowRadius: 20,
    },
    android: { elevation: 12 },
  }) ?? {},

  press: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.6,
      shadowRadius: 10,
    },
    android: { elevation: 6 },
  }) ?? {},

  gold: Platform.select({
    ios: {
      shadowColor: '#C9A86A',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
    },
    android: { elevation: 8 },
  }) ?? {},
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999,
} as const;

export const Space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;
