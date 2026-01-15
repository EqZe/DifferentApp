
import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

export const colors = {
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
};

export const darkColors = {
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
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
  } as ViewStyle,
  heading: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  } as TextStyle,
  subheading: {
    fontSize: 20,
    fontWeight: '600',
  } as TextStyle,
  body: {
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,
  caption: {
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  } as ViewStyle,
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  input: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
  } as ViewStyle & TextStyle,
});
