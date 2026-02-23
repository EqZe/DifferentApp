
import LottieView from 'lottie-react-native';
import { api } from '@/utils/api';
import { LinearGradient } from 'expo-linear-gradient';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { designColors, typography, spacing, radius, shadows, layout } from '@/styles/designSystem';
import { sendTestTaskReminders } from '@/utils/notifications';
import React, { useState, useEffect } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import { useUser } from '@/contexts/UserContext';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2,
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
    textAlign: 'right',
  },
  subtitle: {
    ...typography.body,
    color: designColors.text.secondary,
    textAlign: 'right',
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: designColors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'right',
  },
  card: {
    backgroundColor: designColors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: designColors.border,
  },
  infoLabel: {
    ...typography.body,
    color: designColors.text.secondary,
    textAlign: 'right',
  },
  infoValue: {
    ...typography.bodyBold,
    color: designColors.text.primary,
    textAlign: 'right',
  },
  button: {
    backgroundColor: designColors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.small,
  },
  buttonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  logoutButton: {
    backgroundColor: designColors.error,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadows.small,
  },
  logoutButtonText: {
    ...typography.button,
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
    borderRadius: radius.lg,
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
  modalText: {
    ...typography.body,
    color: designColors.text.secondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
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
    backgroundColor: designColors.border,
  },
  modalButtonConfirm: {
    backgroundColor: designColors.error,
  },
  modalButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  notificationButton: {
    backgroundColor: designColors.secondary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.small,
  },
  notificationButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  warningCard: {
    backgroundColor: '#FFF3CD',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  warningText: {
    ...typography.body,
    color: '#856404',
    textAlign: 'right',
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: '#D1ECF1',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#BEE5EB',
  },
  infoText: {
    ...typography.body,
    color: '#0C5460',
    textAlign: 'right',
    lineHeight: 22,
  },
  successCard: {
    backgroundColor: '#D4EDDA',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: '#C3E6CB',
  },
  successText: {
    ...typography.body,
    color: '#155724',
    textAlign: 'right',
    lineHeight: 22,
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
  } catch (error) {
    return 'תאריך לא תקין';
  }
}

export default function ProfileScreen() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const { user, session, refreshUser, registerPushNotifications, isRegisteringPush } = useUser();
  const colorScheme = useColorScheme();

  useEffect(() => {
    console.log('ProfileScreen: Component mounted, user:', user?.fullName);
    console.log('ProfileScreen: Session:', session ? 'exists' : 'none');
    console.log('ProfileScreen: Push token:', user?.pushToken ? 'exists' : 'null');
    
    // Refresh user data when screen is focused
    if (session && user) {
      refreshUser();
    }
  }, [session, user, refreshUser]);

  const handleLogout = async () => {
    console.log('ProfileScreen: User tapped logout button');
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    console.log('ProfileScreen: User confirmed logout');
    setIsLoggingOut(true);
    
    try {
      await api.signOut();
      console.log('ProfileScreen: ✅ Logout successful');
      setShowLogoutModal(false);
      router.replace('/register');
    } catch (error: any) {
      console.error('ProfileScreen: ❌ Logout failed:', error);
      Alert.alert('שגיאה', error.message || 'שגיאה בהתנתקות');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleTestNotification = async () => {
    console.log('ProfileScreen: User tapped test notification button');
    
    try {
      await sendTestTaskReminders('בדיקת התראות מערכת');
      Alert.alert(
        'התראות נשלחו',
        'נשלחו 3 התראות בדיקה (7 ימים, 3 ימים, יום אחד). בדוק את מגש ההתראות.',
        [{ text: 'אישור' }]
      );
    } catch (error: any) {
      console.error('ProfileScreen: ❌ Test notification failed:', error);
      Alert.alert('שגיאה', error.message || 'שגיאה בשליחת התראות בדיקה');
    }
  };

  const handleRegisterPushNotifications = async () => {
    console.log('ProfileScreen: User tapped register push notifications button');
    
    try {
      const token = await registerPushNotifications();
      
      if (token) {
        console.log('ProfileScreen: ✅ Push token registered:', token);
        Alert.alert(
          'הצלחה! 🎉',
          'הרישום להתראות הושלם בהצלחה.\n\nתקבל התראות על:\n• עדכוני משימות\n• שינויים במכולות\n• עדכוני לוח זמנים',
          [{ text: 'אישור' }]
        );
        // Refresh user data to show updated push token status
        await refreshUser();
      } else {
        console.log('ProfileScreen: ⚠️ No push token obtained');
        Alert.alert(
          'שים לב ⚠️',
          'לא ניתן לרשום להתראות כרגע.\n\nנסה:\n1. ודא שיש חיבור אינטרנט יציב\n2. סגור ופתח מחדש את האפליקציה\n3. אם הבעיה נמשכת, נסה להתנתק ולהתחבר מחדש',
          [{ text: 'אישור' }]
        );
      }
    } catch (error: any) {
      console.error('ProfileScreen: ❌ Push notification registration failed:', error);
      
      // Show detailed error message
      const errorMessage = error.message || 'שגיאה לא ידועה ברישום להתראות';
      Alert.alert(
        'שגיאה ברישום להתראות',
        errorMessage,
        [{ text: 'אישור' }]
      );
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={designColors.primary} />
          <Text style={{ ...typography.body, color: designColors.text.secondary, marginTop: spacing.md }}>
            טוען פרטי משתמש...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const greetingText = `שלום, ${user.fullName}`;
  const subtitleText = user.hasContract ? 'משתמש עם הסכם' : 'משתמש ללא הסכם';
  const contractStatusText = user.hasContract ? 'יש הסכם' : 'אין הסכם';
  const contractStatusColor = user.hasContract ? designColors.success : designColors.warning;
  const travelDateText = formatDate(user.travelDate);
  const pushTokenStatusText = user.pushToken ? 'רשום להתראות ✓' : 'לא רשום להתראות';
  const pushTokenStatusColor = user.pushToken ? designColors.success : designColors.error;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{greetingText}</Text>
          <Text style={styles.subtitle}>{subtitleText}</Text>
        </View>

        {/* User Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פרטים אישיים</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{user.fullName}</Text>
              <Text style={styles.infoLabel}>שם מלא</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{user.city}</Text>
              <Text style={styles.infoLabel}>עיר</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{user.phoneNumber || 'לא הוזן'}</Text>
              <Text style={styles.infoLabel}>טלפון</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{user.email || 'לא הוזן'}</Text>
              <Text style={styles.infoLabel}>אימייל</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.statusBadge, { backgroundColor: contractStatusColor + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: contractStatusColor }]}>
                  {contractStatusText}
                </Text>
              </View>
              <Text style={styles.infoLabel}>סטטוס הסכם</Text>
            </View>
          </View>
        </View>

        {/* Travel Info Section (only if has contract) */}
        {user.hasContract && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>פרטי נסיעה</Text>
            <View style={styles.card}>
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoValue}>{travelDateText}</Text>
                <Text style={styles.infoLabel}>תאריך נסיעה</Text>
              </View>
            </View>
          </View>
        )}

        {/* Push Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>התראות</Text>
          <View style={styles.card}>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.statusBadge, { backgroundColor: pushTokenStatusColor + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: pushTokenStatusColor }]}>
                  {pushTokenStatusText}
                </Text>
              </View>
              <Text style={styles.infoLabel}>סטטוס התראות</Text>
            </View>

            {/* Info about automatic registration */}
            {isRegisteringPush && (
              <View style={styles.infoCard}>
                <Text style={styles.infoText}>
                  ⏳ מבצע רישום להתראות... אנא המתן.
                </Text>
              </View>
            )}

            {/* Success message if registered */}
            {user.pushToken && !isRegisteringPush && (
              <View style={styles.successCard}>
                <Text style={styles.successText}>
                  ✅ רשום בהצלחה להתראות!{'\n\n'}
                  תקבל התראות על:{'\n'}
                  • עדכוני משימות{'\n'}
                  • שינויים במכולות{'\n'}
                  • עדכוני לוח זמנים
                </Text>
              </View>
            )}

            {/* Warning if push token is null */}
            {!user.pushToken && !isRegisteringPush && (
              <View style={styles.warningCard}>
                <Text style={styles.warningText}>
                  ⚠️ לא רשום להתראות!{'\n\n'}
                  לחץ על הכפתור למטה כדי להירשם ולקבל עדכונים על משימות, מכולות ולוח זמנים.{'\n\n'}
                  💡 שים לב: התראות עובדות רק על מכשיר פיזי (לא על סימולטור).
                </Text>
              </View>
            )}

            {/* Register for Push Notifications Button */}
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={handleRegisterPushNotifications}
              disabled={isRegisteringPush}
            >
              {isRegisteringPush ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.notificationButtonText}>
                  {user.pushToken ? 'רענן רישום להתראות' : 'הירשם להתראות'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Test Notification Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleTestNotification}
            >
              <Text style={styles.buttonText}>שלח התראת בדיקה (3 התראות)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
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
            <Text style={styles.modalText}>
              האם אתה בטוח שברצונך להתנתק מהמערכת?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
              >
                <Text style={styles.modalButtonText}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>התנתק</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
