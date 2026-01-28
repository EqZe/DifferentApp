
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
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { useUser } from '@/contexts/UserContext';
import { api } from '@/utils/api';
import { designColors, typography, spacing, radius, shadows, layout } from '@/styles/designSystem';

const isRTL = I18nManager.isRTL;

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
        try {
          await refreshUser();
        } catch (error) {
          console.error('ProfileScreen: Failed to refresh user data', error);
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
  const backgroundColor = isDark ? designColors.dark.background : designColors.light.background;
  const surfaceColor = isDark ? designColors.dark.surface : designColors.light.surface;
  const textColor = isDark ? designColors.dark.text : designColors.light.text;
  const textSecondaryColor = isDark ? designColors.dark.textSecondary : designColors.light.textSecondary;

  // Show loading state while user data is being fetched
  if (!user || isRefreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={designColors.primary} />
          <Text style={[styles.loadingText, { color: textColor }]}>
            טוען פרטי משתמש...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Safely extract user data with fallbacks
  const fullNameText = user?.fullName || 'משתמש';
  const emailText = user?.email || 'לא זמין';
  const phoneText = user?.phoneNumber || 'לא זמין';
  const cityText = user?.city || 'לא זמין';
  const hasContract = user?.hasContract || false;
  const contractStatusText = hasContract ? 'יש חוזה' : 'אין חוזה';
  const travelDateText = formatDate(user?.travelDate);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[designColors.primary, designColors.primaryDark]}
              style={styles.avatarGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <IconSymbol
                ios_icon_name="person.fill"
                android_material_icon_name="person"
                size={48}
                color="#FFFFFF"
              />
            </LinearGradient>
          </View>
          
          <Text style={[styles.name, { color: textColor }]}>
            {fullNameText}
          </Text>
          
          {hasContract && (
            <View style={styles.contractBadge}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.contractBadgeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
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
        </View>

        {/* Info Cards */}
        <View style={styles.cardsContainer}>
          {/* Email Card */}
          <View style={[
            styles.card,
            {
              backgroundColor: surfaceColor,
              ...shadows.md,
            }
          ]}>
            <View style={styles.cardIcon}>
              <IconSymbol
                ios_icon_name="envelope.fill"
                android_material_icon_name="email"
                size={24}
                color={designColors.primary}
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardLabel, { color: textSecondaryColor }]}>
                אימייל
              </Text>
              <Text style={[styles.cardValue, { color: textColor }]}>
                {emailText}
              </Text>
            </View>
          </View>

          {/* Phone Card */}
          <View style={[
            styles.card,
            {
              backgroundColor: surfaceColor,
              ...shadows.md,
            }
          ]}>
            <View style={styles.cardIcon}>
              <IconSymbol
                ios_icon_name="phone.fill"
                android_material_icon_name="phone"
                size={24}
                color={designColors.primary}
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardLabel, { color: textSecondaryColor }]}>
                טלפון
              </Text>
              <Text style={[styles.cardValue, { color: textColor }]}>
                {phoneText}
              </Text>
            </View>
          </View>

          {/* City Card */}
          <View style={[
            styles.card,
            {
              backgroundColor: surfaceColor,
              ...shadows.md,
            }
          ]}>
            <View style={styles.cardIcon}>
              <IconSymbol
                ios_icon_name="location.fill"
                android_material_icon_name="location-on"
                size={24}
                color={designColors.primary}
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardLabel, { color: textSecondaryColor }]}>
                עיר
              </Text>
              <Text style={[styles.cardValue, { color: textColor }]}>
                {cityText}
              </Text>
            </View>
          </View>

          {/* Contract Status Card */}
          <View style={[
            styles.card,
            {
              backgroundColor: surfaceColor,
              ...shadows.md,
            }
          ]}>
            <View style={styles.cardIcon}>
              <IconSymbol
                ios_icon_name="doc.text.fill"
                android_material_icon_name="description"
                size={24}
                color={hasContract ? '#10B981' : '#EF4444'}
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardLabel, { color: textSecondaryColor }]}>
                סטטוס חוזה
              </Text>
              <Text style={[
                styles.cardValue,
                { color: hasContract ? '#10B981' : '#EF4444' }
              ]}>
                {contractStatusText}
              </Text>
            </View>
          </View>

          {/* Travel Date Card (only if has contract) */}
          {hasContract && (
            <View style={[
              styles.card,
              {
                backgroundColor: surfaceColor,
                ...shadows.md,
              }
            ]}>
              <View style={styles.cardIcon}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="calendar-today"
                  size={24}
                  color={designColors.primary}
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardLabel, { color: textSecondaryColor }]}>
                  תאריך נסיעה
                </Text>
                <Text style={[styles.cardValue, { color: textColor }]}>
                  {travelDateText}
                </Text>
              </View>
            </View>
          )}
        </View>

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
              size={24}
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
          <View style={[
            styles.modalContent,
            { backgroundColor: surfaceColor }
          ]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              התנתקות
            </Text>
            <Text style={[styles.modalMessage, { color: textSecondaryColor }]}>
              האם אתה בטוח שברצונך להתנתק?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: textColor }]}>
                  ביטול
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleLogout}
              >
                <Text style={[styles.modalButtonText, { color: '#FFFFFF' }]}>
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
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.lg,
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  contractBadge: {
    borderRadius: radius.full,
    overflow: 'hidden',
    ...shadows.sm,
  },
  contractBadgeGradient: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  contractBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cardsContainer: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  card: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    gap: spacing.md,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(39, 132, 245, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  logoutButton: {
    marginTop: spacing.xl,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  logoutGradient: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.xl,
    padding: spacing.xl,
    ...shadows.lg,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalButtonConfirm: {
    backgroundColor: '#EF4444',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
