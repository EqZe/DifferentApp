
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import { designColors, typography, spacing, radius, shadows } from '@/styles/designSystem';
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
import { useOneSignal } from '@/contexts/OneSignalContext';
import { useUser } from '@/contexts/UserContext';
import { api } from '@/utils/api';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { IconSymbol } from '@/components/IconSymbol';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';

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
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold as any,
    color: designColors.text.primary,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: designColors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: designColors.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: designColors.text.secondary,
  },
  infoValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium as any,
    color: designColors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: designColors.primary + '20',
  },
  statusText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as any,
    color: designColors.primary,
  },
  logoutButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: designColors.error,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.sm,
  },
  logoutButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
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
    width: width * 0.85,
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
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
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
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
  },
  modalButtonTextCancel: {
    color: designColors.text.primary,
  },
  modalButtonTextConfirm: {
    color: '#FFFFFF',
  },
  oneSignalSection: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: designColors.primary + '10',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: designColors.primary + '30',
  },
  oneSignalTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold as any,
    color: designColors.primary,
    marginBottom: spacing.sm,
  },
  oneSignalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  oneSignalLabel: {
    fontSize: typography.sizes.sm,
    color: designColors.text.secondary,
    flex: 1,
  },
  oneSignalValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium as any,
    color: designColors.text.primary,
  },
  oneSignalStatus: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold as any,
  },
  oneSignalStatusActive: {
    color: '#10B981',
  },
  oneSignalStatusInactive: {
    color: designColors.error,
  },
  oneSignalNote: {
    fontSize: typography.sizes.xs,
    color: designColors.text.secondary,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  requestPermissionButton: {
    marginTop: spacing.md,
    backgroundColor: designColors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  requestPermissionButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold as any,
    color: '#FFFFFF',
  },
  debugWarning: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: '#FEF3C7',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  debugWarningText: {
    fontSize: typography.sizes.xs,
    color: '#92400E',
    fontWeight: typography.weights.medium as any,
  },
});

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) {
    const notSetText = 'לא הוגדר';
    return notSetText;
  }
  
  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
    return formattedDate;
  } catch (error) {
    console.error('Error formatting date:', error);
    const errorText = 'תאריך לא תקין';
    return errorText;
  }
}

