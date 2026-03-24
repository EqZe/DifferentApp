/**
 * notifications.ts — Push notification utilities.
 *
 * This app uses OneSignal (via OneSignalContext) as the primary push
 * notification system. The functions in this file are helpers for:
 *  - Sending push notifications via the Supabase Edge Function (server-side).
 *  - Scheduling local notifications via expo-notifications (in-app reminders).
 *
 * NOTE: Do NOT call OneSignal.initialize() or manage push tokens here.
 *       All OneSignal SDK interactions are owned by OneSignalContext.tsx.
 */

import * as ExpoNotifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure how expo-notifications handles foreground notifications.
// OneSignal handles its own foreground display via the foregroundWillDisplay
// listener in OneSignalContext. This handler covers local (scheduled) notifications.
ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const SUPABASE_URL = 'https://pgrcmurwamszgjsdbgtq.supabase.co';

// ─── Local notification helpers ───────────────────────────────────────────────

/**
 * Schedule a local notification (for in-app reminders).
 * Returns the notification ID, or null if scheduling failed.
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  triggerSeconds = 5
): Promise<string | null> {
  try {
    console.log('[Notifications] scheduleLocalNotification', {
      title,
      body,
      triggerSeconds,
    });

    if (!Device.isDevice && Platform.OS !== 'web') {
      console.log(
        '[Notifications] ⚠️ Local notifications may not work on simulators'
      );
    }

    const { status } = await ExpoNotifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log(
        '[Notifications] ⚠️ Permission not granted, requesting...'
      );
      const { status: newStatus } =
        await ExpoNotifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        console.log(
          '[Notifications] ⚠️ Permission denied, cannot schedule notification'
        );
        return null;
      }
    }

    const notificationId =
      await ExpoNotifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: ExpoNotifications.AndroidNotificationPriority.HIGH,
          data: { source: 'local' },
        },
        trigger:
          triggerSeconds === 0
            ? null
            : { seconds: triggerSeconds },
      });

    console.log(
      '[Notifications] ✅ Local notification scheduled with ID:',
      notificationId
    );
    return notificationId;
  } catch (error: any) {
    console.warn(
      '[Notifications] ⚠️ Error scheduling local notification:',
      error?.message || error
    );
    return null;
  }
}

/**
 * Show an immediate local notification (no delay).
 */
export async function showImmediateNotification(
  title: string,
  body: string
): Promise<string | null> {
  try {
    console.log('[Notifications] showImmediateNotification', { title, body });

    const { status } = await ExpoNotifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log(
        '[Notifications] ⚠️ Permission not granted, requesting...'
      );
      const { status: newStatus } =
        await ExpoNotifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        console.log(
          '[Notifications] ⚠️ Permission denied, cannot show notification'
        );
        return null;
      }
    }

    const notificationId =
      await ExpoNotifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: ExpoNotifications.AndroidNotificationPriority.HIGH,
          data: { source: 'local', immediate: true },
        },
        trigger: null, // null = immediate
      });

    console.log(
      '[Notifications] ✅ Immediate notification shown with ID:',
      notificationId
    );
    return notificationId;
  } catch (error: any) {
    console.warn(
      '[Notifications] ⚠️ Error showing immediate notification:',
      error?.message || error
    );
    return null;
  }
}

/**
 * Cancel all scheduled local notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    console.log('[Notifications] Cancelling all scheduled notifications');
    await ExpoNotifications.cancelAllScheduledNotificationsAsync();
    console.log('[Notifications] ✅ All notifications cancelled');
  } catch (error) {
    console.warn('[Notifications] ⚠️ Error cancelling notifications:', error);
  }
}

// ─── Server-side push notification helpers ────────────────────────────────────
// These call the Supabase Edge Function which uses the OneSignal REST API
// (https://onesignal.com/api/v1/notifications) to send push notifications.
// The Edge Function is responsible for looking up player IDs / external user IDs
// and constructing the correct OneSignal payload.

/**
 * Send a push notification via the Supabase Edge Function to specific
 * OneSignal player IDs (subscription IDs).
 *
 * The Edge Function must POST to:
 *   https://onesignal.com/api/v1/notifications
 * with the OneSignal App ID and REST API key, targeting by `include_player_ids`.
 */
export async function sendPushNotificationToTokens(
  accessToken: string,
  tokens: string | string[],
  title: string,
  body: string,
  data?: Record<string, any>,
  options?: {
    sound?: string;
    badge?: number;
    priority?: 'default' | 'normal' | 'high';
    channelId?: string;
  }
): Promise<boolean> {
  try {
    console.log(
      '[Notifications] sendPushNotificationToTokens — tokens:',
      Array.isArray(tokens) ? tokens.length : 1,
      '| title:',
      title
    );

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/send-push-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          to: tokens,
          title,
          body,
          data: data ?? {},
          sound: options?.sound ?? 'default',
          badge: options?.badge,
          priority: options?.priority ?? 'high',
          channelId: options?.channelId ?? 'default',
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error(
        '[Notifications] ⚠️ sendPushNotificationToTokens failed — HTTP',
        response.status,
        ':',
        text.substring(0, 300)
      );
      return false;
    }

    const result = await response.json();
    console.log(
      '[Notifications] ✅ Push notification sent successfully:',
      result
    );
    return true;
  } catch (error: any) {
    console.error(
      '[Notifications] ⚠️ sendPushNotificationToTokens error:',
      error?.message || error
    );
    return false;
  }
}

