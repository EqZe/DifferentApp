
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useTheme } from '@react-navigation/native';

export default function IndexScreen() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const { colors } = useTheme();

  useEffect(() => {
    if (!isLoading) {
      console.log('Index screen - checking user status:', user ? 'logged in' : 'not logged in');
      if (user) {
        console.log('Redirecting to home screen');
        router.replace('/(tabs)/(home)');
      } else {
        console.log('Redirecting to registration');
        router.replace('/register');
      }
    }
  }, [isLoading, user, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
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
