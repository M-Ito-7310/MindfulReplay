import React, { createContext, useContext, useState, ReactNode } from 'react';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';

export type LayoutVariant = 'default';

export interface LayoutThemeContextType {
  variant: LayoutVariant;
  setVariant: (variant: LayoutVariant) => void;
  getLayoutStyles: () => LayoutStyles;
}

export interface LayoutStyles {
  // Typography overrides
  typography: {
    fontSize: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
      xxl: number;
      xxxl: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
    fontWeight: typeof TYPOGRAPHY.FONT_WEIGHT;
  };
  
  // Spacing overrides
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
  };

  // Layout-specific styles
  layout: {
    // Form styles
    fieldSpacing: number;
    labelSpacing: number;
    formPadding: number;
    
    // Button styles
    buttonHeight: number;
    buttonSpacing: number;
    buttonBorderRadius: number;
    
    // Input styles
    inputPadding: number;
    inputBorderRadius: number;
    
    // Card styles (for card variant)
    cardSpacing: number;
    cardPadding: number;
    cardBorderRadius: number;
    
    // Container styles
    containerSpacing: number;
    sectionSpacing: number;
  };
}

const defaultLayoutStyles = (): LayoutStyles => ({
  typography: {
    fontSize: {
      xs: 10,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 20,
      xxxl: 24,
    },
    lineHeight: {
      tight: 1.1,
      normal: 1.2,
      relaxed: 1.3,
    },
    fontWeight: TYPOGRAPHY.FONT_WEIGHT,
  },
  spacing: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    xxxl: 32,
  },
  layout: {
    fieldSpacing: 12,
    labelSpacing: 4,
    formPadding: 8,
    buttonHeight: 36,
    buttonSpacing: 4,
    buttonBorderRadius: 4,
    inputPadding: 8,
    inputBorderRadius: 6,
    cardSpacing: 8,
    cardPadding: 8,
    cardBorderRadius: 6,
    containerSpacing: 8,
    sectionSpacing: 12,
  },
});


const LayoutThemeContext = createContext<LayoutThemeContextType | undefined>(undefined);

export const useLayoutTheme = (): LayoutThemeContextType => {
  const context = useContext(LayoutThemeContext);
  if (!context) {
    throw new Error('useLayoutTheme must be used within a LayoutThemeProvider');
  }
  return context;
};

interface LayoutThemeProviderProps {
  children: ReactNode;
}

export const LayoutThemeProvider: React.FC<LayoutThemeProviderProps> = ({ children }) => {
  const [variant, setVariant] = useState<LayoutVariant>('default');

  const getLayoutStyles = (): LayoutStyles => {
    return defaultLayoutStyles();
  };

  const value: LayoutThemeContextType = {
    variant,
    setVariant,
    getLayoutStyles,
  };

  return (
    <LayoutThemeContext.Provider value={value}>
      {children}
    </LayoutThemeContext.Provider>
  );
};