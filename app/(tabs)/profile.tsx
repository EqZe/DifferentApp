
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/contexts/UserContext';
import React, { useState, useEffect } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import { sendTestTaskReminders, registerForPushNotificationsAsync } from '@/utils/notifications';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { api } from '@/utils/api';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  useColorScheme,
  I18nManager,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { designColors, typography, spacing, radius, shadows, layout } from '@/styles/designSystem';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designColors.background.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: designColors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  name: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: designColors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  email: {
    fontSize: typography.sizes.md,
    color: designColors.text.secondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: designColors.text.primary,
    marginBottom: spacing.md,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  card: {
    backgroundColor: designColors.background.secondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  row: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rowLast: {
    marginBottom: 0,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: designColors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: I18nManager.isRTL ? 0 : spacing.md,
    marginLeft: I18nManager.isRTL ? spacing.md : 0,
  },
  rowContent: {
    flex: 1,
  },
  rowLabel: {
    fontSize: typography.sizes.sm,
    color: designColors.text.secondary,
    marginBottom: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  rowValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: designColors.text.primary,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
  },
  button: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.small,
  },
  buttonPrimary: {
    backgroundColor: designColors.primary.main,
  },
  buttonSecondary: {
    backgroundColor: designColors.secondary.main,
  },
  buttonDanger: {
    backgroundColor: designColors.error.main,
  },
  buttonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: designColors.background.secondary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    ...shadows.large,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: designColors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalText: {
    fontSize: typography.sizes.md,
    color: designColors.text.secondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: designColors.background.tertiary,
  },
  modalButtonConfirm: {
    backgroundColor: designColors.error.main,
  },
  modalButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  modalButtonTextCancel: {
    color: designColors.text.primary,
  },
  modalButtonTextConfirm: {
    color: '#FFFFFF',
  },
  notificationCard: {
    backgroundColor: designColors.background.secondary,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 2,
    ...shadows.small,
  },
  notificationCardSuccess: {
    borderColor: designColors.success.main,
    backgroundColor: designColors.success.light + '20',
  },
  notificationCardWarning: {
    borderColor: designColors.warning.main,
    backgroundColor: designColors.warning.light + '20',
  },
  notificationCardError: {
    borderColor: designColors.error.main,
    backgroundColor: designColors.error.light + '20',
  },
  notificationTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  notificationTitleSuccess: {
    color: designColors.success.main,
  },
  notificationTitleWarning: {
    color: designColors.warning.main,
  },
  notificationTitleError: {
    color: designColors.error.main,
  },
  notificationText: {
    fontSize: typography.sizes.sm,
    color: designColors.text.secondary,
    lineHeight: 20,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  loadingContainer: {
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: '#FFFFFF',
  },
});

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'לא הוגדר';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const { user, session, refreshUser } = useUser();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isRegisteringPush, setIsRegisteringPush] = useState(false);
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  useEffect(() => {
    if (session && user) {
      console.log('ProfileScreen: User session active', user.fullName);
      console.log('ProfileScreen: Push token status:', user.pushToken ? 'registered ✅' : 'not registered ⚠️');
    }
  }, [session, user]);

  // Refresh user data when screen comes into focus
  useEffect(() => {
    refreshUser();
  }, []);

  const handleLogout = async () => {
    try {
      console.log('ProfileScreen: User confirmed logout');
      await api.signOut();
      console.log('ProfileScreen: Logout successful, redirecting to register');
      router.replace('/register');
    } catch (error: any) {
      console.error('ProfileScreen: Logout failed', error);
      Alert.alert('שגיאה', error.message || 'שגיאה בהתנתקות');
    } finally {
      setShowLogoutModal(false);
    }
  };

  const confirmLogout = () => {
    setShowLogoutModal(true);
  };

  const handleTestNotification = async () => {
    try {
      console.log('ProfileScreen: User tapped Test Notification button');
      await sendTestTaskReminders('בדיקת התראות מהפרופיל');
      Alert.alert(
        'התראות נשלחו!',
        'שלוש התראות נשלחו:\n\n1. תזכורת 7 ימים (מיידית)\n2. תזכורת 3 ימים (אחרי 2 שניות)\n3. תזכורת יום אחד (אחרי 4 שניות)\n\nבדוק את מגש ההתראות שלך!'
      );
    } catch (error: any) {
      console.error('ProfileScreen: Test notification failed', error);
      Alert.alert('שגיאה', error.message || 'שגיאה בשליחת התראת בדיקה');
    }
  };

  const handleRegisterPushNotifications = async () => {
    console.log('ProfileScreen: User tapped Register for Notifications button');
    setRegistrationError(null);
    setRegistrationSuccess(false);
    setIsRegisteringPush(true);
    
    try {
      const token = await registerForPushNotificationsAsync();
      
      if (token && session?.user?.id) {
        console.log('ProfileScreen: Push token obtained, saving to database');
        await api.savePushToken(session.user.id, token);
        console.log('ProfileScreen: Push token saved successfully');
        
        // Refresh user data to show updated push_token status
        await refreshUser();
        
        setRegistrationSuccess(true);
        console.log('ProfileScreen: ✅ Push notification registration complete');
      } else {
        throw new Error('לא התקבל טוקן התראות');
      }
    } catch (error: any) {
      console.error('ProfileScreen: Push notification registration failed', error);
      setRegistrationError(error.message || 'שגיאה ברישום להתראות');
    } finally {
      setIsRegisteringPush(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={designColors.primary.main} />
          <Text style={{ marginTop: spacing.md, color: designColors.text.secondary }}>
            טוען פרטי משתמש...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const userInitials = user.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const hasContract = user.hasContract;
  const hasPushToken = !!user.pushToken;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{userInitials}</Text>
          </View>
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.email}>{user.email || user.phoneNumber || 'אין מייל'}</Text>
        </View>

        {/* User Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פרטים אישיים</Text>
          
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.iconContainer}>
                <IconSymbol 
                  ios_icon_name="person.fill" 
                  android_material_icon_name="person"
                  size={20} 
                  color={designColors.primary.main} 
                />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>שם מלא</Text>
                <Text style={styles.rowValue}>{user.fullName}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.iconContainer}>
                <IconSymbol 
                  ios_icon_name="location.fill" 
                  android_material_icon_name="location-on"
                  size={20} 
                  color={designColors.primary.main} 
                />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>עיר</Text>
                <Text style={styles.rowValue}>{user.city}</Text>
              </View>
            </View>

            {user.phoneNumber && (
              <View style={styles.row}>
                <View style={styles.iconContainer}>
                  <IconSymbol 
                    ios_icon_name="phone.fill" 
                    android_material_icon_name="phone"
                    size={20} 
                    color={designColors.primary.main} 
                  />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>טלפון</Text>
                  <Text style={styles.rowValue}>{user.phoneNumber}</Text>
                </View>
              </View>
            )}

            <View style={[styles.row, styles.rowLast]}>
              <View style={styles.iconContainer}>
                <IconSymbol 
                  ios_icon_name="doc.text.fill" 
                  android_material_icon_name="description"
                  size={20} 
                  color={designColors.primary.main} 
                />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>סטטוס חוזה</Text>
                <View 
                  style={[
                    styles.badge, 
                    { backgroundColor: hasContract ? designColors.success.main : designColors.warning.main }
                  ]}
                >
                  <Text style={styles.badgeText}>
                    {hasContract ? 'חוזה חתום ✓' : 'ממתין לחוזה'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Travel Info Section */}
        {hasContract && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>פרטי נסיעה</Text>
            
            <View style={styles.card}>
              <View style={[styles.row, styles.rowLast]}>
                <View style={styles.iconContainer}>
                  <IconSymbol 
                    ios_icon_name="calendar" 
                    android_material_icon_name="calendar-today"
                    size={20} 
                    color={designColors.primary.main} 
                  />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>תאריך נסיעה</Text>
                  <Text style={styles.rowValue}>{formatDate(user.travelDate)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Push Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>התראות</Text>
          
          {/* Registration Status Card */}
          {hasPushToken && !registrationSuccess && (
            <View style={[styles.notificationCard, styles.notificationCardSuccess]}>
              <Text style={[styles.notificationTitle, styles.notificationTitleSuccess]}>
                ✅ רשום להתראות
              </Text>
              <Text style={styles.notificationText}>
                אתה רשום להתראות בהצלחה. תקבל תזכורות על משימות ועדכונים חשובים.
              </Text>
            </View>
          )}

          {!hasPushToken && !registrationSuccess && !isRegisteringPush && (
            <View style={[styles.notificationCard, styles.notificationCardWarning]}>
              <Text style={[styles.notificationTitle, styles.notificationTitleWarning]}>
                ⚠️ לא רשום להתראות
              </Text>
              <Text style={styles.notificationText}>
                הירשם להתראות כדי לקבל תזכורות על משימות ועדכונים חשובים.
                {'\n\n'}
                💡 התראות דורשות מכשיר פיזי (לא סימולטור).
              </Text>
            </View>
          )}

          {registrationSuccess && (
            <View style={[styles.notificationCard, styles.notificationCardSuccess]}>
              <Text style={[styles.notificationTitle, styles.notificationTitleSuccess]}>
                🎉 נרשמת בהצלחה!
              </Text>
              <Text style={styles.notificationText}>
                ההרשמה להתראות הושלמה בהצלחה. תתחיל לקבל תזכורות ועדכונים.
              </Text>
            </View>
          )}

          {registrationError && (
            <View style={[styles.notificationCard, styles.notificationCardError]}>
              <Text style={[styles.notificationTitle, styles.notificationTitleError]}>
                ❌ שגיאה ברישום
              </Text>
              <Text style={styles.notificationText}>{registrationError}</Text>
            </View>
          )}

          {/* Register Button */}
          {!hasPushToken && !registrationSuccess && (
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, isRegisteringPush && styles.buttonDisabled]}
              onPress={handleRegisterPushNotifications}
              disabled={isRegisteringPush}
            >
              {isRegisteringPush ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.loadingText}>מבצע רישום...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>הירשם להתראות</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Test Notification Button (Development) */}
          {__DEV__ && (
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleTestNotification}
            >
              <Text style={styles.buttonText}>שלח התראת בדיקה (פיתוח)</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.button, styles.buttonDanger]}
          onPress={confirmLogout}
        >
          <Text style={styles.buttonText}>התנתק</Text>
        </TouchableOpacity>
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
            <Text style={styles.modalText}>
              האם אתה בטוח שברצונך להתנתק מהחשבון?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextCancel]}>
                  ביטול
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleLogout}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>
                  התנתק
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
