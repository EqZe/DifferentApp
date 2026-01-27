
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
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

function formatDate(dateString: string | null) {
  if (!dateString) return 'לא נקבע';
  const date = new Date(dateString);
  return date.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ProfileScreen() {
  const { user } = useUser();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? designColors.dark : designColors.light;

  const statusText = user?.hasSignedAgreement ? 'לקוח פעיל' : 'משתמש רשום';
  const statusDescription = user?.hasSignedAgreement 
    ? 'חתמת על הסכם והינך לקוח פעיל במערכת'
    : 'טרם חתמת על הסכם. פנה למנהל המערכת';
  
  const greetingText = user?.hasSignedAgreement 
    ? `שלום ${user?.fullName || 'משתמש'}, שמחים שאתה איתנו!`
    : `שלום ${user?.fullName || 'משתמש'}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Modern Header with Gradient */}
        <LinearGradient
          colors={[designColors.primary, designColors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            {/* Avatar with glow effect */}
            <View style={styles.avatarGlow}>
              <View style={styles.avatar}>
                <IconSymbol
                  ios_icon_name="person.fill"
                  android_material_icon_name="person"
                  size={56}
                  color="#FFFFFF"
                />
              </View>
            </View>
            
            {/* Personal Greeting */}
            <Text style={styles.greetingText}>{greetingText}</Text>
            
            {/* Status Badge */}
            <View style={[
              styles.statusBadge,
              user?.hasSignedAgreement ? styles.statusBadgeActive : styles.statusBadgeInactive,
            ]}>
              <IconSymbol
                ios_icon_name={user?.hasSignedAgreement ? 'checkmark.seal.fill' : 'clock.fill'}
                android_material_icon_name={user?.hasSignedAgreement ? 'verified' : 'schedule'}
                size={18}
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
          {/* Personal Status Card */}
          <View style={[styles.card, { backgroundColor: colors.surface }, isDark && styles.cardDark]}>
            <View style={styles.cardIconHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: designColors.primaryBg }]}>
                <IconSymbol
                  ios_icon_name="person.badge.shield.checkmark.fill"
                  android_material_icon_name="verified-user"
                  size={28}
                  color={designColors.primary}
                />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>סטטוס החשבון שלך</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  {statusDescription}
                </Text>
              </View>
            </View>
          </View>

          {/* Personal Information Card */}
          <View style={[styles.card, { backgroundColor: colors.surface }, isDark && styles.cardDark]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>הפרטים שלך</Text>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                המידע האישי שלך במערכת
              </Text>
            </View>

            <View style={styles.infoList}>
              {/* Full Name */}
              <View style={styles.infoItem}>
                <View style={[styles.infoIconCircle, { backgroundColor: colors.backgroundSecondary }]}>
                  <IconSymbol
                    ios_icon_name="person.text.rectangle.fill"
                    android_material_icon_name="badge"
                    size={22}
                    color={designColors.primary}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>שם מלא</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {user?.fullName || '-'}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              {/* City */}
              <View style={styles.infoItem}>
                <View style={[styles.infoIconCircle, { backgroundColor: colors.backgroundSecondary }]}>
                  <IconSymbol
                    ios_icon_name="building.2.fill"
                    android_material_icon_name="location-city"
                    size={22}
                    color={designColors.secondary}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>עיר מגורים</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {user?.city || '-'}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.divider }]} />

              {/* Phone */}
              <View style={styles.infoItem}>
                <View style={[styles.infoIconCircle, { backgroundColor: colors.backgroundSecondary }]}>
                  <IconSymbol
                    ios_icon_name="phone.fill"
                    android_material_icon_name="phone"
                    size={22}
                    color={designColors.success}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>טלפון</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>
                    {user?.phoneNumber || '-'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Travel Information Card (only for signed agreement users) */}
          {user?.hasSignedAgreement && (
            <View style={[styles.card, { backgroundColor: colors.surface }, isDark && styles.cardDark]}>
              <View style={styles.cardIconHeader}>
                <View style={[styles.cardIconCircle, { backgroundColor: designColors.secondaryBg }]}>
                  <IconSymbol
                    ios_icon_name="airplane.departure"
                    android_material_icon_name="flight-takeoff"
                    size={28}
                    color={designColors.secondary}
                  />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>הנסיעה שלך לסין</Text>
                  <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                    פרטי הנסיעה המתוכננת
                  </Text>
                </View>
              </View>

              <View style={styles.travelInfo}>
                <View style={[styles.travelDateCard, { backgroundColor: colors.backgroundSecondary }]}>
                  <View style={styles.travelDateIcon}>
                    <IconSymbol
                      ios_icon_name="calendar.badge.clock"
                      android_material_icon_name="event"
                      size={36}
                      color={designColors.secondary}
                    />
                  </View>
                  <View style={styles.travelDateContent}>
                    <Text style={[styles.travelDateLabel, { color: colors.textSecondary }]}>
                      תאריך יציאה
                    </Text>
                    <Text style={[styles.travelDateValue, { color: colors.text }]}>
                      {formatDate(user?.travelDate || null)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Help & Support Card */}
          <View style={[styles.card, { backgroundColor: colors.surface }, isDark && styles.cardDark]}>
            <View style={styles.cardIconHeader}>
              <View style={[styles.cardIconCircle, { backgroundColor: designColors.infoBg }]}>
                <IconSymbol
                  ios_icon_name="questionmark.bubble.fill"
                  android_material_icon_name="help"
                  size={28}
                  color={designColors.info}
                />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>צריך עזרה?</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  אנחנו כאן בשבילך
                </Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.helpButton, { backgroundColor: colors.backgroundSecondary }]}
              activeOpacity={0.7}
            >
              <IconSymbol
                ios_icon_name="message.fill"
                android_material_icon_name="chat"
                size={20}
                color={designColors.primary}
              />
              <Text style={[styles.helpButtonText, { color: designColors.primary }]}>
                צור קשר עם התמיכה
              </Text>
            </TouchableOpacity>
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
    paddingTop: Platform.OS === 'android' ? spacing.xl : spacing.md,
    paddingBottom: spacing.xxl,
    paddingHorizontal: layout.screenPadding,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarGlow: {
    padding: 8,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  greetingText: {
    ...typography.h2,
    color: '#FFFFFF',
    marginBottom: spacing.md,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    ...shadows.md,
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
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: 120,
    gap: spacing.lg,
  },
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  cardDark: {
    borderWidth: 1,
    borderColor: designColors.dark.border,
  },
  cardHeader: {
    marginBottom: spacing.lg,
  },
  cardIconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  cardIconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    ...typography.h4,
    marginBottom: spacing.xs / 2,
  },
  cardSubtitle: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
  infoList: {
    gap: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  infoIconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
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
  travelDateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  travelDateIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: 'rgba(245, 173, 39, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  travelDateContent: {
    flex: 1,
  },
  travelDateLabel: {
    ...typography.label,
    marginBottom: spacing.xs,
  },
  travelDateValue: {
    ...typography.h3,
    fontWeight: '700',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  helpButtonText: {
    ...typography.label,
    fontWeight: '600',
  },
});
