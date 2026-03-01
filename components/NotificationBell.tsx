
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { designColors, spacing, radius, shadows } from '@/styles/designSystem';
import { useUser } from '@/contexts/UserContext';
import * as Notifications from 'expo-notifications';

export function NotificationBell() {
  const router = useRouter();
  const { user } = useUser();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Get notification count on mount
    getNotificationCount();

    // Listen for new notifications
    const subscription = Notifications.addNotificationReceivedListener(() => {
      console.log('NotificationBell: New notification received, updating count');
      getNotificationCount();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const getNotificationCount = async () => {
    try {
      // Get all delivered notifications
      const notifications = await Notifications.getPresentedNotificationsAsync();
      console.log('NotificationBell: Notification count:', notifications.length);
      setUnreadCount(notifications.length);
    } catch (error) {
      console.error('NotificationBell: Error getting notification count:', error);
    }
  };

  const handlePress = () => {
    console.log('NotificationBell: User tapped notification bell');
    
    // Clear the badge count
    setUnreadCount(0);
    
    // Navigate to notification preferences
    router.push('/notification-preferences');
  };

  // Don't show on web
  if (Platform.OS === 'web') {
    return null;
  }

  // Don't show if user hasn't registered for push notifications
  if (!user?.pushToken) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <IconSymbol
          ios_icon_name="bell.fill"
          android_material_icon_name="notifications"
          size={24}
          color={designColors.primary}
        />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.sm,
  },
  iconContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: designColors.error,
    borderRadius: radius.full,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...shadows.sm,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
