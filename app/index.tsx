
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, I18nManager } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@react-navigation/native';

// Ensure RTL is enabled
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

export default function IndexScreen() {
  const router = useRouter();
  const { user, isLoading, session } = useUser();
  const { colors } = useTheme();

  useEffect(() => {
    if (!isLoading) {
      console.log('Index screen - Auth check complete');
      console.log('Index screen - User:', user ? user.fullName : 'null');
      console.log('Index screen - Session:', session ? 'exists' : 'null');
      
      if (user && session) {
        console.log('Index screen - User authenticated, redirecting to home');
        router.replace('/(tabs)/(home)');
      } else {
        console.log('Index screen - No user session, redirecting to registration');
        router.replace('/register');
      }
    } else {
      console.log('Index screen - Still loading auth state...');
    }
  }, [isLoading, user, session, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color="#2784F5" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
