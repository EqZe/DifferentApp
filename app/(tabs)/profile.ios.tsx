
import { designColors, typography, spacing, radius, shadows, layout } from '@/styles/designSystem';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  I18nManager,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { useOneSignal } from '@/contexts/OneSignalContext';
import { api } from '@/utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { IconSymbol } from '@/components/IconSymbol';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    color: designColors.text.primary,
    marginBottom: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  subtitle: {
    ...typography.body,
    color: designColors.text.secondary,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: designColors.text.primary,
    marginBottom: spacing.md,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  card: {
    backgroundColor: designColors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  infoRow: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: designColors.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    ...typography.body,
    color: designColors.text.secondary,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  infoValue: {
    ...typography.bodyBold,
    color: designColors.text.primary,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  button: {
    backgroundColor: designColors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.small,
  },
  buttonContent: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  buttonText: {
    ...typography.bodyBold,
    color: designColors.text.primary,
  },
  buttonSubtext: {
    ...typography.caption,
    color: designColors.text.secondary,
    marginTop: spacing.xs,
  },
  logoutButton: {
    backgroundColor: designColors.error,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  logoutButtonText: {
    ...typography.bodyBold,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: designColors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '80%',
    maxWidth: 400,
    ...shadows.large,
  },
  modalTitle: {
    ...typography.h2,
    color: designColors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalMessage: {
    ...typography.body,
    color: designColors.text.secondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: designColors.surface,
    borderWidth: 1,
    borderColor: designColors.border,
  },
  modalButtonConfirm: {
    backgroundColor: designColors.error,
  },
  modalButtonText: {
    ...typography.bodyBold,
    color: designColors.text.primary,
  },
  modalButtonTextConfirm: {
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  debugCard: {
    backgroundColor: designColors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: designColors.border,
  },
  debugTitle: {
    ...typography.bodyBold,
    color: designColors.text.primary,
    marginBottom: spacing.sm,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  debugText: {
    ...typography.caption,
    color: designColors.text.secondary,
    fontFamily: 'Courier',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    marginBottom: spacing.xs,
  },
});

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'לא זמין';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'לא זמין';
  }
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, session, signOut, refreshUser } = useUser();
  const { isInitialized, hasPermission, requestPermission, playerId } = useOneSignal();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    console.log('ProfileScreen: User data:', user);
    console.log('ProfileScreen: Session:', session ? 'Active' : 'None');
  }, [user, session]);

  useEffect(() => {
    if (user) {
      refreshUser();
    }
  }, []);

  const handleLogout = () => {
    console.log('User tapped logout button');
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    console.log('User confirmed logout');
    setIsLoggingOut(true);
    try {
      await signOut();
      console.log('Logout successful, navigating to register screen');
      setShowLogoutModal(false);
      router.replace('/register');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בעת ההתנתקות. אנא נסה שוב.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleRegisterPushNotifications = async () => {
    console.log('User tapped register for push notifications');
    
    const granted = await requestPermission();
    
    if (granted) {
      Alert.alert(
        'התראות הופעלו',
        'תקבל התראות על עדכונים חשובים באפליקציה.',
        [{ text: 'אישור', style: 'default' }]
      );
    } else {
      Alert.alert(
        'הרשאה נדחתה',
        'לא ניתן לשלוח התראות ללא הרשאה. תוכל לשנות זאת בהגדרות המכשיר.',
        [{ text: 'הבנתי', style: 'default' }]
      );
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={designColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const contractStatusText = user.hasContract ? 'חתום' : 'לא חתום';
  const contractStatusColor = user.hasContract ? designColors.success : designColors.warning;
  const travelDateText = formatDate(user.travelDate);
  
  const notificationStatusText = hasPermission ? 'מופעלות' : 'כבויות';
  const notificationStatusColor = hasPermission ? designColors.success : designColors.error;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={colorScheme === 'dark' ? ['#1a1a1a', '#000000'] : ['#f8f9fa', '#ffffff']}
        style={StyleSheet.absoluteFill}
      />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>שלום, {user.fullName}</Text>
          <Text style={styles.subtitle}>ניהול הפרופיל שלך</Text>
        </View>

        {/* User Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פרטים אישיים</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>שם מלא</Text>
              <Text style={styles.infoValue}>{user.fullName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>עיר</Text>
              <Text style={styles.infoValue}>{user.city || 'לא צוין'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>טלפון</Text>
              <Text style={styles.infoValue}>{user.phoneNumber || 'לא צוין'}</Text>
            </View>
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Text style={styles.infoLabel}>סטטוס חוזה</Text>
              <View style={[styles.statusBadge, { backgroundColor: contractStatusColor + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: contractStatusColor }]}>
                  {contractStatusText}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Travel Info */}
        {user.hasContract && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>פרטי נסיעה</Text>
            <View style={styles.card}>
              <View style={[styles.infoRow, styles.infoRowLast]}>
                <Text style={styles.infoLabel}>תאריך נסיעה</Text>
                <Text style={styles.infoValue}>{travelDateText}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>התראות</Text>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={handleRegisterPushNotifications}
            activeOpacity={0.7}
          >
            <View style={styles.buttonContent}>
              <IconSymbol
                ios_icon_name="bell.fill"
                android_material_icon_name="notifications"
                size={24}
                color={designColors.primary}
              />
              <View>
                <Text style={styles.buttonText}>הרשם להתראות פוש</Text>
                <View style={[styles.statusBadge, { backgroundColor: notificationStatusColor + '20', marginTop: spacing.xs }]}>
                  <Text style={[styles.statusBadgeText, { color: notificationStatusColor }]}>
                    {notificationStatusText}
                  </Text>
                </View>
              </View>
            </View>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="chevron-right"
              size={20}
              color={designColors.text.secondary}
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push('/notification-preferences')}
            activeOpacity={0.7}
          >
            <View style={styles.buttonContent}>
              <IconSymbol
                ios_icon_name="slider.horizontal.3"
                android_material_icon_name="settings"
                size={24}
                color={designColors.primary}
              />
              <Text style={styles.buttonText}>הגדרות התראות</Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="chevron-right"
              size={20}
              color={designColors.text.secondary}
            />
          </TouchableOpacity>
        </View>

        {/* Debug Info (always show for testing) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>מידע טכני (Debug)</Text>
          <View style={styles.debugCard}>
            <Text style={styles.debugTitle}>OneSignal Status</Text>
            <Text style={styles.debugText}>Platform: {Platform.OS}</Text>
            <Text style={styles.debugText}>Initialized: {isInitialized ? 'Yes ✅' : 'No ❌'}</Text>
            <Text style={styles.debugText}>Permission: {hasPermission ? 'Granted ✅' : 'Not Granted ❌'}</Text>
            <Text style={styles.debugText}>Player ID: {playerId || 'Not available ❌'}</Text>
            <Text style={styles.debugText}>User ID: {user.id}</Text>
            
            {Platform.OS === 'web' && (
              <Text style={[styles.debugText, { color: designColors.warning, marginTop: spacing.sm }]}>
                ⚠️ Push notifications don't work on Web.{'\n'}
                Build the app with EAS and test on a physical device.
              </Text>
            )}
            
            {Platform.OS === 'ios' && !isInitialized && (
              <Text style={[styles.debugText, { color: designColors.error, marginTop: spacing.sm }]}>
                ❌ OneSignal not initialized!{'\n'}
                Check that app.json has appId in onesignal-expo-plugin.{'\n'}
                You may need to rebuild the app.
              </Text>
            )}
            
            {Platform.OS === 'ios' && isInitialized && !playerId && (
              <Text style={[styles.debugText, { color: designColors.warning, marginTop: spacing.sm }]}>
                ⚠️ No Player ID yet.{'\n'}
                Wait a few seconds or restart the app.{'\n'}
                If still missing, check console logs for errors.
              </Text>
            )}
            
            {Platform.OS === 'ios' && isInitialized && playerId && hasPermission && (
              <Text style={[styles.debugText, { color: designColors.success, marginTop: spacing.sm }]}>
                ✅ All set! You can receive push notifications.{'\n'}
                Send a test notification from OneSignal dashboard{'\n'}
                using this Player ID: {playerId}
              </Text>
            )}
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text style={styles.logoutButtonText}>התנתק</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>התנתקות</Text>
            <Text style={styles.modalMessage}>
              האם אתה בטוח שברצונך להתנתק מהאפליקציה?
            </Text>
            
            {isLoggingOut ? (
              <ActivityIndicator size="large" color={designColors.primary} />
            ) : (
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setShowLogoutModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalButtonText}>ביטול</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={confirmLogout}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>
                    התנתק
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
