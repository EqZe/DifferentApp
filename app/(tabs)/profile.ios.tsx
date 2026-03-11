
import React, { useState, useEffect } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { designColors, typography, spacing, radius, shadows } from '@/styles/designSystem';
import { useRouter } from 'expo-router';
import { useOneSignal } from '@/contexts/OneSignalContext';
import { useUser } from '@/contexts/UserContext';
import { IconSymbol } from '@/components/IconSymbol';
import { api } from '@/utils/api';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designColors.light.backgroundSecondary,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  headerGradient: {
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  userName: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold as any,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  userSubtitle: {
    fontSize: typography.sizes.md,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    marginTop: spacing.md,
  },
  statusBadgeText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as any,
    color: '#FFFFFF',
    marginLeft: spacing.xs,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    marginTop: -spacing.xl,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  cardTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold as any,
    color: designColors.text.primary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: designColors.light.divider,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: designColors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  infoContent: {
    flex: 1,
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  actionButtonPrimary: {
    backgroundColor: designColors.primary,
  },
  actionButtonSecondary: {
    backgroundColor: designColors.secondary,
  },
  actionButtonDanger: {
    backgroundColor: designColors.error,
  },
  actionButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    color: '#FFFFFF',
    marginLeft: spacing.sm,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    ...shadows.md,
  },
  notificationCardSuccess: {
    borderLeftColor: designColors.success,
    backgroundColor: designColors.successBg,
  },
  notificationCardWarning: {
    borderLeftColor: designColors.warning,
    backgroundColor: designColors.warningBg,
  },
  notificationCardInfo: {
    borderLeftColor: designColors.info,
    backgroundColor: designColors.infoBg,
  },
  notificationTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold as any,
    marginBottom: spacing.xs,
  },
  notificationText: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: width * 0.85,
    maxWidth: 400,
    ...shadows.xl,
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
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: designColors.light.backgroundSecondary,
  },
  modalButtonConfirm: {
    backgroundColor: designColors.error,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designColors.light.backgroundSecondary,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
    color: designColors.text.secondary,
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
        return;
      }
      
      console.log('ProfileScreen: ✅ Logout successful, navigating to index');
      router.replace('/');
    } catch (error) {
      console.error('ProfileScreen: Unexpected logout error:', error);
    }
  };

  const handleRegisterPushNotifications = async () => {
    console.log('ProfileScreen: User tapped register push button');
    setIsRequestingPermission(true);
    
    try {
      const granted = await requestPermission();
      console.log('ProfileScreen: Permission granted:', granted);
      
      // Manually trigger handshake after permission granted
      if (granted && user?.authUserId) {
        console.log('🔔 ProfileScreen: Manually triggering OneSignal handshake...');
        console.log('🔔 ProfileScreen: User ID:', user.authUserId);
        try {
          const OneSignal = require('react-native-onesignal').default;
          OneSignal.login(user.authUserId);
          console.log('🔔 ProfileScreen: ✅ Manual handshake complete');
          console.log('🔔 ProfileScreen: User should now appear in OneSignal dashboard');
          console.log('🔔 ProfileScreen: External User ID:', user.authUserId);
        } catch (error) {
          console.error('🔔 ProfileScreen: ❌ Manual handshake failed:', error);
        }
      }
    } catch (error: any) {
      console.error('ProfileScreen: Push notification registration error:', error);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={designColors.primary} />
        <Text style={styles.loadingText}>טוען פרופיל...</Text>
      </View>
    );
  }

  const contractStatusText = user.hasContract ? 'חוזה חתום' : 'ממתין לחתימה';
  const contractStatusColor = user.hasContract ? designColors.success : designColors.warning;
  const contractStatusIcon = user.hasContract ? 'check-circle' : 'schedule';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={[designColors.primary, designColors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Animated.View entering={FadeIn.duration(600)} style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <IconSymbol 
                ios_icon_name="person.fill" 
                android_material_icon_name="person"
                size={50} 
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.userName}>{user.fullName}</Text>
            <Text style={styles.userSubtitle}>{user.city}</Text>
            
            <View style={[styles.statusBadge, { backgroundColor: contractStatusColor }]}>
              <IconSymbol 
                ios_icon_name={user.hasContract ? 'checkmark.circle.fill' : 'clock.fill'} 
                android_material_icon_name={contractStatusIcon}
                size={16} 
                color="#FFFFFF"
              />
              <Text style={styles.statusBadgeText}>{contractStatusText}</Text>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Personal Information Card */}
          <Animated.View entering={FadeInDown.delay(100).duration(600)}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>פרטים אישיים</Text>
              
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <IconSymbol 
                    ios_icon_name="person.fill" 
                    android_material_icon_name="person"
                    size={20} 
                    color={designColors.primary}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>שם מלא</Text>
                  <Text style={styles.infoValue}>{user.fullName}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <IconSymbol 
                    ios_icon_name="location.fill" 
                    android_material_icon_name="location-on"
                    size={20} 
                    color={designColors.primary}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>עיר</Text>
                  <Text style={styles.infoValue}>{user.city}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <IconSymbol 
                    ios_icon_name="phone.fill" 
                    android_material_icon_name="phone"
                    size={20} 
                    color={designColors.primary}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>טלפון</Text>
                  <Text style={styles.infoValue}>{user.phoneNumber}</Text>
                </View>
              </View>

              {user.email && (
                <View style={styles.infoRow}>
                  <View style={styles.infoIcon}>
                    <IconSymbol 
                      ios_icon_name="envelope.fill" 
                      android_material_icon_name="email"
                      size={20} 
                      color={designColors.primary}
                    />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>אימייל</Text>
                    <Text style={styles.infoValue}>{user.email}</Text>
                  </View>
                </View>
              )}

              <View style={[styles.infoRow, styles.infoRowLast]}>
                <View style={styles.infoIcon}>
                  <IconSymbol 
                    ios_icon_name="calendar" 
                    android_material_icon_name="calendar-today"
                    size={20} 
                    color={designColors.primary}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>תאריך נסיעה</Text>
                  <Text style={styles.infoValue}>{formatDate(user.travelDate)}</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Notification Status */}
          <Animated.View entering={FadeInDown.delay(200).duration(600)}>
            {isInitialized && hasPermission && playerId ? (
              <View style={[styles.notificationCard, styles.notificationCardSuccess]}>
                <Text style={[styles.notificationTitle, { color: designColors.success }]}>
                  ✅ התראות מופעלות
                </Text>
                <Text style={[styles.notificationText, { color: designColors.success }]}>
                  תקבל עדכונים על משימות, מכולות ולוח זמנים
                </Text>
              </View>
            ) : isInitialized && !hasPermission ? (
              <View style={[styles.notificationCard, styles.notificationCardWarning]}>
                <Text style={[styles.notificationTitle, { color: designColors.warning }]}>
                  ⚠️ התראות לא מופעלות
                </Text>
                <Text style={[styles.notificationText, { color: designColors.warning }]}>
                  הפעל התראות כדי לקבל עדכונים חשובים
                </Text>
              </View>
            ) : (
              <View style={[styles.notificationCard, styles.notificationCardInfo]}>
                <Text style={[styles.notificationTitle, { color: designColors.info }]}>
                  ℹ️ מערכת התראות
                </Text>
                <Text style={[styles.notificationText, { color: designColors.info }]}>
                  OneSignal מאותחל במצב Runtime
                </Text>
              </View>
            )}
          </Animated.View>

          {/* Actions */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)}>
            {!hasPermission && (
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSecondary]}
                onPress={handleRegisterPushNotifications}
                disabled={isRequestingPermission}
              >
                {isRequestingPermission ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <IconSymbol 
                      ios_icon_name="bell.fill" 
                      android_material_icon_name="notifications"
                      size={20} 
                      color="#FFFFFF"
                    />
                    <Text style={styles.actionButtonText}>הפעל התראות</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonDanger]}
              onPress={handleLogout}
            >
              <IconSymbol 
                ios_icon_name="arrow.right.square.fill" 
                android_material_icon_name="logout"
                size={20} 
                color="#FFFFFF"
              />
              <Text style={styles.actionButtonText}>התנתק</Text>
            </TouchableOpacity>
          </Animated.View>
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
          <Animated.View entering={FadeIn.duration(300)} style={styles.modalContent}>
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
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
