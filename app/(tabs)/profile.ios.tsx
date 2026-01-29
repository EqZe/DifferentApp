
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  I18nManager,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { useUser } from '@/contexts/UserContext';
import { api } from '@/utils/api';
import { designColors, typography, spacing, radius, shadows, layout } from '@/styles/designSystem';
import LottieView from 'lottie-react-native';

// Enable RTL for Hebrew
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'לא נקבע';
  
  try {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('ProfileScreen (iOS): Error formatting date', error);
    return 'לא נקבע';
  }
}

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, setUser, refreshUser, session } = useUser();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh user data when screen loads if user data seems incomplete
  useEffect(() => {
    const loadUserData = async () => {
      if (session && (!user || !user.fullName)) {
        console.log('ProfileScreen (iOS): User data incomplete, refreshing...');
        setIsRefreshing(true);
        try {
          await refreshUser();
        } catch (error) {
          console.error('ProfileScreen (iOS): Failed to refresh user data', error);
        } finally {
          setIsRefreshing(false);
        }
      }
    };

    loadUserData();
  }, [session, user, refreshUser]);

  const handleLogout = async () => {
    console.log('User tapped Logout button (iOS)');
    setShowLogoutModal(false);
    
    try {
      await api.signOut();
      setUser(null);
      console.log('User logged out successfully, redirecting to register (iOS)');
      router.replace('/register');
    } catch (error) {
      console.error('Logout error (iOS):', error);
      // Even if logout fails on backend, clear local state
      setUser(null);
      router.replace('/register');
    }
  };

  // Extract theme colors based on color scheme
  const colors = isDark ? designColors.dark : designColors.light;

  // Show loading state while user data is being fetched
  if (!user || isRefreshing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.loadingContainer}>
          <LottieView
            source={{ uri: 'https://lottie.host/6f61ecb2-edc0-4962-9779-c5cb64c8799e/LgBcgiSDs0.json' }}
            autoPlay
            loop
            style={styles.loadingAnimation}
          />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            טוען פרטי משתמש...
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  // Safely extract user data with fallbacks
  const fullNameText = user?.fullName || 'משתמש';
  const emailText = user?.email || 'לא זמין';
  const phoneText = user?.phoneNumber || 'לא זמין';
  const cityText = user?.city || 'לא זמין';
  const hasContract = user?.hasContract || false;
  const contractStatusText = hasContract ? 'פעיל' : 'לא פעיל';
  const travelDateText = formatDate(user?.travelDate);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Modern Header with Gradient and Lottie */}
      <View style={styles.headerWrapper}>
        {/* Blue Gradient Background */}
        <LinearGradient
          colors={[designColors.primary, designColors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Lottie Animation Layer */}
        <LottieView
          source={{ uri: 'https://lottie.host/fcc59560-b2cd-4dad-85d1-02d5cf35c039/OcOTugphwV.json' }}
          autoPlay
          loop
          style={styles.lottieAnimation}
          resizeMode="cover"
        />
        
        {/* Header Content */}
        <SafeAreaView style={styles.header} edges={['top']}>
          {/* Avatar Container */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBackground}>
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={56}
                color="#FFFFFF"
              />
            </View>
          </View>
          
          {/* User Name */}
          <Text style={styles.userName}>{fullNameText}</Text>
          
          {/* Contract Badge */}
          {hasContract && (
            <View style={styles.contractBadge}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.contractBadgeGradient}
              >
                <IconSymbol
                  ios_icon_name="checkmark.seal.fill"
                  android_material_icon_name="verified"
                  size={16}
                  color="#FFFFFF"
                />
                <Text style={styles.contractBadgeText}>חוזה חתום</Text>
              </LinearGradient>
            </View>
          )}
        </SafeAreaView>
      </View>

      {/* Gradient Separator */}
      <View style={styles.gradientSeparator}>
        <LinearGradient
          colors={[
            '#5cbae6',
            isDark ? designColors.dark.background : designColors.light.background,
          ]}
          locations={[0, 1]}
          style={styles.gradientFill}
        />
      </View>

      {/* Content Section */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Section Header */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          פרטים אישיים
        </Text>

        {/* Info Cards Grid - 2 columns */}
        <View style={styles.cardsGrid}>
          {/* Email Card */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface }, isDark && styles.cardDark]}>
            <View style={styles.cardIconContainer}>
              <IconSymbol
                ios_icon_name="envelope.fill"
                android_material_icon_name="email"
                size={20}
                color={designColors.primary}
              />
            </View>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
              אימייל
            </Text>
            <Text style={[styles.cardValue, { color: colors.text }]} numberOfLines={1}>
              {emailText}
            </Text>
          </View>

          {/* Phone Card */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface }, isDark && styles.cardDark]}>
            <View style={styles.cardIconContainer}>
              <IconSymbol
                ios_icon_name="phone.fill"
                android_material_icon_name="phone"
                size={20}
                color={designColors.primary}
              />
            </View>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
              טלפון
            </Text>
            <Text style={[styles.cardValue, { color: colors.text }]} numberOfLines={1}>
              {phoneText}
            </Text>
          </View>

          {/* City Card */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface }, isDark && styles.cardDark]}>
            <View style={styles.cardIconContainer}>
              <IconSymbol
                ios_icon_name="location.fill"
                android_material_icon_name="location-on"
                size={20}
                color={designColors.primary}
              />
            </View>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
              עיר
            </Text>
            <Text style={[styles.cardValue, { color: colors.text }]} numberOfLines={1}>
              {cityText}
            </Text>
          </View>

          {/* Contract Status Card */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface }, isDark && styles.cardDark]}>
            <View style={styles.cardIconContainer}>
              <IconSymbol
                ios_icon_name="doc.text.fill"
                android_material_icon_name="description"
                size={20}
                color={hasContract ? '#10B981' : '#EF4444'}
              />
            </View>
            <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
              סטטוס חוזה
            </Text>
            <Text style={[
              styles.cardValue,
              { color: hasContract ? '#10B981' : '#EF4444' }
            ]} numberOfLines={1}>
              {contractStatusText}
            </Text>
          </View>
        </View>

        {/* Travel Date Card - Full Width if has contract */}
        {hasContract && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: spacing.xl }]}>
              מידע נוסף
            </Text>
            <View style={[styles.fullWidthCard, { backgroundColor: colors.surface }, isDark && styles.cardDark]}>
              <View style={styles.fullWidthCardIcon}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="calendar-today"
                  size={24}
                  color={designColors.primary}
                />
              </View>
              <View style={styles.fullWidthCardContent}>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>
                  תאריך נסיעה
                </Text>
                <Text style={[styles.cardValue, { color: colors.text, fontSize: 20 }]}>
                  {travelDateText}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            style={styles.logoutGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <IconSymbol
              ios_icon_name="arrow.right.square.fill"
              android_material_icon_name="logout"
              size={22}
              color="#FFFFFF"
            />
            <Text style={styles.logoutText}>התנתק</Text>
          </LinearGradient>
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
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalIconContainer}>
              <View style={styles.modalIconCircle}>
                <IconSymbol
                  ios_icon_name="exclamationmark.triangle.fill"
                  android_material_icon_name="warning"
                  size={32}
                  color="#EF4444"
                />
              </View>
            </View>
            
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              התנתקות
            </Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              האם אתה בטוח שברצונך להתנתק מהמערכת?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, { backgroundColor: colors.backgroundSecondary }]}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  ביטול
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#EF4444', '#DC2626']}
                  style={styles.modalButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
                    התנתק
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingAnimation: {
    width: 200,
    height: 200,
  },
  loadingText: {
    ...typography.body,
    fontWeight: '600',
  },
  
  // Modern Header with Gradient
  headerWrapper: {
    height: 280,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'visible',
  },
  lottieAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 11,
    opacity: 0.6,
  },
  header: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 12,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatarBackground: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    ...shadows.xl,
  },
  userName: {
    ...typography.h1,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  contractBadge: {
    borderRadius: radius.full,
    overflow: 'hidden',
    ...shadows.lg,
  },
  contractBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  contractBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Gradient Separator
  gradientSeparator: {
    position: 'absolute',
    top: 280,
    left: 0,
    right: 0,
    height: 60,
    zIndex: 5,
  },
  gradientFill: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  
  // Content Section
  content: {
    flex: 1,
    marginTop: 340,
  },
  contentContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: 100,
  },
  
  // Section Title
  sectionTitle: {
    ...typography.h3,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'right',
  },
  
  // Info Cards Grid - 2 columns
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  infoCard: {
    width: '47%',
    padding: spacing.md,
    borderRadius: radius.lg,
    ...shadows.sm,
    minHeight: 110,
  },
  cardDark: {
    borderWidth: 1,
    borderColor: designColors.dark.border,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(39, 132, 245, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    alignSelf: 'flex-end',
  },
  cardLabel: {
    ...typography.caption,
    marginBottom: spacing.xs / 2,
    textAlign: 'right',
  },
  cardValue: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'right',
  },
  
  // Full Width Card
  fullWidthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    ...shadows.sm,
    marginBottom: spacing.md,
  },
  fullWidthCardIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: 'rgba(39, 132, 245, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  fullWidthCardContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  
  // Logout Button
  logoutButton: {
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md + 2,
    gap: spacing.sm,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.xl,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.h2,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    ...typography.body,
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
    overflow: 'hidden',
  },
  modalButtonCancel: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalButtonConfirm: {
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalButtonText: {
    ...typography.body,
    fontWeight: '700',
  },
});
