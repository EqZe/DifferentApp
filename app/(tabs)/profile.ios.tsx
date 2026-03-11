
import { IconSymbol } from '@/components/IconSymbol';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Modal,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { api } from '@/utils/api';
import { designColors, typography, spacing, radius, shadows } from '@/styles/designSystem';
import { useOneSignal } from '@/contexts/OneSignalContext';
import * as Device from 'expo-device';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  greeting: {
    ...typography.h1,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.medium,
    marginBottom: spacing.md,
  },
  cardDark: {
    backgroundColor: '#1E1E1E',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    color: '#666666',
    marginBottom: spacing.xs,
  },
  labelDark: {
    color: '#AAAAAA',
  },
  value: {
    ...typography.body,
    fontWeight: '600',
  },
  valueDark: {
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: designColors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: width * 0.85,
    maxWidth: 400,
  },
  modalContentDark: {
    backgroundColor: '#1E1E1E',
  },
  modalTitle: {
    ...typography.h2,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#E0E0E0',
  },
  modalButtonCancelDark: {
    backgroundColor: '#333333',
  },
  modalButtonConfirm: {
    backgroundColor: '#FF3B30',
  },
  modalButtonText: {
    ...typography.button,
    color: '#000000',
  },
  modalButtonTextDark: {
    color: '#FFFFFF',
  },
  modalButtonTextConfirm: {
    color: '#FFFFFF',
  },
  debugSection: {
    backgroundColor: '#F5F5F5',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  debugSectionDark: {
    backgroundColor: '#2A2A2A',
  },
  debugTitle: {
    ...typography.h4,
    marginBottom: spacing.sm,
    color: designColors.primary,
  },
  debugRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  debugLabel: {
    ...typography.caption,
    color: '#666666',
  },
  debugLabelDark: {
    color: '#AAAAAA',
  },
  debugValue: {
    ...typography.caption,
    fontWeight: '600',
    color: '#000000',
  },
  debugValueDark: {
    color: '#FFFFFF',
  },
  debugValueSuccess: {
    color: '#34C759',
  },
  debugValueError: {
    color: '#FF3B30',
  },
  notificationButton: {
    backgroundColor: designColors.secondary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) {
    const notSetText = 'לא הוגדר';
    return notSetText;
  }
  try {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    return formattedDate;
  } catch (error) {
    const invalidText = 'תאריך לא תקין';
    return invalidText;
  }
}

