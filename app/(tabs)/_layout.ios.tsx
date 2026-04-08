
import React, { useEffect, useState, useMemo } from 'react';
import { Slot, useRouter } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useUser } from '@/contexts/UserContext';
import FloatingTabBar, { TabBarItem } from '@/components/FloatingTabBar';
import { Href } from 'expo-router';
import { api } from '@/utils/api';
import { isRTL } from '@/constants/Colors';

export default function TabLayout() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [hasContainers, setHasContainers] = useState(false);
  const rtl = useMemo(() => isRTL(), []);

  // Check if user has any containers
  useEffect(() => {
    async function checkUserContainers() {
      if (!user?.id) {
        setHasContainers(false);
        return;
      }

      try {
        const containers = await api.getContainers(user.id);
        const hasRecords = containers.length > 0;
        setHasContainers(hasRecords);
      } catch (error) {
        setHasContainers(false);
      }
    }

    checkUserContainers();
  }, [user?.id]);

  // Redirect to register if user is null
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/register');
    }
  }, [user, isLoading, router]);

  const tabs = useMemo<TabBarItem[]>(() => {
    const result: TabBarItem[] = [
      { name: '(home)', route: '/(tabs)/(home)' as Href, icon: 'home', label: 'מידע' },
    ];
    if (user && !user.hasContract) {
      result.push({ name: 'calculator', route: '/(tabs)/calculator' as Href, icon: 'calculate', label: 'מחשבון חיסכון' });
    }
    if (user && user.hasContract) {
      result.push({ name: 'tasks', route: '/(tabs)/tasks' as Href, icon: 'check-circle', label: 'משימות' });
      result.push({ name: 'schedule', route: '/(tabs)/schedule' as Href, icon: 'calendar-today', label: 'לוח זמנים' });
    }
    if (user && hasContainers) {
      result.push({ name: 'containers', route: '/(tabs)/containers' as Href, icon: 'inventory', label: 'מכולות' });
    }
    result.push({ name: 'profile', route: '/(tabs)/profile' as Href, icon: 'person', label: 'פרופיל' });
    return result;
  }, [user, hasContainers]);

  // Don't render tabs if no user
  if (!user) {
    return null;
  }

  return (
    <View style={[styles.container, { direction: rtl ? 'rtl' : 'ltr' }]}>
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
