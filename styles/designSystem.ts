
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

/**
 * DESIGN SYSTEM - 2025 Premium Product
 * 
 * Philosophy:
 * - Modern, minimal, and premium
 * - Clear visual hierarchy
 * - Excellent readability
 * - Calm but confident
 * - Scalable and consistent
 */

// ============================================
// COLOR PALETTE
// ============================================

export const designColors = {
  // Primary Brand Colors
  primary: '#2784F5',        // Blue - Main brand color
  primaryLight: '#4A9FF7',   // Lighter blue for hover states
  primaryDark: '#1E6BD4',    // Darker blue for pressed states
  primaryBg: '#EFF6FF',      // Very light blue for backgrounds
  
  secondary: '#F5AD27',      // Orange - Accent color
  secondaryLight: '#F7BD4D', // Lighter orange
  secondaryDark: '#D99820',  // Darker orange
  secondaryBg: '#FFF8E7',    // Very light orange for backgrounds
  
  // Neutral Colors (Light Mode)
  light: {
    background: '#FFFFFF',
    backgroundSecondary: '#F8FAFC',
    backgroundTertiary: '#F1F5F9',
    surface: '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    
    text: '#0F172A',           // Primary text
    textSecondary: '#475569',  // Secondary text
    textTertiary: '#94A3B8',   // Tertiary text / placeholders
    
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    divider: '#E2E8F0',
    
    overlay: 'rgba(15, 23, 42, 0.5)',
    overlayLight: 'rgba(15, 23, 42, 0.1)',
    
    shadow: 'rgba(15, 23, 42, 0.08)',
    shadowMedium: 'rgba(15, 23, 42, 0.12)',
    shadowStrong: 'rgba(15, 23, 42, 0.16)',
  },
  
  // Neutral Colors (Dark Mode)
  dark: {
    background: '#0F172A',
    backgroundSecondary: '#1E293B',
    backgroundTertiary: '#334155',
    surface: '#1E293B',
    surfaceElevated: '#334155',
    
    text: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textTertiary: '#64748B',
    
    border: '#334155',
    borderLight: '#475569',
    divider: '#334155',
    
    overlay: 'rgba(0, 0, 0, 0.6)',
    overlayLight: 'rgba(0, 0, 0, 0.2)',
    
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowMedium: 'rgba(0, 0, 0, 0.4)',
    shadowStrong: 'rgba(0, 0, 0, 0.5)',
  },
  
  // Semantic Colors
  success: '#10B981',
  successBg: '#D1FAE5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  error: '#EF4444',
  errorBg: '#FEE2E2',
  info: '#3B82F6',
  infoBg: '#DBEAFE',
  
  // Special States
  locked: '#64748B',
  lockedBg: '#F1F5F9',
  premium: '#8B5CF6',
  premiumBg: '#EDE9FE',
};

// ============================================
// TYPOGRAPHY
// ============================================

export const typography = {
  // Display - For hero sections
  displayLarge: {
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '700' as const,
    letterSpacing: -1,
  },
  displayMedium: {
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  displaySmall: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  
  // Headings
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as const,
    letterSpacing: -0.25,
  },
  h3: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  h4: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600' as const,
  },
  
  // Body
  bodyLarge: {
    fontSize: 17,
    lineHeight: 26,
    fontWeight: '400' as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  
  // Labels & Captions
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
  labelSmall: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  overline: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
};

// ============================================
// SPACING SYSTEM (8px base)
// ============================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// ============================================
// BORDER RADIUS
// ============================================

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

// ============================================
// SHADOWS
// ============================================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
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
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
  },
};

// ============================================
// COMPONENT STYLES
// ============================================

export const components = StyleSheet.create({
  // Cards
  card: {
    backgroundColor: designColors.light.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.md,
  } as ViewStyle,
  
  cardElevated: {
    backgroundColor: designColors.light.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.lg,
  } as ViewStyle,
  
  cardFlat: {
    backgroundColor: designColors.light.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: designColors.light.border,
  } as ViewStyle,
  
  // Buttons
  buttonPrimary: {
    backgroundColor: designColors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  } as ViewStyle,
  
  buttonSecondary: {
    backgroundColor: designColors.light.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: designColors.light.border,
  } as ViewStyle,
  
  buttonText: {
    backgroundColor: 'transparent',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  
  // Badges
  badge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  } as ViewStyle,
  
  badgeLarge: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  } as ViewStyle,
  
  // Inputs
  input: {
    backgroundColor: designColors.light.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: designColors.light.border,
    ...typography.body,
  } as ViewStyle & TextStyle,
  
  // Dividers
  divider: {
    height: 1,
    backgroundColor: designColors.light.divider,
  } as ViewStyle,
  
  dividerVertical: {
    width: 1,
    backgroundColor: designColors.light.divider,
  } as ViewStyle,
});

// ============================================
// ANIMATION TIMINGS
// ============================================

export const animations = {
  fast: 150,
  normal: 250,
  slow: 350,
  verySlow: 500,
};

// ============================================
// LAYOUT CONSTANTS
// ============================================

export const layout = {
  screenPadding: spacing.lg,
  screenPaddingLarge: spacing.xl,
  maxContentWidth: 640,
  headerHeight: 56,
  tabBarHeight: 64,
  cardSpacing: spacing.md,
};
