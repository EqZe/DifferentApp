
import React from 'react';
import { Slot } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { Href } from 'expo-router';

export default function TabLayout() {
  const { user } = useUser();

  console.log('TabLayout (iOS) rendering, user:', user?.fullName);

  // Only 2 tabs: Information (posts) and Profile
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)' as Href,
      icon: 'info',
      label: 'מידע',
    },
    {
      name: 'profile',
      route: '/(tabs)/profile' as Href,
      icon: 'person',
      label: 'פרופיל',
    },
  ];

  return (
    <View style={styles.container}>
      {/* This renders the actual screen content */}
      <Slot />
      
      {/* Floating tab bar on top */}
      <FloatingTabBar tabs={tabs} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
