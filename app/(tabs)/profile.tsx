
import React, { useState, useEffect } from 'react';
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
    console.error('ProfileScreen: Error formatting date', error);
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
        console.log('ProfileScreen: User data incomplete, refreshing...');
        setIsRefreshing(true);
        const loadStartTime = Date.now();
        
        try {
          await refreshUser();
          
          // Check if loading took less than 1 second
          const loadDuration = Date.now() - loadStartTime;
          
          if (loadDuration < 1000) {
            // If it loaded quickly (< 1 second), don't show loader at all
            console.log('ProfileScreen: Data loaded quickly (', loadDuration, 'ms), skipping loader');
          } else {
            // Ensure loading animation displays for at least 2.5 seconds
            const remainingTime = Math.max(0, 2500 - loadDuration);
            
            if (remainingTime > 0) {
              console.log('ProfileScreen: Waiting', remainingTime, 'ms to ensure 2.5 second minimum loading display');
              await new Promise(resolve => setTimeout(resolve, remainingTime));
            }
          }
        } catch (error) {
          console.error('ProfileScreen: Failed to refresh user data', error);
          
          // Still ensure 2.5 second minimum display even on error
          const loadDuration = Date.now() - loadStartTime;
          const remainingTime = Math.max(0, 2500 - loadDuration);
          
          if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
          }
        } finally {
          setIsRefreshing(false);
        }
      }
    };

    loadUserData();
  }, [session, user, refreshUser]);

  const handleLogout = async () => {
    console.log('User tapped Logout button');
    setShowLogoutModal(false);
    
    try {
      await api.signOut();
      setUser(null);
      console.log('User logged out successfully, redirecting to register');
      router.replace('/register');
    } catch (error) {
      console.error('Logout error:', error);
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
      {/* Modern Header with Enhanced Gradient */}
      <View style={styles.headerWrapper}>
        {/* Enhanced Multi-layer Gradient Background */}
        <LinearGradient
          colors={isDark 
            ? ['#1e3a8a', '#2563eb', '#3b82f6'] 
            : ['#2563eb', '#3b82f6', '#60a5fa']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Subtle Overlay Pattern */}
        <View style={styles.patternOverlay} />
        
        {/* Lottie Animation Layer - Centered and Lower */}
        <View style={styles.lottieContainer}>
          <LottieView
            source={{ uri: 'https://lottie.host/200cc226-843c-464f-a346-c8faad8e7407/8Y1UmkMrvF.json' }}
            autoPlay
            loop
            style={styles.lottieAnimation}
            resizeMode="contain"
          />
        </View>
        
        {/* Header Content */}
        <SafeAreaView style={styles.header} edges={['top']}>
          {/* Avatar Container */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarBackground}>
              <View style={styles.avatarRing}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={56}
                  color="#FFFFFF"
                />
              </View>
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

      {/* Smooth Curved Separator */}
      <View style={styles.curvedSeparator}>
        <LinearGradient
          colors={[
            isDark ? '#3b82f6' : '#60a5fa',
            isDark ? designColors.dark.background : designColors.light.background,
          ]}
          locations={[0, 0.8]}
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
  
  // Enhanced Modern Header
  headerWrapper: {
    height: 300,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'visible',
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    zIndex: 10,
  },
  lottieContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 11,
  },
  lottieAnimation: {
    width: 240,
    height: 240,
    opacity: 0.4,
  },
  header: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: spacing.lg,
    zIndex: 12,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatarBackground: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.xl,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  userName: {
    ...typography.h1,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
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

  // Smooth Curved Separator
  curvedSeparator: {
    position: 'absolute',
    top: 300,
    left: 0,
    right: 0,
    height: 80,
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
    marginTop: 380,
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
