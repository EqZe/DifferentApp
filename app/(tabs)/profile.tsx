
import React, { useState } from 'react';
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

const isRTL = I18nManager.isRTL;

function formatDate(dateString: string | null): string {
  if (!dateString) return 'לא נקבע';
  
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, setUser } = useUser();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    console.log('User tapped Logout button');
    setShowLogoutModal(false);
    
    try {
      await api.signOut();
      await setUser(null);
      console.log('User logged out successfully, redirecting to register');
      router.replace('/register');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: designColors.background[isDark ? 'dark' : 'light'] }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: designColors.text[isDark ? 'dark' : 'light'] }]}>
            טוען...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const fullNameText = user.fullName;
  const emailText = user.email || 'לא זמין';
  const phoneText = user.phoneNumber || 'לא זמין';
  const cityText = user.city;
  const contractStatusText = user.hasContract ? 'יש חוזה' : 'אין חוזה';
  const travelDateText = formatDate(user.travelDate);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: designColors.background[isDark ? 'dark' : 'light'] }]} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[designColors.primary.main, designColors.primary.dark]}
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
          
          <Text style={[styles.name, { color: designColors.text[isDark ? 'dark' : 'light'] }]}>
            {fullNameText}
          </Text>
          
          {user.hasContract && (
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
                <Text style={styles.contractBadgeText}>לקוח מוסמך</Text>
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
              backgroundColor: designColors.surface[isDark ? 'dark' : 'light'],
              ...shadows.medium,
            }
          ]}>
            <View style={styles.cardIcon}>
              <IconSymbol
                ios_icon_name="envelope.fill"
                android_material_icon_name="email"
                size={24}
                color={designColors.primary.main}
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardLabel, { color: designColors.textSecondary[isDark ? 'dark' : 'light'] }]}>
                אימייל
              </Text>
              <Text style={[styles.cardValue, { color: designColors.text[isDark ? 'dark' : 'light'] }]}>
                {emailText}
              </Text>
            </View>
          </View>

          {/* Phone Card */}
          <View style={[
            styles.card,
            {
              backgroundColor: designColors.surface[isDark ? 'dark' : 'light'],
              ...shadows.medium,
            }
          ]}>
            <View style={styles.cardIcon}>
              <IconSymbol
                ios_icon_name="phone.fill"
                android_material_icon_name="phone"
                size={24}
                color={designColors.primary.main}
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardLabel, { color: designColors.textSecondary[isDark ? 'dark' : 'light'] }]}>
                טלפון
              </Text>
              <Text style={[styles.cardValue, { color: designColors.text[isDark ? 'dark' : 'light'] }]}>
                {phoneText}
              </Text>
            </View>
          </View>

          {/* City Card */}
          <View style={[
            styles.card,
            {
              backgroundColor: designColors.surface[isDark ? 'dark' : 'light'],
              ...shadows.medium,
            }
          ]}>
            <View style={styles.cardIcon}>
              <IconSymbol
                ios_icon_name="location.fill"
                android_material_icon_name="location-on"
                size={24}
                color={designColors.primary.main}
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardLabel, { color: designColors.textSecondary[isDark ? 'dark' : 'light'] }]}>
                עיר
              </Text>
              <Text style={[styles.cardValue, { color: designColors.text[isDark ? 'dark' : 'light'] }]}>
                {cityText}
              </Text>
            </View>
          </View>

          {/* Contract Status Card */}
          <View style={[
            styles.card,
            {
              backgroundColor: designColors.surface[isDark ? 'dark' : 'light'],
              ...shadows.medium,
            }
          ]}>
            <View style={styles.cardIcon}>
              <IconSymbol
                ios_icon_name="doc.text.fill"
                android_material_icon_name="description"
                size={24}
                color={user.hasContract ? '#10B981' : '#EF4444'}
              />
            </View>
            <View style={styles.cardContent}>
              <Text style={[styles.cardLabel, { color: designColors.textSecondary[isDark ? 'dark' : 'light'] }]}>
                סטטוס חוזה
              </Text>
              <Text style={[
                styles.cardValue,
                { color: user.hasContract ? '#10B981' : '#EF4444' }
              ]}>
                {contractStatusText}
              </Text>
            </View>
          </View>

          {/* Travel Date Card (only if has contract) */}
          {user.hasContract && (
            <View style={[
              styles.card,
              {
                backgroundColor: designColors.surface[isDark ? 'dark' : 'light'],
                ...shadows.medium,
              }
            ]}>
              <View style={styles.cardIcon}>
                <IconSymbol
                  ios_icon_name="calendar"
                  android_material_icon_name="calendar-today"
                  size={24}
                  color={designColors.primary.main}
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.cardLabel, { color: designColors.textSecondary[isDark ? 'dark' : 'light'] }]}>
                  תאריך נסיעה
                </Text>
                <Text style={[styles.cardValue, { color: designColors.text[isDark ? 'dark' : 'light'] }]}>
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
            { backgroundColor: designColors.surface[isDark ? 'dark' : 'light'] }
          ]}>
            <Text style={[styles.modalTitle, { color: designColors.text[isDark ? 'dark' : 'light'] }]}>
              התנתקות
            </Text>
            <Text style={[styles.modalMessage, { color: designColors.textSecondary[isDark ? 'dark' : 'light'] }]}>
              האם אתה בטוח שברצונך להתנתק?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: designColors.text[isDark ? 'dark' : 'light'] }]}>
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
  },
  loadingText: {
    fontSize: 18,
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
    ...shadows.large,
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
    ...shadows.small,
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
    ...shadows.medium,
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
    ...shadows.large,
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