export default function ProfileScreen() {
  const { user, session, refreshUser } = useUser();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // OneSignal debug info
  const { isInitialized, hasPermission, playerId, requestPermission } = useOneSignal();

  useEffect(() => {
    console.log('ProfileScreen: Mounted');
    console.log('ProfileScreen: User:', user?.fullName);
    console.log('ProfileScreen: Session:', session ? 'exists' : 'null');
  }, [user, session]);

  useEffect(() => {
    console.log('ProfileScreen: Calling refreshUser on mount');
    refreshUser();
  }, []);

  const handleLogout = () => {
    console.log('ProfileScreen: Logout button pressed, showing confirmation modal');
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    console.log('ProfileScreen: User confirmed logout');
    setIsLoggingOut(true);
    
    try {
      console.log('ProfileScreen: Calling supabase.auth.signOut()');
      const { error } = await api.signOut();
      
      if (error) {
        console.error('ProfileScreen: ❌ Logout error:', error);
      } else {
        console.log('ProfileScreen: ✅ Logout successful');
      }
      
      // Always close modal and navigate, even if there's an error
      // The auth state listener will handle clearing the user state
      setShowLogoutModal(false);
      console.log('ProfileScreen: Navigating to /register');
      router.replace('/register');
    } catch (error) {
      console.error('ProfileScreen: ❌ Unexpected logout error:', error);
      // Still navigate away on error
      setShowLogoutModal(false);
      router.replace('/register');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleRequestPermission = async () => {
    console.log('ProfileScreen: User requested push notification permission');
    try {
      const granted = await requestPermission();
      console.log('ProfileScreen: Permission result:', granted);
      if (granted) {
        console.log('ProfileScreen: ✅ Permission granted, refreshing user data');
        await refreshUser();
      }
    } catch (error) {
      console.error('ProfileScreen: ❌ Error requesting permission:', error);
    }
  };

  if (!user) {
    const loadingText = 'טוען...';
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={designColors.primary} />
        <Text style={[styles.subtitle, { marginTop: spacing.md }]}>{loadingText}</Text>
      </View>
    );
  }

  const greetingText = 'שלום,';
  const personalInfoTitle = 'מידע אישי';
  const fullNameLabel = 'שם מלא';
  const emailLabel = 'אימייל';
  const phoneLabel = 'טלפון';
  const cityLabel = 'עיר';
  const travelInfoTitle = 'מידע נסיעה';
  const contractStatusLabel = 'סטטוס חוזה';
  const contractSignedText = 'חוזה נחתם ✓';
  const contractNotSignedText = 'חוזה לא נחתם';
  const travelDateLabel = 'תאריך נסיעה';
  const notificationSettingsTitle = 'הגדרות התראות';
  const notificationSettingsButton = 'ניהול התראות';
  const oneSignalDebugTitle = 'OneSignal Debug Info';
  const oneSignalInitializedLabel = 'Initialized';
  const oneSignalPermissionLabel = 'Permission';
  const oneSignalPlayerIdLabel = 'Player ID';
  const requestPermissionButton = 'בקש הרשאת התראות';
  const logoutButton = 'התנתק';
  const logoutModalTitle = 'האם אתה בטוח?';
  const logoutModalText = 'האם אתה בטוח שברצונך להתנתק?';
  const logoutModalCancel = 'ביטול';
  const logoutModalConfirm = 'התנתק';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[designColors.primary, designColors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
            <Text style={styles.greeting}>{greetingText}</Text>
            <Text style={styles.subtitle}>{user.fullName}</Text>
          </Animated.View>

          {/* Personal Info */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && { color: '#FFFFFF' }]}>{personalInfoTitle}</Text>
            <View style={[styles.card, isDark && styles.cardDark]}>
              <View style={{ marginBottom: spacing.md }}>
                <Text style={[styles.label, isDark && styles.labelDark]}>{fullNameLabel}</Text>
                <Text style={[styles.value, isDark && styles.valueDark]}>{user.fullName}</Text>
              </View>
              
              {user.email && (
                <View style={{ marginBottom: spacing.md }}>
                  <Text style={[styles.label, isDark && styles.labelDark]}>{emailLabel}</Text>
                  <Text style={[styles.value, isDark && styles.valueDark]}>{user.email}</Text>
                </View>
              )}
              
              <View style={{ marginBottom: spacing.md }}>
                <Text style={[styles.label, isDark && styles.labelDark]}>{phoneLabel}</Text>
                <Text style={[styles.value, isDark && styles.valueDark]}>{user.phoneNumber}</Text>
              </View>
              
              <View>
                <Text style={[styles.label, isDark && styles.labelDark]}>{cityLabel}</Text>
                <Text style={[styles.value, isDark && styles.valueDark]}>{user.city}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Travel Info */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && { color: '#FFFFFF' }]}>{travelInfoTitle}</Text>
            <View style={[styles.card, isDark && styles.cardDark]}>
              <View style={{ marginBottom: spacing.md }}>
                <Text style={[styles.label, isDark && styles.labelDark]}>{contractStatusLabel}</Text>
                <Text style={[styles.value, isDark && styles.valueDark, user.hasContract && { color: '#34C759' }]}>
                  {user.hasContract ? contractSignedText : contractNotSignedText}
                </Text>
              </View>
              
              {user.hasContract && user.travelDate && (
                <View>
                  <Text style={[styles.label, isDark && styles.labelDark]}>{travelDateLabel}</Text>
                  <Text style={[styles.value, isDark && styles.valueDark]}>{formatDate(user.travelDate)}</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Notification Settings */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.section}>
            <Text style={[styles.sectionTitle, isDark && { color: '#FFFFFF' }]}>{notificationSettingsTitle}</Text>
            <View style={[styles.card, isDark && styles.cardDark]}>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => router.push('/notification-preferences')}
              >
                <Text style={styles.buttonText}>{notificationSettingsButton}</Text>
              </TouchableOpacity>

              {/* OneSignal Debug Info */}
              {Platform.OS !== 'web' && (
                <View style={[styles.debugSection, isDark && styles.debugSectionDark]}>
                  <Text style={styles.debugTitle}>{oneSignalDebugTitle}</Text>
                  
                  <View style={styles.debugRow}>
                    <Text style={[styles.debugLabel, isDark && styles.debugLabelDark]}>{oneSignalInitializedLabel}</Text>
                    <Text style={[
                      styles.debugValue,
                      isDark && styles.debugValueDark,
                      isInitialized ? styles.debugValueSuccess : styles.debugValueError
                    ]}>
                      {isInitialized ? '✅ Yes' : '❌ No'}
                    </Text>
                  </View>
                  
                  <View style={styles.debugRow}>
                    <Text style={[styles.debugLabel, isDark && styles.debugLabelDark]}>{oneSignalPermissionLabel}</Text>
                    <Text style={[
                      styles.debugValue,
                      isDark && styles.debugValueDark,
                      hasPermission ? styles.debugValueSuccess : styles.debugValueError
                    ]}>
                      {hasPermission ? '✅ Granted' : '❌ Not Granted'}
                    </Text>
                  </View>
                  
                  <View style={styles.debugRow}>
                    <Text style={[styles.debugLabel, isDark && styles.debugLabelDark]}>{oneSignalPlayerIdLabel}</Text>
                    <Text style={[
                      styles.debugValue,
                      isDark && styles.debugValueDark,
                      playerId ? styles.debugValueSuccess : styles.debugValueError
                    ]}>
                      {playerId ? `${playerId.substring(0, 8)}...` : 'Not available'}
                    </Text>
                  </View>

                  {!hasPermission && (
                    <TouchableOpacity
                      style={[styles.button, { marginTop: spacing.md }]}
                      onPress={handleRequestPermission}
                    >
                      <Text style={styles.buttonText}>{requestPermissionButton}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </Animated.View>

          {/* Logout Button */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.section}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.buttonText}>{logoutButton}</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, isDark && { color: '#FFFFFF' }]}>{logoutModalTitle}</Text>
            <Text style={[styles.modalText, isDark && { color: '#CCCCCC' }]}>{logoutModalText}</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, isDark && styles.modalButtonCancelDark]}
                onPress={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
              >
                <Text style={[styles.modalButtonText, isDark && styles.modalButtonTextDark]}>{logoutModalCancel}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonTextConfirm}>{logoutModalConfirm}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
