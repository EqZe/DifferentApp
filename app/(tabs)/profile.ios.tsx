
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
import LottieView from 'lottie-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { IconSymbol } from '@/components/IconSymbol';

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
  infoCard: {
    backgroundColor: '#D1ECF1',
    borderLeftWidth: 4,
    borderLeftColor: '#17A2B8',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  infoTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    color: '#0C5460',
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: typography.sizes.sm,
    color: '#0C5460',
    lineHeight: 20,
  },
  debugCard: {
    backgroundColor: '#F8F9FA',
    borderLeftWidth: 4,
    borderLeftColor: '#6C757D',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  debugTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    color: '#495057',
    marginBottom: spacing.xs,
  },
  debugText: {
    fontSize: typography.sizes.sm,
    color: '#495057',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  errorCard: {
    backgroundColor: '#F8D7DA',
    borderLeftWidth: 4,
    borderLeftColor: '#DC3545',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    color: '#721C24',
    marginBottom: spacing.xs,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: '#721C24',
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
  const { user, session, refreshUser } = useUser();
  const { isInitialized, hasPermission, playerId, requestPermission } = useOneSignal();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const colorScheme = useColorScheme();
  const router = useRouter();

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

  const handleRegisterPushNotifications = async () => {
    console.log('ProfileScreen: ========== USER TAPPED REGISTER PUSH BUTTON ==========');
    setIsRequestingPermission(true);
    
    try {
      const granted = await requestPermission();
      console.log('ProfileScreen: Permission granted:', granted);
      
      if (granted) {
        Alert.alert(
          'הצלחה',
          'התראות Push הופעלו בהצלחה! תקבל עדכונים על משימות, מכולות ולוח זמנים.',
          [{ text: 'אישור' }]
        );
      } else {
        Alert.alert(
          'שים לב',
          'לא ניתן להפעיל התראות.\n\nאנא ודא:\n• הרשאות התראות מופעלות בהגדרות המכשיר\n• אתה מחובר לאינטרנט',
          [{ text: 'אישור' }]
        );
      }
    } catch (error: any) {
      console.error('ProfileScreen: ❌ Push notification registration error:', error);
      Alert.alert(
        'שגיאה',
        error?.message || 'לא ניתן להפעיל התראות Push',
        [{ text: 'אישור' }]
      );
    } finally {
      setIsRequestingPermission(false);
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

        {/* Web Platform Info Card */}
        {Platform.OS === 'web' && (
          <View style={styles.section}>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>ℹ️ התראות Push במכשיר נייד בלבד</Text>
              <Text style={styles.infoText}>
                התראות Push זמינות רק באפליקציה במכשיר נייד (Android/iOS).
                {'\n\n'}
                כדי להפעיל התראות, אנא פתח את האפליקציה במכשיר הנייד שלך.
              </Text>
            </View>
          </View>
        )}

        {/* OneSignal Debug Info - Only show on native platforms */}
        {Platform.OS !== 'web' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔔 מידע על התראות (Debug)</Text>
            
            <View style={styles.debugCard}>
              <Text style={styles.debugTitle}>סטטוס OneSignal</Text>
              <Text style={styles.debugText}>
                Platform: {Platform.OS}
                {'\n'}Initialized: {isInitialized ? '✅ Yes' : '❌ No'}
                {'\n'}Permission: {hasPermission ? '✅ Granted' : '❌ Not Granted'}
                {'\n'}Player ID: {playerId || '⚠️ Not available'}
                {'\n'}User ID: {user.authUserId}
              </Text>
            </View>

            {!isInitialized && (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>❌ OneSignal לא מאותחל</Text>
                <Text style={styles.errorText}>
                  OneSignal SDK לא הצליח להתאתחל.
                  {'\n\n'}
                  🔧 פתרון: יש לבנות מחדש את ה-APK/IPA עם app.json המעודכן.
                  {'\n\n'}
                  הבעיה: ה-APK הנוכחי נבנה ללא ה-appId בתצורת onesignal-expo-plugin.
                  {'\n\n'}
                  app.json עודכן כעת עם appId: b732b467-6886-4c7b-b3d9-5010de1199d6
                  {'\n\n'}
                  לאחר בנייה מחדש, OneSignal יאותחל כראוי.
                </Text>
              </View>
            )}

            {isInitialized && !hasPermission && (
              <View style={styles.warningCard}>
                <Text style={styles.warningTitle}>⚠️ נדרשת הרשאה להתראות</Text>
                <Text style={styles.warningText}>
                  כדי לקבל התראות Push, יש ללחוץ על כפתור "הפעל התראות Push" למטה ולאשר את ההרשאה.
                </Text>
              </View>
            )}

            {isInitialized && hasPermission && !playerId && (
              <View style={styles.errorCard}>
                <Text style={styles.errorTitle}>❌ Player ID חסר</Text>
                <Text style={styles.errorText}>
                  OneSignal מאותחל אך Player ID לא זמין. זה עלול להיות בעיה ברשת או בתצורת OneSignal.
                  {'\n\n'}
                  נסה לסגור ולפתוח מחדש את האפליקציה.
                </Text>
              </View>
            )}

            {isInitialized && hasPermission && playerId && (
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>✅ התראות מוכנות!</Text>
                <Text style={styles.infoText}>
                  OneSignal מוגדר כראוי ואתה אמור לקבל התראות כאשר משימות מאושרות או מכולות מתעדכנות.
                  {'\n\n'}
                  Player ID: {playerId.substring(0, 20)}...
                </Text>
              </View>
            )}
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
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פעולות</Text>
          
          {/* Register Push Notifications Button - Only show on native platforms */}
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={handleRegisterPushNotifications}
              disabled={isRequestingPermission}
            >
              {isRequestingPermission ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>
                  {hasPermission ? 'רישום מחדש להתראות Push' : 'הפעל התראות Push'}
                </Text>
              )}
            </TouchableOpacity>
          )}

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
