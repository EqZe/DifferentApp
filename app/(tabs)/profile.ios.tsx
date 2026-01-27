
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useColorScheme,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { useUser } from '@/contexts/UserContext';
import { designColors, typography, spacing, radius, shadows, layout } from '@/styles/designSystem';

// Enable RTL for Hebrew
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function ProfileScreen() {
  const { user } = useUser();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? designColors.dark : designColors.light;

  function formatDate(dateString: string | null) {
    if (!dateString) return 'לא נקבע';
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.loadingContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            לא נמצא משתמש
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  const hasContract = user.hasContract;
  const travelDateFormatted = formatDate(user.travelDate);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header with Gradient */}
        <LinearGradient
          colors={[designColors.primary, designColors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={48}
                  color="#FFFFFF"
                />
              </View>
            </View>
            <Text style={styles.userName}>{user.fullName}</Text>
            <Text style={styles.userCity}>{user.city}</Text>
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Contract Status Card */}
          <View style={[
            styles.statusCard,
            { backgroundColor: colors.surface },
            isDark && styles.statusCardDark,
          ]}>
            <View style={styles.statusHeader}>
              <View style={styles.statusTextContainer}>
                <Text style={[styles.statusTitle, { color: colors.text }]}>
                  סטטוס חוזה
                </Text>
                <Text style={[
                  styles.statusValue,
                  hasContract ? styles.statusValueActive : styles.statusValueInactive,
                ]}>
                  {hasContract ? 'חוזה פעיל' : 'ללא חוזה'}
                </Text>
              </View>
              <View style={[
                styles.statusIconContainer,
                hasContract ? styles.statusIconActive : styles.statusIconInactive,
              ]}>
                <IconSymbol
                  ios_icon_name={hasContract ? 'checkmark.seal.fill' : 'lock.fill'}
                  android_material_icon_name={hasContract ? 'verified' : 'lock'}
                  size={32}
                  color="#FFFFFF"
                />
              </View>
            </View>
            
            {hasContract && (
              <View style={[styles.statusBadge, { backgroundColor: designColors.successBg }]}>
                <Text style={[styles.statusBadgeText, { color: designColors.success }]}>
                  יש לך גישה לכל התכנים והליווי האישי
                </Text>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check-circle"
                  size={16}
                  color={designColors.success}
                />
              </View>
            )}
            
            {!hasContract && (
              <View style={[styles.statusBadge, { backgroundColor: designColors.lockedBg }]}>
                <Text style={[styles.statusBadgeText, { color: designColors.locked }]}>
                  פנה למנהל המערכת לחתימה על חוזה
                </Text>
                <IconSymbol
                  ios_icon_name="info.circle.fill"
                  android_material_icon_name="info"
                  size={16}
                  color={designColors.locked}
                />
              </View>
            )}
          </View>

          {/* Info Cards */}
          <View style={styles.infoSection}>
            {/* Phone Number */}
            <View style={[
              styles.infoCard,
              { backgroundColor: colors.surface },
              isDark && styles.infoCardDark,
            ]}>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  טלפון
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {user.phoneNumber}
                </Text>
              </View>
              <View style={[styles.infoIconContainer, { backgroundColor: designColors.primaryBg }]}>
                <IconSymbol
                  ios_icon_name="phone.fill"
                  android_material_icon_name="phone"
                  size={24}
                  color={designColors.primary}
                />
              </View>
            </View>

            {/* City */}
            <View style={[
              styles.infoCard,
              { backgroundColor: colors.surface },
              isDark && styles.infoCardDark,
            ]}>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                  עיר
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {user.city}
                </Text>
              </View>
              <View style={[styles.infoIconContainer, { backgroundColor: designColors.secondaryBg }]}>
                <IconSymbol
                  ios_icon_name="location.fill"
                  android_material_icon_name="location-on"
                  size={24}
                  color={designColors.secondary}
                />
              </View>
            </View>

            {/* Travel Date */}
            {hasContract && (
              <View style={[
                styles.infoCard,
                { backgroundColor: colors.surface },
                isDark && styles.infoCardDark,
              ]}>
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                    תאריך נסיעה
                  </Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {travelDateFormatted}
                  </Text>
                </View>
                <View style={[styles.infoIconContainer, { backgroundColor: designColors.primaryBg }]}>
                  <IconSymbol
                    ios_icon_name="calendar"
                    android_material_icon_name="calendar-today"
                    size={24}
                    color={designColors.primary}
                  />
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
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
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
  },
  
  // Header
  header: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    paddingHorizontal: layout.screenPadding,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  userName: {
    ...typography.h2,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  userCity: {
    ...typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  
  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: 120,
  },
  
  // Status Card
  statusCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  statusCardDark: {
    borderWidth: 1,
    borderColor: designColors.dark.border,
  },
  statusHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusIconContainer: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  statusIconActive: {
    backgroundColor: designColors.success,
  },
  statusIconInactive: {
    backgroundColor: designColors.locked,
  },
  statusTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statusTitle: {
    ...typography.labelSmall,
    marginBottom: spacing.xs / 2,
    textAlign: 'right',
  },
  statusValue: {
    ...typography.h3,
    fontWeight: '700',
    textAlign: 'right',
  },
  statusValueActive: {
    color: designColors.success,
  },
  statusValueInactive: {
    color: designColors.locked,
  },
  statusBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  statusBadgeText: {
    ...typography.bodySmall,
    flex: 1,
    textAlign: 'right',
    fontWeight: '600',
  },
  
  // Info Section
  infoSection: {
    gap: spacing.md,
  },
  infoCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: radius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  infoCardDark: {
    borderWidth: 1,
    borderColor: designColors.dark.border,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoTextContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  infoLabel: {
    ...typography.caption,
    marginBottom: spacing.xs / 2,
    textAlign: 'right',
  },
  infoValue: {
    ...typography.body,
    fontWeight: '600',
    textAlign: 'right',
  },
});
