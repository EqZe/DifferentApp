
import React from 'react';
import { Platform } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { Href } from 'expo-router';

export default function TabLayout() {
  const { user } = useUser();

  // Define tabs based on user agreement status
  const tabs: TabBarItem[] = user?.hasSignedAgreement
    ? [
        {
          name: '(home)',
          route: '/(tabs)/(home)' as Href,
          icon: 'home',
          label: 'בית',
        },
        {
          name: 'tasks',
          route: '/(tabs)/tasks' as Href,
          icon: 'check-circle',
          label: 'משימות',
        },
        {
          name: 'profile',
          route: '/(tabs)/profile' as Href,
          icon: 'person',
          label: 'פרופיל',
        },
      ]
    : [
        {
          name: '(home)',
          route: '/(tabs)/(home)' as Href,
          icon: 'home',
          label: 'בית',
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
