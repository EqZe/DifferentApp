
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { designColors, spacing, radius, shadows } from '@/styles/designSystem';
import { useOneSignal } from '@/contexts/OneSignalContext';

export function NotificationBell() {
  const router = useRouter();
  const { hasPermission } = useOneSignal();
  const [unreadCount, setUnreadCount] = useState(0);

  const handlePress = () => {
    console.log('NotificationBell: User tapped notification bell');
    
    // Navigate to notification preferences
    router.push('/notification-preferences');
  };

  // Don't show on web
  if (Platform.OS === 'web') {
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
          color={hasPermission ? designColors.primary : designColors.textSecondary}
        />
        {!hasPermission && (
          <View style={styles.warningBadge}>
            <IconSymbol
              ios_icon_name="exclamationmark"
              android_material_icon_name="warning"
              size={10}
              color="#FFFFFF"
            />
          </View>
        )}
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
  warningBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: designColors.warning,
    borderRadius: radius.full,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...shadows.sm,
  },
});
