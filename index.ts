
import 'expo-router/entry';
import { I18nManager, Platform } from 'react-native';

// Force RTL layout for Hebrew - CRITICAL: Must be at the very top before any React components load
// This ensures RTL is applied before the app renders
if (Platform.OS !== 'web') {
  // For native platforms (iOS/Android), use I18nManager
  if (!I18nManager.isRTL) {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
    console.log('🔄 RTL forced for native platform');
  }
} else {
  // For web, set the HTML dir attribute AND global flag
  if (typeof document !== 'undefined') {
    // Set global flag for web RTL detection
    global.__IS_RTL__ = true;
    document.documentElement.setAttribute('dir', 'rtl');
    document.body.setAttribute('dir', 'rtl');
    console.log('🔄 RTL forced for web platform via HTML dir attribute and global flag');
  }
}
