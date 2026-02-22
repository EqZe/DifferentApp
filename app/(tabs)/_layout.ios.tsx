
import React, { useEffect, useState } from 'react';
import { Slot, useRouter } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { Href } from 'expo-router';
import { api } from '@/utils/api';

export default function TabLayout() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [hasContainers, setHasContainers] = useState(false);
  const [checkingContainers, setCheckingContainers] = useState(true);

  console.log('TabLayout (iOS) rendering, user:', user?.fullName, 'hasContract:', user?.hasContract);

  // Check if user has any containers
  useEffect(() => {
    async function checkUserContainers() {
      if (!user?.id) {
        setHasContainers(false);
        setCheckingContainers(false);
        return;
      }

      try {
        console.log('TabLayout (iOS): Checking if user has containers');
        const containers = await api.getContainers(user.id);
        const hasRecords = containers.length > 0;
        console.log('TabLayout (iOS): User has', containers.length, 'containers, showing tab:', hasRecords);
        setHasContainers(hasRecords);
      } catch (error) {
        console.error('TabLayout (iOS): Error checking containers', error);
        setHasContainers(false);
      } finally {
        setCheckingContainers(false);
      }
    }

    checkUserContainers();
  }, [user?.id]);

  // Redirect to register if user is null
  useEffect(() => {
    if (!isLoading && !user) {
      console.log('TabLayout (iOS): No user found, redirecting to register');
      router.replace('/register');
    }
  }, [user, isLoading, router]);

  // Don't render tabs if no user
  if (!user) {
    return null;
  }

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
  if (user && !user.hasContract) {
    console.log('Adding calculator tab for first-stage user (iOS)');
    tabs.push({
      name: 'calculator',
      route: '/(tabs)/calculator' as Href,
      icon: 'calculate',
      label: 'מחשבון חיסכון',
    });
  }

  // Add tasks tab for second-stage users (signed agreement)
  if (user && user.hasContract) {
    console.log('Adding tasks tab for second-stage user (iOS)');
    tabs.push({
      name: 'tasks',
      route: '/(tabs)/tasks' as Href,
      icon: 'check-circle',
      label: 'משימות',
    });
  }

  // Add schedule tab for second-stage users (signed agreement)
  if (user && user.hasContract) {
    console.log('Adding schedule tab for second-stage user (iOS)');
    tabs.push({
      name: 'schedule',
      route: '/(tabs)/schedule' as Href,
      icon: 'calendar-today',
      label: 'לוח זמנים',
    });
  }

  // Add containers tab ONLY if user has container records
  if (user && hasContainers) {
    console.log('Adding containers tab (iOS) - user has container records');
    tabs.push({
      name: 'containers',
      route: '/(tabs)/containers' as Href,
      icon: 'inventory',
      label: 'מכולות',
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
