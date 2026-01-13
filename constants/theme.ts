/**
 * CIVICA Theme System
 * Modern, clean interface with blue primary colors
 */

import { Platform } from 'react-native';

// Brand Colors
export const Brand = {
  primary: '#2563EB',      // Blue 600
  primaryDark: '#1E40AF',  // Blue 800
  primaryLight: '#3B82F6', // Blue 500
  accent: '#0EA5E9',       // Sky 500
  success: '#10B981',      // Emerald 500
  warning: '#F59E0B',      // Amber 500
  error: '#EF4444',        // Red 500
  info: '#6366F1',         // Indigo 500
};

// Category Colors
export const CategoryColors = {
  report: '#EF4444',      // Red for reports/issues
  promotion: '#10B981',   // Green for business/promotions
  news: '#3B82F6',        // Blue for news/info
  general: '#6B7280',     // Gray for general
};

// Severity Colors (for reports)
export const SeverityColors = {
  low: '#10B981',         // Green
  medium: '#F59E0B',      // Amber
  high: '#EF4444',        // Red
  critical: '#7C2D12',    // Deep red
};

// Status Colors
export const StatusColors = {
  active: '#3B82F6',      // Blue
  verified: '#10B981',    // Green
  resolved: '#6B7280',    // Gray
  closed: '#9CA3AF',      // Light gray
};

// Level Badge Colors
export const LevelColors = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  diamond: '#B9F2FF',
};

// Theme Colors
export const Colors = {
  light: {
    // Base
    text: '#111827',           // Gray 900
    textSecondary: '#6B7280',  // Gray 500
    textMuted: '#9CA3AF',      // Gray 400
    background: '#F3F4F6',     // Gray 100
    surface: '#FFFFFF',        // White
    surfaceSecondary: '#F9FAFB', // Gray 50

    // Interactive
    tint: Brand.primary,
    icon: '#6B7280',
    tabIconDefault: '#6B7280',
    tabIconSelected: Brand.primary,

    // Borders
    border: '#E5E7EB',         // Gray 200
    borderLight: '#F3F4F6',    // Gray 100

    // Shadows
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowStrong: 'rgba(0, 0, 0, 0.15)',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
  },
  dark: {
    // Base
    text: '#F9FAFB',           // Gray 50
    textSecondary: '#9CA3AF',  // Gray 400
    textMuted: '#6B7280',      // Gray 500
    background: '#111827',     // Gray 900
    surface: '#1F2937',        // Gray 800
    surfaceSecondary: '#374151', // Gray 700

    // Interactive
    tint: '#60A5FA',           // Blue 400
    icon: '#9CA3AF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#60A5FA',

    // Borders
    border: '#374151',         // Gray 700
    borderLight: '#1F2937',    // Gray 800

    // Shadows
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowStrong: 'rgba(0, 0, 0, 0.5)',

    // Overlays
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.5)',
  },
};

// Spacing Scale
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

// Border Radius
export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
};

// Font Sizes
export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
};

// Font Weights (as strings for RN)
export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Font Families
export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    mono: 'Menlo',
  },
  android: {
    sans: 'Roboto',
    serif: 'serif',
    mono: 'monospace',
  },
  default: {
    sans: 'System',
    serif: 'serif',
    mono: 'monospace',
  },
});

// Shadows
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

// Z-Index Scale
export const ZIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
};
