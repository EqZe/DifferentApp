
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
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol } from '@/components/IconSymbol';
import { useUser } from '@/contexts/UserContext';
import { useOneSignal } from '@/contexts/OneSignalContext';
import { designColors, typography, spacing, radius, shadows } from '@/styles/designSystem';
import OneSignal from 'react-native-onesignal';

interface NotificationPreferences {
  taskReminders: boolean;
  containerUpdates: boolean;
  scheduleChanges: boolean;
  generalAnnouncements: boolean;
}

export default function NotificationPreferencesScreen() {
  const { user } = useUser();
  const { hasPermission, requestPermission } = useOneSignal();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    taskReminders: true,
    containerUpdates: true,
    scheduleChanges: true,
    generalAnnouncements: true,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      console.log('NotificationPreferences: Loading OneSignal tags');
      
      // Get current tags from OneSignal
      const tags = await OneSignal.User.getTags();
      console.log('NotificationPreferences: Current tags:', tags);
      
      // Map tags to preferences
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
      
      // Update OneSignal tags
      await OneSignal.User.addTags({
        task_reminders: newPreferences.taskReminders ? 'true' : 'false',
        container_updates: newPreferences.containerUpdates ? 'true' : 'false',
        schedule_changes: newPreferences.scheduleChanges ? 'true' : 'false',
        general_announcements: newPreferences.generalAnnouncements ? 'true' : 'false',
      });
      
      console.log('NotificationPreferences: ✅ Preferences saved successfully');
      setPreferences(newPreferences);
    } catch (error) {
      console.error('NotificationPreferences: Error saving preferences:', error);
      Alert.alert('שגיאה', 'לא ניתן לשמור את ההעדפות. אנא נסה שוב.');
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    savePreferences(newPreferences);
  };

  const handleEnableNotifications = async () => {
    console.log('NotificationPreferences: User tapped enable notifications');
    setLoading(true);
    
    try {
      const granted = await requestPermission();
      
      if (granted) {
        Alert.alert(
          'הצלחה',
          'התראות הופעלו בהצלחה! תקבל עדכונים על משימות, מכולות ולוח זמנים.',
          [{ text: 'אישור' }]
        );
      } else {
        Alert.alert(
          'שים לב',
          'לא ניתן להפעיל התראות. אנא אפשר התראות בהגדרות המכשיר.',
          [{ text: 'אישור' }]
        );
      }
    } catch (error) {
      console.error('NotificationPreferences: Error enabling notifications:', error);
      Alert.alert('שגיאה', 'אירעה שגיאה בהפעלת ההתראות.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    console.log('NotificationPreferences: User tapped back button');
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'הגדרות התראות',
          headerBackTitle: 'חזור',
          headerStyle: {
            backgroundColor: designColors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: '700',
          },
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
          <Text style={styles.headerSubtitle}>
            בחר אילו התראות תרצה לקבל
          </Text>
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
              התראות Push זמינות רק באפליקציה במכשיר נייד (Android/iOS).
              {'\n'}
              כדי לקבל התראות, אנא פתח את האפליקציה במכשיר הנייד שלך.
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

            {/* Task Reminders */}
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

            {/* Container Updates */}
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

            {/* Schedule Changes */}
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

            {/* General Announcements */}
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
              color={designColors.textSecondary}
            />
            <Text style={styles.infoSectionText}>
              ניתן לשנות את ההעדפות בכל עת. השינויים ייכנסו לתוקף מיידית.
            </Text>
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
    paddingBottom: 100,
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
    fontSize: typography.small.fontSize,
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
    fontSize: typography.small.fontSize,
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
    color: designColors.text,
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
    color: designColors.text,
    marginBottom: spacing.xs,
  },
  preferenceDescription: {
    fontSize: typography.small.fontSize,
    color: designColors.textSecondary,
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
    fontSize: typography.small.fontSize,
    color: designColors.textSecondary,
    lineHeight: 20,
  },
});