export default function ProfileScreen() {
  const { user, session, refreshUser } = useUser();
  const { isInitialized, hasPermission, playerId, externalUserId, isSubscribed, requestPermission, runDiagnostics } = useOneSignal();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  useEffect(() => {
    console.log('ProfileScreen: Component mounted');
    refreshUser();
  }, []);

  useEffect(() => {
    console.log('ProfileScreen: User or session changed');
    console.log('ProfileScreen: user exists:', !!user);
    console.log('ProfileScreen: session exists:', !!session);
    
    if (!user && !session) {
      console.log('ProfileScreen: No user or session, redirecting to register');
      router.replace('/register');
    }
  }, [user, session, router]);

  const handleLogout = () => {
    console.log('ProfileScreen: Logout button pressed');
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    console.log('ProfileScreen: Logout confirmed');
    setIsLoggingOut(true);
    
    try {
      console.log('ProfileScreen: Calling supabase.auth.signOut()');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('ProfileScreen: Logout error:', error);
        throw error;
      }
      
      console.log('ProfileScreen: ✅ Logout successful');
      setShowLogoutModal(false);
      router.replace('/register');
    } catch (error: any) {
      console.error('ProfileScreen: ❌ Logout failed:', error);
      console.error('ProfileScreen: Error message:', error?.message);
      setShowLogoutModal(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleRequestPermission = async () => {
    console.log('ProfileScreen: Request permission button pressed');
    setIsRequestingPermission(true);
    
    try {
      const granted = await requestPermission();
      console.log('ProfileScreen: Permission result:', granted);
      
      if (granted) {
        console.log('ProfileScreen: ✅ Permission granted successfully');
      } else {
        console.log('ProfileScreen: ⚠️ Permission denied or unavailable');
      }
    } catch (error) {
      console.error('ProfileScreen: ❌ Permission request error:', error);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleRunDiagnostics = async () => {
    console.log('ProfileScreen: Running OneSignal diagnostics...');
    await runDiagnostics();
    console.log('ProfileScreen: Diagnostics complete - check console logs above');
  };

  if (!user) {
    const loadingText = 'טוען...';
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={designColors.primary} />
          <Text style={{ marginTop: spacing.md, color: designColors.text.secondary }}>
            {loadingText}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const greetingText = 'שלום';
  const personalInfoTitle = 'מידע אישי';
  const fullNameLabel = 'שם מלא';
  const emailLabel = 'אימייל';
  const phoneLabel = 'טלפון';
  const cityLabel = 'עיר';
  const travelDateLabel = 'תאריך טיסה';
  const contractStatusLabel = 'סטטוס חוזה';
  const contractActiveText = 'חוזה פעיל';
  const contractInactiveText = 'ללא חוזה';
  const logoutButtonText = 'התנתק';
  const logoutModalTitle = 'האם אתה בטוח?';
  const logoutModalMessage = 'האם אתה בטוח שברצונך להתנתק מהחשבון?';
  const cancelButtonText = 'ביטול';
  const confirmButtonText = 'התנתק';
  const loggingOutText = 'מתנתק...';
  const oneSignalTitle = 'מצב התראות (OneSignal)';
  const oneSignalInitializedLabel = 'מערכת מאותחלת';
  const oneSignalPermissionLabel = 'הרשאות';
  const oneSignalPlayerIdLabel = 'מזהה מכשיר (Player ID)';
  const oneSignalUserIdLabel = 'מזהה משתמש (External ID)';
  const oneSignalSubscribedLabel = 'מנוי להתראות';
  const oneSignalYesText = 'כן';
  const oneSignalNoText = 'לא';
  const oneSignalGrantedText = 'ניתנו';
  const oneSignalNotGrantedText = 'לא ניתנו';
  const oneSignalNoteText = 'התראות Push עובדות רק במכשירים פיזיים (iOS/Android). לא עובד בדפדפן או סימולטור.';
  const requestPermissionButtonText = 'בקש הרשאות התראות';
  const requestingPermissionText = 'מבקש הרשאות...';

  const initializedText = isInitialized ? oneSignalYesText : oneSignalNoText;
  const permissionText = hasPermission ? oneSignalGrantedText : oneSignalNotGrantedText;
  const subscribedText = isSubscribed ? oneSignalYesText : oneSignalNoText;
  const playerIdText = playerId || 'לא זמין';
  const externalUserIdText = externalUserId || user.authUserId || 'לא זמין';
  const statusText = isInitialized && hasPermission && playerId ? 'פעיל ✅' : 'לא פעיל ❌';

  const isFullyConfigured = isInitialized && hasPermission && playerId && externalUserId;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={colorScheme === 'dark' ? ['#1a1a1a', '#0a0a0a'] : ['#f8f9fa', '#ffffff']}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
            <Text style={styles.greeting}>{greetingText}, {user.fullName}</Text>
            <Text style={styles.subtitle}>{user.email}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>{personalInfoTitle}</Text>
            <View style={styles.card}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{fullNameLabel}</Text>
                <Text style={styles.infoValue}>{user.fullName}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{emailLabel}</Text>
                <Text style={styles.infoValue}>{user.email}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{phoneLabel}</Text>
                <Text style={styles.infoValue}>{user.phoneNumber}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{cityLabel}</Text>
                <Text style={styles.infoValue}>{user.city}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{travelDateLabel}</Text>
                <Text style={styles.infoValue}>{formatDate(user.travelDate)}</Text>
              </View>
              
              <View style={[styles.infoRow, styles.infoRowLast]}>
                <Text style={styles.infoLabel}>{contractStatusLabel}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {user.hasContract ? contractActiveText : contractInactiveText}
                  </Text>
                </View>
              </View>

              <View style={styles.oneSignalSection}>
                <Text style={styles.oneSignalTitle}>{oneSignalTitle}</Text>
                
                <View style={styles.oneSignalRow}>
                  <Text style={styles.oneSignalLabel}>{oneSignalInitializedLabel}:</Text>
                  <Text style={[
                    styles.oneSignalValue,
                    styles.oneSignalStatus,
                    isInitialized ? styles.oneSignalStatusActive : styles.oneSignalStatusInactive
                  ]}>
                    {initializedText}
                  </Text>
                </View>
                
                <View style={styles.oneSignalRow}>
                  <Text style={styles.oneSignalLabel}>{oneSignalPermissionLabel}:</Text>
                  <Text style={[
                    styles.oneSignalValue,
                    styles.oneSignalStatus,
                    hasPermission ? styles.oneSignalStatusActive : styles.oneSignalStatusInactive
                  ]}>
                    {permissionText}
                  </Text>
                </View>
                
                <View style={styles.oneSignalRow}>
                  <Text style={styles.oneSignalLabel}>{oneSignalSubscribedLabel}:</Text>
                  <Text style={[
                    styles.oneSignalValue,
                    styles.oneSignalStatus,
                    isSubscribed ? styles.oneSignalStatusActive : styles.oneSignalStatusInactive
                  ]}>
                    {subscribedText}
                  </Text>
                </View>
                
                <View style={styles.oneSignalRow}>
                  <Text style={styles.oneSignalLabel}>{oneSignalPlayerIdLabel}:</Text>
                  <Text style={styles.oneSignalValue} numberOfLines={1}>
                    {playerIdText}
                  </Text>
                </View>
                
                <View style={styles.oneSignalRow}>
                  <Text style={styles.oneSignalLabel}>{oneSignalUserIdLabel}:</Text>
                  <Text style={styles.oneSignalValue} numberOfLines={1}>
                    {externalUserIdText}
                  </Text>
                </View>
                
                <View style={styles.oneSignalRow}>
                  <Text style={styles.oneSignalLabel}>סטטוס כללי:</Text>
                  <Text style={[
                    styles.oneSignalValue,
                    styles.oneSignalStatus,
                    isFullyConfigured ? styles.oneSignalStatusActive : styles.oneSignalStatusInactive
                  ]}>
                    {statusText}
                  </Text>
                </View>
                
                <Text style={styles.oneSignalNote}>{oneSignalNoteText}</Text>
                
                {Platform.OS === 'web' && (
                  <View style={styles.debugWarning}>
                    <Text style={styles.debugWarningText}>
                      ⚠️ אתה רואה את זה בדפדפן. OneSignal לא יעבוד כאן. השתמש במכשיר פיזי Android או iOS.
                    </Text>
                  </View>
                )}
                
                {Platform.OS !== 'web' && !hasPermission && (
                  <TouchableOpacity
                    style={styles.requestPermissionButton}
                    onPress={handleRequestPermission}
                    disabled={isRequestingPermission}
                  >
                    {isRequestingPermission ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.requestPermissionButtonText}>
                        {requestPermissionButtonText}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
                
                {Platform.OS !== 'web' && (
                  <TouchableOpacity
                    style={[styles.requestPermissionButton, { backgroundColor: '#6B7280', marginTop: spacing.sm }]}
                    onPress={handleRunDiagnostics}
                  >
                    <Text style={styles.requestPermissionButtonText}>
                      🔍 הרץ אבחון מלא (בדוק לוגים)
                    </Text>
                  </TouchableOpacity>
                )}
                
                {Platform.OS !== 'web' && hasPermission && !playerId && (
                  <View style={styles.debugWarning}>
                    <Text style={styles.debugWarningText}>
                      ⚠️ הרשאות ניתנו אבל Player ID חסר. בדוק את הלוגים בקונסול.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              disabled={isLoggingOut}
            >
              <Text style={styles.logoutButtonText}>{logoutButtonText}</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>

        <Modal
          visible={showLogoutModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLogoutModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View entering={FadeIn.duration(200)} style={styles.modalContent}>
              <Text style={styles.modalTitle}>{logoutModalTitle}</Text>
              <Text style={styles.modalMessage}>{logoutModalMessage}</Text>
              
              {isLoggingOut ? (
                <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
                  <ActivityIndicator size="large" color={designColors.primary} />
                  <Text style={{ marginTop: spacing.md, color: designColors.text.secondary }}>
                    {loggingOutText}
                  </Text>
                </View>
              ) : (
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => setShowLogoutModal(false)}
                  >
                    <Text style={[styles.modalButtonText, styles.modalButtonTextCancel]}>
                      {cancelButtonText}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                    onPress={confirmLogout}
                  >
                    <Text style={[styles.modalButtonText, styles.modalButtonTextConfirm]}>
                      {confirmButtonText}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}
