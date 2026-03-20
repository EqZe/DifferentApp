
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  useColorScheme,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { useUser } from '@/contexts/UserContext';
import { useOneSignal } from '@/contexts/OneSignalContext';
import { registerOneSignalPlayer, RegisterOneSignalPlayerResult } from '@/utils/api';
import { designColors, typography, spacing, radius, shadows } from '@/styles/designSystem';

function getOneSignal() {
  if (Platform.OS === 'web') return null;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('react-native-onesignal');
  return mod.OneSignal ?? mod.default ?? mod;
}

interface NotificationPreferences {
  taskReminders: boolean;
  containerUpdates: boolean;
  scheduleChanges: boolean;
  generalAnnouncements: boolean;
}

export default function NotificationPreferencesScreen() {
  const { user } = useUser();
  const { hasPermission, requestPermission, playerId, externalUserId, pushTokenDebugInfo } = useOneSignal();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(false);
  const [reregisterLoading, setReregisterLoading] = useState(false);
  const [localDebugInfo, setLocalDebugInfo] = useState<RegisterOneSignalPlayerResult | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    taskReminders: true,
    containerUpdates: true,
    scheduleChanges: true,
    generalAnnouncements: true,
  });

  const themeColors = colorScheme === 'dark' ? designColors.dark : designColors.light;
  const textSecondaryColor = themeColors.textSecondary;

  // Use the most recent debug info — local (from re-register button) takes priority
  const activeDebugInfo = localDebugInfo ?? pushTokenDebugInfo;

  // Live subscription ID read directly from OneSignal SDK
  const [liveSubscriptionId, setLiveSubscriptionId] = useState<string | null>(null);

  useEffect(() => {
    loadPreferences();
    refreshLiveSubscriptionId();
  }, []);

  // Keep live subscription ID in sync whenever playerId changes
  useEffect(() => {
    refreshLiveSubscriptionId();
  }, [playerId]);

  function refreshLiveSubscriptionId() {
    try {
      const OS = getOneSignal();
      if (!OS) return;
      const id = OS?.User?.pushSubscription?.id ?? null;
      setLiveSubscriptionId(id);
    } catch {
      setLiveSubscriptionId(null);
    }
  }

  const loadPreferences = async () => {
    try {
      console.log('NotificationPreferences: Loading OneSignal tags');
      const OneSignal = getOneSignal();
      if (!OneSignal) return;
      const tags = await OneSignal.User.getTags();
      console.log('NotificationPreferences: Current tags:', tags);
      setPreferences({
        taskReminders: tags.task_reminders !== 'false',
        containerUpdates: tags.container_updates !== 'false',
        scheduleChanges: tags.schedule_changes !== 'false',
        generalAnnouncements: tags.general_announcements !== 'false',
      });
    } catch (error) {
      console.error('NotificationPreferences: Error loading preferences:', error);
    }
  };

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      console.log('NotificationPreferences: Saving preferences:', newPreferences);
      const OneSignal = getOneSignal();
      if (!OneSignal) return;
      await OneSignal.User.addTags({
        task_reminders: newPreferences.taskReminders ? 'true' : 'false',
        container_updates: newPreferences.containerUpdates ? 'true' : 'false',
        schedule_changes: newPreferences.scheduleChanges ? 'true' : 'false',
        general_announcements: newPreferences.generalAnnouncements ? 'true' : 'false',
      });
      console.log('NotificationPreferences: Preferences saved successfully');
      setPreferences(newPreferences);
    } catch (error) {
      console.error('NotificationPreferences: Error saving preferences:', error);
      Alert.alert('שגיאה', 'לא ניתן לשמור את ההעדפות. אנא נסה שוב.');
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    const newPreferences = { ...preferences, [key]: !preferences[key] };
    savePreferences(newPreferences);
  };

  const handleEnableNotifications = async () => {
    console.log('NotificationPreferences: User tapped enable notifications');
    setLoading(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        Alert.alert('הצלחה', 'התראות הופעלו בהצלחה! תקבל עדכונים על משימות, מכולות ולוח זמנים.', [{ text: 'אישור' }]);
      } else {
        Alert.alert('שים לב', 'לא ניתן להפעיל התראות. אנא אפשר התראות בהגדרות המכשיר.', [{ text: 'אישור' }]);
      }
    } catch (error) {
      console.error('NotificationPreferences: Error enabling notifications:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בהפעלת ההתראות.');
    } finally {
      setLoading(false);
    }
  };

  const handleReregister = async () => {
    console.log('NotificationPreferences: User tapped Re-register Token');
    refreshLiveSubscriptionId();

    const OS = getOneSignal();
    const currentPlayerId = OS?.User?.pushSubscription?.id ?? playerId;
    const currentUserId = user?.id ?? externalUserId;

    console.log('NotificationPreferences: Re-register — playerId:', currentPlayerId, 'userId:', currentUserId);

    if (!currentPlayerId || !currentUserId) {
      const missing = !currentPlayerId ? 'Subscription ID' : 'User ID';
      Alert.alert('חסר מידע', `${missing} אינו זמין עדיין. נסה שוב בעוד מספר שניות.`);
      return;
    }

    setReregisterLoading(true);
    setLocalDebugInfo(null);
    try {
      const result = await registerOneSignalPlayer(currentPlayerId, currentUserId);
      console.log('NotificationPreferences: Re-register result:', JSON.stringify(result));
      setLocalDebugInfo(result);
    } catch (err: any) {
      console.error('NotificationPreferences: Re-register threw:', err?.message);
      setLocalDebugInfo({
        success: false,
        playerId: currentPlayerId,
        userId: currentUserId,
        error: err?.message ?? String(err),
        upsertRowCount: null,
        selectRowCount: null,
        sessionPresent: null,
        sessionUserId: null,
        edgeStatus: null,
        edgeError: null,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setReregisterLoading(false);
    }
  };

  const handleBackPress = () => {
    console.log('NotificationPreferences: User tapped back button');
    router.back();
  };

  // ── Debug panel helpers ──────────────────────────────────────────────────
  const OS = getOneSignal();
  const sdkSubscriptionId: string | null = liveSubscriptionId ?? (OS?.User?.pushSubscription?.id ?? null);
  const displayUserId = user?.id ?? externalUserId ?? null;

  const upsertStatus = activeDebugInfo
    ? activeDebugInfo.upsertRowCount === null
      ? 'not run'
      : activeDebugInfo.upsertRowCount > 0
        ? `OK (${activeDebugInfo.upsertRowCount} row)`
        : 'FAILED (0 rows — RLS?)'
    : '—';

  const selectStatus = activeDebugInfo
    ? activeDebugInfo.selectRowCount === null
      ? 'not run'
      : activeDebugInfo.selectRowCount > 0
        ? `OK (${activeDebugInfo.selectRowCount} row in DB)`
        : 'MISSING (0 rows in DB)'
    : '—';

  const overallStatus = activeDebugInfo
    ? activeDebugInfo.success
      ? 'SUCCESS'
      : 'FAILED'
    : '—';

  const overallStatusColor = activeDebugInfo
    ? activeDebugInfo.success
      ? '#16A34A'
      : '#DC2626'
    : '#6B7280';

  const sessionLabel = activeDebugInfo
    ? activeDebugInfo.sessionPresent
      ? `authenticated (${activeDebugInfo.sessionUserId?.substring(0, 8) ?? '?'}...)`
      : 'ANONYMOUS — no session!'
    : '—';

  const edgeLabel = activeDebugInfo
    ? activeDebugInfo.edgeStatus !== null
      ? `HTTP ${activeDebugInfo.edgeStatus}${activeDebugInfo.edgeError ? ' — ' + activeDebugInfo.edgeError.substring(0, 60) : ''}`
      : activeDebugInfo.edgeError ?? '—'
    : '—';

  const timestampLabel = activeDebugInfo
    ? new Date(activeDebugInfo.timestamp).toLocaleTimeString()
    : '—';

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'הגדרות התראות',
          headerBackTitle: 'חזור',
          headerStyle: { backgroundColor: designColors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <LinearGradient
          colors={[designColors.primary, designColors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerCard}
        >
          <IconSymbol
            ios_icon_name="bell.fill"
            android_material_icon_name="notifications"
            size={48}
            color="#FFFFFF"
          />
          <Text style={styles.headerTitle}>התראות Push</Text>
          <Text style={styles.headerSubtitle}>בחר אילו התראות תרצה לקבל</Text>
        </LinearGradient>

        {/* Web Platform Warning */}
        {Platform.OS === 'web' && (
          <View style={styles.warningCard}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle.fill"
              android_material_icon_name="warning"
              size={24}
              color="#856404"
            />
            <Text style={styles.warningText}>
              {'התראות Push זמינות רק באפליקציה במכשיר נייד (Android/iOS).\nכדי לקבל התראות, אנא פתח את האפליקציה במכשיר הנייד שלך.'}
            </Text>
          </View>
        )}

        {/* Permission Status */}
        {Platform.OS !== 'web' && !hasPermission && (
          <View style={styles.infoCard}>
            <IconSymbol
              ios_icon_name="info.circle.fill"
              android_material_icon_name="info"
              size={24}
              color="#0C5460"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoText}>
                התראות Push לא מופעלות. כדי לקבל התראות, לחץ על הכפתור למטה.
              </Text>
              <TouchableOpacity
                style={styles.enableButton}
                onPress={handleEnableNotifications}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.enableButtonText}>הפעל התראות</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Preferences Section */}
        {hasPermission && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>סוגי התראות</Text>

            <View style={styles.preferenceCard}>
              <View style={styles.preferenceHeader}>
                <View style={styles.preferenceIconContainer}>
                  <IconSymbol
                    ios_icon_name="checkmark.circle.fill"
                    android_material_icon_name="check-circle"
                    size={32}
                    color={designColors.primary}
                  />
                </View>
                <View style={styles.preferenceContent}>
                  <Text style={styles.preferenceTitle}>תזכורות משימות</Text>
                  <Text style={styles.preferenceDescription}>
                    קבל תזכורות 7, 3 ויום אחד לפני תאריך יעד של משימה
                  </Text>
                </View>
                <Switch
                  value={preferences.taskReminders}
                  onValueChange={() => togglePreference('taskReminders')}
                  trackColor={{ false: '#D1D5DB', true: designColors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <View style={styles.preferenceCard}>
              <View style={styles.preferenceHeader}>
                <View style={styles.preferenceIconContainer}>
                  <IconSymbol
                    ios_icon_name="shippingbox.fill"
                    android_material_icon_name="local-shipping"
                    size={32}
                    color={designColors.secondary}
                  />
                </View>
                <View style={styles.preferenceContent}>
                  <Text style={styles.preferenceTitle}>עדכוני מכולות</Text>
                  <Text style={styles.preferenceDescription}>
                    קבל עדכונים על שינויים בסטטוס המכולות שלך
                  </Text>
                </View>
                <Switch
                  value={preferences.containerUpdates}
                  onValueChange={() => togglePreference('containerUpdates')}
                  trackColor={{ false: '#D1D5DB', true: designColors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <View style={styles.preferenceCard}>
              <View style={styles.preferenceHeader}>
                <View style={styles.preferenceIconContainer}>
                  <IconSymbol
                    ios_icon_name="calendar"
                    android_material_icon_name="calendar-today"
                    size={32}
                    color="#10B981"
                  />
                </View>
                <View style={styles.preferenceContent}>
                  <Text style={styles.preferenceTitle}>שינויים בלוח זמנים</Text>
                  <Text style={styles.preferenceDescription}>
                    קבל התראות על שינויים בלוח הזמנים של הנסיעה
                  </Text>
                </View>
                <Switch
                  value={preferences.scheduleChanges}
                  onValueChange={() => togglePreference('scheduleChanges')}
                  trackColor={{ false: '#D1D5DB', true: designColors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <View style={styles.preferenceCard}>
              <View style={styles.preferenceHeader}>
                <View style={styles.preferenceIconContainer}>
                  <IconSymbol
                    ios_icon_name="megaphone.fill"
                    android_material_icon_name="campaign"
                    size={32}
                    color="#8B5CF6"
                  />
                </View>
                <View style={styles.preferenceContent}>
                  <Text style={styles.preferenceTitle}>הודעות כלליות</Text>
                  <Text style={styles.preferenceDescription}>
                    קבל הודעות חשובות ועדכונים כלליים מהמערכת
                  </Text>
                </View>
                <Switch
                  value={preferences.generalAnnouncements}
                  onValueChange={() => togglePreference('generalAnnouncements')}
                  trackColor={{ false: '#D1D5DB', true: designColors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.section}>
          <View style={styles.infoSection}>
            <IconSymbol
              ios_icon_name="info.circle"
              android_material_icon_name="info"
              size={20}
              color={textSecondaryColor}
            />
            <Text style={[styles.infoSectionText, { color: textSecondaryColor }]}>
              ניתן לשנות את ההעדפות בכל עת. השינויים ייכנסו לתוקף מיידית.
            </Text>
          </View>
        </View>

        {/* ── Push Token Debug Panel ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>אבחון רישום טוקן</Text>

          <View style={styles.debugBox}>
            {/* Overall status badge */}
            <View style={styles.debugStatusRow}>
              <Text style={styles.debugLabel}>סטטוס כללי</Text>
              <View style={[styles.debugBadge, { backgroundColor: overallStatusColor }]}>
                <Text style={styles.debugBadgeText}>{overallStatus}</Text>
              </View>
            </View>

            <View style={styles.debugDivider} />

            {/* Subscription ID */}
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Subscription ID (SDK)</Text>
              <Text style={styles.debugValue} numberOfLines={2}>
                {sdkSubscriptionId ?? 'null — not yet assigned'}
              </Text>
            </View>

            {/* User ID */}
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>User ID</Text>
              <Text style={styles.debugValue} numberOfLines={2}>
                {displayUserId ?? 'null — not logged in'}
              </Text>
            </View>

            <View style={styles.debugDivider} />

            {/* Session */}
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Supabase session</Text>
              <Text style={[
                styles.debugValue,
                activeDebugInfo && !activeDebugInfo.sessionPresent ? styles.debugValueError : null,
              ]}>
                {sessionLabel}
              </Text>
            </View>

            {/* Upsert result */}
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Upsert result</Text>
              <Text style={[
                styles.debugValue,
                activeDebugInfo && activeDebugInfo.upsertRowCount === 0 ? styles.debugValueError : null,
              ]}>
                {upsertStatus}
              </Text>
            </View>

            {/* SELECT verification */}
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>DB verify (SELECT)</Text>
              <Text style={[
                styles.debugValue,
                activeDebugInfo && activeDebugInfo.selectRowCount === 0 ? styles.debugValueError : null,
              ]}>
                {selectStatus}
              </Text>
            </View>

            {/* Error message */}
            {activeDebugInfo?.error ? (
              <View style={styles.debugRow}>
                <Text style={styles.debugLabel}>Error</Text>
                <Text style={[styles.debugValue, styles.debugValueError]} numberOfLines={4}>
                  {activeDebugInfo.error}
                </Text>
              </View>
            ) : null}

            {/* Edge function */}
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Edge function</Text>
              <Text style={styles.debugValue} numberOfLines={3}>
                {edgeLabel}
              </Text>
            </View>

            {/* Timestamp */}
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Last attempt</Text>
              <Text style={styles.debugValue}>{timestampLabel}</Text>
            </View>

            <View style={styles.debugDivider} />

            {/* Re-register button */}
            <TouchableOpacity
              style={[styles.reregisterButton, reregisterLoading && styles.reregisterButtonDisabled]}
              onPress={handleReregister}
              disabled={reregisterLoading}
              activeOpacity={0.75}
            >
              {reregisterLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.reregisterButtonText}>Re-register Token</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designColors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  headerCard: {
    margin: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
    ...shadows.lg,
  },
  headerTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.body.fontSize,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: typography.bodySmall.fontSize,
    color: '#856404',
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#D1ECF1',
    borderLeftWidth: 4,
    borderLeftColor: '#17A2B8',
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  infoText: {
    fontSize: typography.bodySmall.fontSize,
    color: '#0C5460',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  enableButton: {
    backgroundColor: designColors.primary,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  section: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.h4.fontSize,
    fontWeight: '700',
    color: designColors.light.text,
    marginBottom: spacing.md,
  },
  preferenceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  preferenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  preferenceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(39, 132, 245, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  preferenceContent: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    color: designColors.light.text,
    marginBottom: spacing.xs,
  },
  preferenceDescription: {
    fontSize: typography.bodySmall.fontSize,
    color: designColors.light.textSecondary,
    lineHeight: 18,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: 'rgba(39, 132, 245, 0.05)',
    borderRadius: radius.md,
  },
  infoSectionText: {
    flex: 1,
    fontSize: typography.bodySmall.fontSize,
    lineHeight: 20,
  },
  // ── Debug panel ────────────────────────────────────────────────────────────
  debugBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  debugStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  debugBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
  },
  debugBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  debugDivider: {
    height: 1,
    backgroundColor: '#D1D5DB',
    marginVertical: spacing.sm,
  },
  debugRow: {
    marginBottom: 6,
  },
  debugLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  debugValue: {
    fontSize: 11,
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },
  debugValueError: {
    color: '#DC2626',
    fontWeight: '600',
  },
  reregisterButton: {
    backgroundColor: designColors.primary,
    borderRadius: radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  reregisterButtonDisabled: {
    opacity: 0.6,
  },
  reregisterButtonText: {
    color: '#FFFFFF',
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
