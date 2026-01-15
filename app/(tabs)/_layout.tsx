
import React from 'react';
import { Tabs } from 'expo-router';
import FloatingTabBar from '@/components/FloatingTabBar';
import { useTheme } from '@react-navigation/native';
import { colors } from '@/styles/commonStyles';

export default function TabLayout() {
  const { colors: themeColors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => (
        <FloatingTabBar
          {...props}
          tabs={[
            {
              name: '(home)',
              title: 'בית',
              ios_icon_name: 'house.fill',
              android_material_icon_name: 'home',
              route: '/(tabs)/(home)',
            },
            {
              name: 'profile',
              title: 'פרופיל',
              ios_icon_name: 'person.fill',
              android_material_icon_name: 'person',
              route: '/(tabs)/profile',
            },
          ]}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="(home)" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
