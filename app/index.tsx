
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@react-navigation/native';
import { isRTL } from '@/constants/Colors';

export default function IndexScreen() {
  const router = useRouter();
  const { user, isLoading, session } = useUser();
  const { colors } = useTheme();
  
  const rtlEnabled = isRTL();

  useEffect(() => {
    if (!isLoading) {
      console.log('Index screen - Auth check complete');
      console.log('Index screen - User:', user ? user.fullName : 'null');
      console.log('Index screen - Session:', session ? 'exists' : 'null');
      console.log('Index screen - RTL status:', rtlEnabled);
      console.log('Index screen - Platform:', Platform.OS);
      console.log('Index screen - Writing Direction:', rtlEnabled ? 'RTL' : 'LTR');
      
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
    <View style={[styles.container, { backgroundColor: colors.background, direction: rtlEnabled ? 'rtl' : 'ltr' }]}>
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
