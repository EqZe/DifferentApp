
import React from 'react';
import { useUser } from '@/contexts/UserContext';
import FloatingTabBar from '@/components/FloatingTabBar';

export default function TabLayout() {
  const { user } = useUser();

  // Define tabs based on user agreement status
  const tabs = user?.hasSignedAgreement
    ? [
        {
          name: '(home)',
          title: 'בית',
          ios_icon_name: 'house.fill',
          android_material_icon_name: 'home',
        },
        {
          name: 'tasks',
          title: 'משימות',
          ios_icon_name: 'checkmark.circle.fill',
          android_material_icon_name: 'check-circle',
        },
        {
          name: 'profile',
          title: 'פרופיל',
          ios_icon_name: 'person.fill',
          android_material_icon_name: 'person',
        },
      ]
    : [
        {
          name: '(home)',
          title: 'בית',
          ios_icon_name: 'house.fill',
          android_material_icon_name: 'home',
        },
        {
          name: 'profile',
          title: 'פרופיל',
          ios_icon_name: 'person.fill',
          android_material_icon_name: 'person',
        },
      ];

  return <FloatingTabBar tabs={tabs} />;
}
