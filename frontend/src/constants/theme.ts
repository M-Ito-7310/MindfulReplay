// Color Palette
export const COLORS = {
  // Primary colors
  PRIMARY: '#3498db',
  PRIMARY_DARK: '#2980b9',
  PRIMARY_LIGHT: '#5dade2',
  
  // Secondary colors
  SECONDARY: '#e74c3c',
  SECONDARY_DARK: '#c0392b',
  SECONDARY_LIGHT: '#ec7063',
  
  // Neutral colors
  WHITE: '#ffffff',
  BLACK: '#000000',
  GRAY_50: '#f9f9f9',
  GRAY_100: '#f8f9fa',
  GRAY_200: '#e9ecef',
  GRAY_300: '#dee2e6',
  GRAY_400: '#ced4da',
  GRAY_500: '#adb5bd',
  GRAY_600: '#6c757d',
  GRAY_700: '#495057',
  GRAY_800: '#343a40',
  GRAY_900: '#212529',
  
  // Status colors
  SUCCESS: '#27ae60',
  WARNING: '#f39c12',
  ERROR: '#e74c3c',
  INFO: '#3498db',
  
  // Background colors
  BACKGROUND: '#f8f9fa',
  SURFACE: '#ffffff',
  CARD: '#ffffff',
  
  // Text colors
  TEXT_PRIMARY: '#2c3e50',
  TEXT_SECONDARY: '#7f8c8d',
  TEXT_MUTED: '#95a5a6',
  TEXT_INVERSE: '#ffffff',
};

// Typography
export const TYPOGRAPHY = {
  FONT_FAMILY: {
    REGULAR: 'System',
    MEDIUM: 'System',
    BOLD: 'System',
  },
  FONT_SIZE: {
    XS: 12,
    SM: 14,
    MD: 16,
    LG: 18,
    XL: 20,
    XXL: 24,
    XXXL: 32,
  },
  LINE_HEIGHT: {
    TIGHT: 1.2,
    NORMAL: 1.4,
    RELAXED: 1.6,
  },
  FONT_WEIGHT: {
    LIGHT: '300' as const,
    NORMAL: '400' as const,
    MEDIUM: '500' as const,
    SEMIBOLD: '600' as const,
    BOLD: '700' as const,
  },
};

// Spacing
export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
  XXXL: 64,
};

// Border Radius
export const BORDER_RADIUS = {
  NONE: 0,
  SM: 4,
  MD: 8,
  LG: 12,
  XL: 16,
  FULL: 9999,
};

// Shadows
export const SHADOWS = {
  SMALL: {
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  MEDIUM: {
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  LARGE: {
    shadowColor: COLORS.BLACK,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.32,
    shadowRadius: 5.46,
    elevation: 9,
  },
};

// Animation durations
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};