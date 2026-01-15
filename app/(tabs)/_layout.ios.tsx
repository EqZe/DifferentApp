
import React from 'react';
import { Platform } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { Href } from 'expo-router';

export default function TabLayout() {
  const { user } = useUser();

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

  return <FloatingTabBar tabs={tabs} />;
}
