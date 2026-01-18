
import React from 'react';
import { Slot } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { Href } from 'expo-router';

export default function TabLayout() {
  const { user } = useUser();

  console.log('TabLayout (iOS) rendering, user:', user?.fullName, 'hasSignedAgreement:', user?.hasSignedAgreement);

  // Build tabs based on user status
  const tabs: TabBarItem[] = [
    {
      name: '(home)',
      route: '/(tabs)/(home)' as Href,
      icon: 'home',
      label: 'מידע',
    },
  ];

  // Add calculator tab for first-stage users (not signed agreement)
  if (user && !user.hasSignedAgreement) {
    console.log('Adding calculator tab for first-stage user (iOS)');
    tabs.push({
      name: 'calculator',
      route: '/(tabs)/calculator' as Href,
      icon: 'savings',
      label: 'מחשבון חיסכון',
    });
  }

  // Add tasks tab for second-stage users (signed agreement)
  if (user && user.hasSignedAgreement) {
    console.log('Adding tasks tab for second-stage user (iOS)');
    tabs.push({
      name: 'tasks',
      route: '/(tabs)/tasks' as Href,
      icon: 'check-circle',
      label: 'משימות',
    });
  }

  // Profile tab is always last
  tabs.push({
    name: 'profile',
    route: '/(tabs)/profile' as Href,
    icon: 'person',
    label: 'פרופיל',
  });

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
