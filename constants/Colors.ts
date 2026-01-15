
export const Colors = {
  light: {
    background: '#FFFFFF',
    backgroundSecondary: '#F8FAFC',
    text: '#0F172A',
    textSecondary: '#64748B',
    primary: '#2784F5',
    secondary: '#F5AD27',
    accent: '#10B981',
    card: '#FFFFFF',
    cardBorder: '#E2E8F0',
    highlight: '#EFF6FF',
    error: '#EF4444',
    success: '#10B981',
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    background: '#0F172A',
    backgroundSecondary: '#1E293B',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    primary: '#2784F5',
    secondary: '#F5AD27',
    accent: '#10B981',
    card: '#1E293B',
    cardBorder: '#334155',
    highlight: '#1E3A8A',
    error: '#EF4444',
    success: '#10B981',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

export const appleBlue = '#007AFF';
export const appleRed = '#FF3B30';

export function borderColor(isDark: boolean) {
  return isDark ? Colors.dark.cardBorder : Colors.light.cardBorder;
}

export const zincColors = {
  50: '#fafafa',
  100: '#f4f4f5',
  200: '#e4e4e7',
  300: '#d4d4d8',
  400: '#a1a1aa',
  500: '#71717a',
  600: '#52525b',
  700: '#3f3f46',
  800: '#27272a',
  900: '#18181b',
  950: '#09090b',
};
