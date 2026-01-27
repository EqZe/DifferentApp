
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { useUser } from '@/contexts/UserContext';
import { designColors, typography, spacing, radius, shadows, layout } from '@/styles/designSystem';

export default function ProfileScreen() {
  const { user } = useUser();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? designColors.dark : designColors.light;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'לא נקבע';
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const statusText = user?.hasSignedAgreement ? 'לקוח פעיל' : 'משתמש רשום';
  const statusDescription = user?.hasSignedAgreement 
    ? 'חתמת על הסכם והינך לקוח פעיל במערכת'
    : 'טרם חתמת על הסכם. פנה למנהל המערכת';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header with gradient */}
        <LinearGradient
          colors={[designColors.primary, designColors.primaryDark]}
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
            <Text style={styles.profileName}>{user?.fullName || 'משתמש'}</Text>
            <View style={[
              styles.statusBadge,
              user?.hasSignedAgreement ? styles.statusBadgeActive : styles.statusBadgeInactive,
            ]}>
              <IconSymbol
                ios_icon_name={user?.hasSignedAgreement ? 'checkmark.circle.fill' : 'info.circle.fill'}
                android_material_icon_name={user?.hasSignedAgreement ? 'check-circle' : 'info'}
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.statusBadgeText}>{statusText}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Card */}
          <View style={[styles.card, { backgroundColor: colors.surface }, isDark && styles.cardDark]}>
            <View style={styles.cardHeader}>
              <IconSymbol
                ios_icon_name="info.circle.fill"
                android_material_icon_name="info"
                size={24}
                color={designColors.primary}
              />
              <Text style={[styles.cardTitle, { color: colors.text }]}>סטטוס חשבון</Text>
            </View>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              {statusDescription}
            </Text>
          </View>

          {/* Personal Information Card */}
          <View style={[styles.card, { backgroundColor: colors.surface }, isDark && styles.cardDark]}>
            <View style={styles.cardHeader}>
              <IconSymbol
                ios_icon_name="person.text.rectangle"
                android_material_icon_name="badge"
                size={24}
                color={designColors.primary}
              />
              <Text style={[styles.cardTitle, { color: colors.text }]}>פרטים אישיים</Text>
            </View>

            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <View style={styles.infoItemLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.backgroundSecondary }]}>
                    <IconSymbol
                      ios_icon_name="person.fill"
                      android_material_icon_name="person"
                      size={20}
                      color={designColors.primary}
                    />
                  </View>
                  <View style={styles.infoItemContent}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>שם מלא</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {user?.fullName || '-'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              <View style={styles.infoItem}>
                <View style={styles.infoItemLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.backgroundSecondary }]}>
                    <IconSymbol
                      ios_icon_name="location.fill"
                      android_material_icon_name="location-on"
                      size={20}
                      color={designColors.primary}
                    />
                  </View>
                  <View style={styles.infoItemContent}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>עיר</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {user?.city || '-'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              <View style={styles.infoItem}>
                <View style={styles.infoItemLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.backgroundSecondary }]}>
                    <IconSymbol
                      ios_icon_name="phone.fill"
                      android_material_icon_name="phone"
                      size={20}
                      color={designColors.primary}
                    />
                  </View>
                  <View style={styles.infoItemContent}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>טלפון</Text>
                    <Text style={[styles.infoValue, { color: colors.text }]}>
                      {user?.phoneNumber || '-'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Travel Information Card (only for signed agreement users) */}
          {user?.hasSignedAgreement && (
            <View style={[styles.card, { backgroundColor: colors.surface }, isDark && styles.cardDark]}>
              <View style={styles.cardHeader}>
                <IconSymbol
                  ios_icon_name="airplane"
                  android_material_icon_name="flight"
                  size={24}
                  color={designColors.secondary}
                />
                <Text style={[styles.cardTitle, { color: colors.text }]}>פרטי נסיעה</Text>
              </View>

              <View style={styles.travelInfo}>
                <View style={[styles.travelDateContainer, { backgroundColor: colors.backgroundSecondary }]}>
                  <IconSymbol
                    ios_icon_name="calendar"
                    android_material_icon_name="calendar-today"
                    size={32}
                    color={designColors.secondary}
                  />
                  <View style={styles.travelDateContent}>
                    <Text style={[styles.travelDateLabel, { color: colors.textSecondary }]}>
                      תאריך נסיעה
                    </Text>
                    <Text style={[styles.travelDateValue, { color: colors.text }]}>
                      {formatDate(user?.travelDate || null)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Help Card */}
          <View style={[styles.card, { backgroundColor: colors.surface }, isDark && styles.cardDark]}>
            <View style={styles.cardHeader}>
              <IconSymbol
                ios_icon_name="questionmark.circle.fill"
                android_material_icon_name="help"
                size={24}
                color={designColors.info}
              />
              <Text style={[styles.cardTitle, { color: colors.text }]}>זקוק לעזרה?</Text>
            </View>
            <Text style={[styles.cardDescription, { color: colors.textSecondary }]}>
              לשאלות ובעיות, פנה למנהל המערכת או לצוות התמיכה
            </Text>
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
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileName: {
    ...typography.h2,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
  statusBadgeActive: {
    backgroundColor: designColors.success,
  },
  statusBadgeInactive: {
    backgroundColor: designColors.warning,
  },
  statusBadgeText: {
    ...typography.label,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: 120,
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  cardDark: {
    borderWidth: 1,
    borderColor: designColors.dark.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardTitle: {
    ...typography.h4,
  },
  cardDescription: {
    ...typography.body,
    lineHeight: 22,
  },
  infoList: {
    gap: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoItemContent: {
    flex: 1,
  },
  infoLabel: {
    ...typography.caption,
    marginBottom: spacing.xs / 2,
  },
  infoValue: {
    ...typography.bodyLarge,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: spacing.xs,
  },
  travelInfo: {
    marginTop: spacing.sm,
  },
  travelDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  travelDateContent: {
    flex: 1,
  },
  travelDateLabel: {
    ...typography.label,
    marginBottom: spacing.xs / 2,
  },
  travelDateValue: {
    ...typography.h4,
  },
});
