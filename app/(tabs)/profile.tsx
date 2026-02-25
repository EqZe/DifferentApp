
import { designColors, typography, spacing, radius, shadows, layout } from '@/styles/designSystem';
import { useUser } from '@/contexts/UserContext';
import LottieView from 'lottie-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { sendTestTaskReminders, registerForPushNotificationsAsync } from '@/utils/notifications';
import { IconSymbol } from '@/components/IconSymbol';
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
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
    color: designColors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: designColors.text.secondary,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as any,
    color: designColors.text.primary,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: designColors.surface.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  infoIcon: {
    marginRight: spacing.md,
  },
  infoLabel: {
    fontSize: typography.sizes.sm,
    color: designColors.text.secondary,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium as any,
    color: designColors.text.primary,
  },
  button: {
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.sm,
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
    fontWeight: typography.weights.semibold as any,
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as any,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: designColors.surface.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '80%',
    maxWidth: 400,
    ...shadows.lg,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold as any,
    color: designColors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: typography.sizes.md,
    color: designColors.text.secondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: designColors.surface.elevated,
  },
  modalButtonConfirm: {
    backgroundColor: designColors.error.main,
  },
  modalButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
  },
  modalButtonTextCancel: {
    color: designColors.text.primary,
  },
  modalButtonTextConfirm: {
    color: '#FFFFFF',
  },
  warningCard: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  warningTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    color: '#856404',
    marginBottom: spacing.xs,
  },
  warningText: {
    fontSize: typography.sizes.sm,
    color: '#856404',
    lineHeight: 20,
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
    return 'תאריך לא תקין';
  }
}