/**
 * Send a push notification via the Supabase Edge Function to specific user IDs.
 * The Edge Function fetches the player IDs from `user_push_tokens` and sends
 * via the OneSignal REST API targeting `include_player_ids` or
 * `include_external_user_ids`.
 */
export async function sendPushNotificationToUsers(
  accessToken: string,
  userIds: string | string[],
  title: string,
  body: string,
  data?: Record<string, any>,
  options?: {
    sound?: string;
    badge?: number;
    priority?: 'default' | 'normal' | 'high';
    channelId?: string;
  }
): Promise<boolean> {
  try {
    console.log(
      '[Notifications] sendPushNotificationToUsers — userIds:',
      Array.isArray(userIds) ? userIds.length : 1,
      '| title:',
      title
    );

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/send-push-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          type: 'send-to-users',
          userId: userIds,
          title,
          body,
          data: data ?? {},
          sound: options?.sound ?? 'default',
          badge: options?.badge,
          priority: options?.priority ?? 'high',
          channelId: options?.channelId ?? 'default',
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error(
        '[Notifications] ⚠️ sendPushNotificationToUsers failed — HTTP',
        response.status,
        ':',
        text.substring(0, 300)
      );
      return false;
    }

    const result = await response.json();
    console.log(
      '[Notifications] ✅ Push notification sent to users successfully:',
      result
    );
    return true;
  } catch (error: any) {
    console.error(
      '[Notifications] ⚠️ sendPushNotificationToUsers error:',
      error?.message || error
    );
    return false;
  }
}

/**
 * Trigger the task reminders Edge Function to send reminders for tasks
 * due in 7, 3, or 1 day. Can be called manually or via a cron job.
 */
export async function triggerTaskReminders(
  accessToken: string
): Promise<boolean> {
  try {
    console.log(
      '[Notifications] triggerTaskReminders — calling Edge Function'
    );

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/send-task-reminders`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error(
        '[Notifications] ⚠️ triggerTaskReminders failed — HTTP',
        response.status,
        ':',
        text.substring(0, 300)
      );
      return false;
    }

    const result = await response.json();
    console.log(
      '[Notifications] ✅ Task reminders triggered successfully:',
      result
    );
    return true;
  } catch (error: any) {
    console.error(
      '[Notifications] ⚠️ triggerTaskReminders error:',
      error?.message || error
    );
    return false;
  }
}

/**
 * Send all 3 types of task reminder local notifications for testing.
 * Simulates 7-day, 3-day, and 1-day reminders for a given task.
 */
export async function sendTestTaskReminders(
  taskTitle: string
): Promise<void> {
  try {
    console.log(
      '[Notifications] sendTestTaskReminders — taskTitle:',
      taskTitle
    );

    const { status } = await ExpoNotifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } =
        await ExpoNotifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        console.log(
          '[Notifications] ⚠️ Permission denied, cannot send test reminders'
        );
        throw new Error('לא ניתנו הרשאות להתראות');
      }
    }

    // 7-day reminder — immediate
    await ExpoNotifications.scheduleNotificationAsync({
      content: {
        title: '📅 תזכורת: 7 ימים למשימה',
        body: `נותרו 7 ימים למשימה: ${taskTitle}`,
        sound: true,
        priority: ExpoNotifications.AndroidNotificationPriority.HIGH,
        data: { type: '7_day_reminder', taskTitle },
      },
      trigger: null,
    });
    console.log('[Notifications] ✅ 7-day reminder sent');

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 3-day reminder — after 2 seconds
    await ExpoNotifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ תזכורת: 3 ימים למשימה',
        body: `נותרו רק 3 ימים למשימה: ${taskTitle}`,
        sound: true,
        priority: ExpoNotifications.AndroidNotificationPriority.HIGH,
        data: { type: '3_day_reminder', taskTitle },
      },
      trigger: {
        type: ExpoNotifications.SchedulableTriggerInputTypes.TimeInterval,
        seconds: 2,
        repeats: false,
      },
    });
    console.log('[Notifications] ✅ 3-day reminder scheduled');

    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 1-day reminder — after 4 seconds total
    await ExpoNotifications.scheduleNotificationAsync({
      content: {
        title: '🚨 דחוף: יום אחד למשימה!',
        body: `נותר יום אחד בלבד למשימה: ${taskTitle} - דורש טיפול מיידי!`,
        sound: true,
        priority: ExpoNotifications.AndroidNotificationPriority.MAX,
        data: { type: '1_day_reminder', taskTitle, critical: true },
      },
      trigger: {
        type: ExpoNotifications.SchedulableTriggerInputTypes.TimeInterval,
        seconds: 4,
        repeats: false,
      },
    });
    console.log('[Notifications] ✅ 1-day critical reminder scheduled');

    console.log(
      '[Notifications] ✅ All 3 test reminders sent/scheduled successfully'
    );
  } catch (error: any) {
    console.warn(
      '[Notifications] ⚠️ sendTestTaskReminders error:',
      error?.message || error
    );
    throw error;
  }
}