export default function ProfileScreen() {
  const { user, session, refreshUser, registerPushNotifications, isRegisteringPush } = useUser();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const colorScheme = useColorScheme();
  const router = useRouter();

  // Check if push token needs to be updated (old raw token format)
  const needsTokenUpdate = user?.pushToken && !user.pushToken.startsWith('ExponentPushToken[');

  useEffect(() => {
    console.log('ProfileScreen: Component mounted');
    console.log('ProfileScreen: User:', user?.fullName);
    console.log('ProfileScreen: Session:', session ? 'exists' : 'null');
  }, [user, session]);

  useEffect(() => {
    console.log('ProfileScreen: Refreshing user data on mount');
    refreshUser();
  }, [refreshUser]);

  const handleLogout = () => {
    console.log('ProfileScreen: User tapped logout button');
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    console.log('ProfileScreen: User confirmed logout');
    setShowLogoutModal(false);
    
    try {
      console.log('ProfileScreen: Signing out from Supabase');
      const { error } = await api.signOut();
      
      if (error) {
        console.error('ProfileScreen: Logout error:', error);
        Alert.alert('שגיאה', 'אירעה שגיאה בהתנתקות. אנא נסה שוב.');
        return;
      }
      
      console.log('ProfileScreen: ✅ Logout successful, navigating to index');
      router.replace('/');
    } catch (error) {
      console.error('ProfileScreen: Unexpected logout error:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בהתנתקות. אנא נסה שוב.');
    }
  };

  const handleTestNotification = async () => {
    console.log('ProfileScreen: User tapped test notification button');
    
    try {
      await sendTestTaskReminders('בדיקת התראות מערכת');
      Alert.alert(
        'התראות נשלחו',
        'שלוש התראות בדיקה נשלחו. בדוק את מרכז ההתראות שלך.',
        [{ text: 'אישור' }]
      );
    } catch (error: any) {
      console.error('ProfileScreen: Test notification error:', error);
      Alert.alert(
        'שגיאה',
        error?.message || 'לא ניתן לשלוח התראות בדיקה',
        [{ text: 'אישור' }]
      );
    }
  };

  const handleRegisterPushNotifications = async () => {
    console.log('ProfileScreen: User tapped register push notifications button');
    
    try {
      const token = await registerPushNotifications();
      
      if (token) {
        Alert.alert(
          'הצלחה',
          'התראות Push הופעלו בהצלחה! תקבל עדכונים על משימות, מכולות ולוח זמנים.',
          [{ text: 'אישור' }]
        );
      } else {
        Alert.alert(
          'שים לב',
          'לא ניתן להפעיל התראות. ודא שאתה משתמש במכשיר פיזי ושהרשאות ההתראות מופעלות.',
          [{ text: 'אישור' }]
        );
      }
    } catch (error: any) {
      console.error('ProfileScreen: Push notification registration error:', error);
      Alert.alert(
        'שגיאה',
        error?.message || 'לא ניתן להפעיל התראות Push',
        [{ text: 'אישור' }]
      );
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={designColors.primary.main} />
          <Text style={{ marginTop: spacing.md, color: designColors.text.secondary }}>
            טוען פרופיל...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const contractStatusText = user.hasContract ? 'חתום' : 'לא חתום';
  const contractStatusColor = user.hasContract ? designColors.success.main : designColors.warning.main;
  const pushTokenStatusText = user.pushToken ? 'פעיל' : 'לא פעיל';
  const pushTokenStatusColor = user.pushToken ? designColors.success.main : designColors.error.main;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>שלום, {user.fullName}</Text>
          <Text style={styles.subtitle}>ניהול הפרופיל שלך</Text>
        </View>

        {/* Warning Card for Token Update */}
        {needsTokenUpdate && (
          <View style={styles.section}>
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>⚠️ נדרש עדכון התראות</Text>
              <Text style={styles.warningText}>
                מערכת ההתראות עודכנה. יש לרשום מחדש את ההתראות כדי לקבל עדכונים על משימות ומכולות.
                {'\n\n'}
                לחץ על כפתור "רישום מחדש להתראות Push" למטה.
              </Text>
            </View>
          </View>
        )}

        {/* User Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פרטים אישיים</Text>
          
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <IconSymbol 
                ios_icon_name="person.fill" 
                android_material_icon_name="person"
                size={24} 
                color={designColors.primary.main}
                style={styles.infoIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>שם מלא</Text>
                <Text style={styles.infoValue}>{user.fullName}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <IconSymbol 
                ios_icon_name="location.fill" 
                android_material_icon_name="location-on"
                size={24} 
                color={designColors.primary.main}
                style={styles.infoIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>עיר</Text>
                <Text style={styles.infoValue}>{user.city}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <IconSymbol 
                ios_icon_name="phone.fill" 
                android_material_icon_name="phone"
                size={24} 
                color={designColors.primary.main}
                style={styles.infoIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>טלפון</Text>
                <Text style={styles.infoValue}>{user.phoneNumber}</Text>
              </View>
            </View>

            {user.email && (
              <View style={styles.infoRow}>
                <IconSymbol 
                  ios_icon_name="envelope.fill" 
                  android_material_icon_name="email"
                  size={24} 
                  color={designColors.primary.main}
                  style={styles.infoIcon}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoLabel}>אימייל</Text>
                  <Text style={styles.infoValue}>{user.email}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoRow}>
              <IconSymbol 
                ios_icon_name="calendar" 
                android_material_icon_name="calendar-today"
                size={24} 
                color={designColors.primary.main}
                style={styles.infoIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>תאריך נסיעה</Text>
                <Text style={styles.infoValue}>{formatDate(user.travelDate)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>סטטוס</Text>
          
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <IconSymbol 
                ios_icon_name="doc.text.fill" 
                android_material_icon_name="description"
                size={24} 
                color={designColors.primary.main}
                style={styles.infoIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>חוזה</Text>
                <View style={[styles.statusBadge, { backgroundColor: contractStatusColor }]}>
                  <Text style={styles.statusText}>{contractStatusText}</Text>
                </View>
              </View>
            </View>

            <View style={styles.infoRow}>
              <IconSymbol 
                ios_icon_name="bell.fill" 
                android_material_icon_name="notifications"
                size={24} 
                color={designColors.primary.main}
                style={styles.infoIcon}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>התראות Push</Text>
                <View style={[styles.statusBadge, { backgroundColor: pushTokenStatusColor }]}>
                  <Text style={styles.statusText}>{pushTokenStatusText}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פעולות</Text>
          
          {/* Register/Re-register Push Notifications Button */}
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleRegisterPushNotifications}
            disabled={isRegisteringPush}
          >
            {isRegisteringPush ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                {needsTokenUpdate ? 'רישום מחדש להתראות Push' : user.pushToken ? 'רישום מחדש להתראות Push' : 'הפעל התראות Push'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Test Notification Button */}
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleTestNotification}
          >
            <Text style={styles.buttonText}>שלח התראת בדיקה</Text>
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            style={[styles.button, styles.buttonDanger]}
            onPress={handleLogout}
          >
            <Text style={styles.buttonText}>התנתק</Text>
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
              האם אתה בטוח שברצונך להתנתק מהמערכת?
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
                onPress={confirmLogout}
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
