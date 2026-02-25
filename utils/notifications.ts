
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and return the Expo push token
 * Uses getExpoPushTokenAsync() which works with Expo Go
 * Returns null if registration fails or device is not physical
 * NOTE: This function does NOT save the token to the database
 * The caller (UserContext) is responsible for saving the token
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    console.log('🔔 Notifications: ========== STARTING PUSH NOTIFICATION REGISTRATION ==========');
    console.log('🔔 Notifications: Device.isDevice =', Device.isDevice);
    console.log('🔔 Notifications: Platform.OS =', Platform.OS);
    console.log('🔔 Notifications: Constants.appOwnership =', Constants.appOwnership);
    console.log('🔔 Notifications: Running in Expo Go =', Constants.appOwnership === 'expo');

    // Check if running on a physical device OR in Expo Go
    // Expo Go works on physical devices but Device.isDevice returns false
    const isExpoGo = Constants.appOwnership === 'expo';
    const isPhysicalDevice = Device.isDevice;
    
    if (!isPhysicalDevice && !isExpoGo) {
      console.log('🔔 Notifications: ⚠️ Must use physical device or Expo Go for Push Notifications');
      // Graceful handling for web where permissions might be denied or not applicable
      if (Platform.OS === 'web') {
        const permission = await Notifications.getPermissionsAsync();
        if (permission.status !== 'granted') {
          console.log('🔔 Notifications: ⚠️ Push notification registration failed: Web permissions denied.');
          return null;
        }
      }
      return null;
    }

    console.log('🔔 Notifications: ✅ Device check passed (Physical device or Expo Go)');

    // Configure notification channel for Android FIRST (before requesting permissions)
    if (Platform.OS === 'android') {
      try {
        console.log('🔔 Notifications: Setting up Android notification channel');
        await Notifications.setNotificationChannelAsync('default', {
          name: 'תזכורות משימות',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2784F5',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });
        console.log('🔔 Notifications: ✅ Android channel created successfully');
      } catch (channelError) {
        console.log('🔔 Notifications: ⚠️ Android channel setup failed (non-critical):', channelError);
        // Continue anyway - this is not critical
      }
    }

    // Check existing permissions
    console.log('🔔 Notifications: Checking existing permissions...');
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    console.log('🔔 Notifications: Existing permission status:', existingStatus);

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      console.log('🔔 Notifications: Requesting permissions from user...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('🔔 Notifications: Permission request result:', status);
    }

    // If permission not granted, throw error
    if (finalStatus !== 'granted') {
      console.log('🔔 Notifications: ❌ Permission not granted, cannot register for push notifications');
      throw new Error('לא ניתנו הרשאות להתראות. אנא אפשר התראות בהגדרות המכשיר.');
    }

    console.log('🔔 Notifications: ✅ Permissions granted, attempting to get Expo push token');

    // Get EAS project ID from app.json
    const projectId = Constants.easConfig?.projectId || 'fe404aca-e46f-42c2-ac3a-50c265d87ae7';
    console.log('🔔 Notifications: Using EAS Project ID:', projectId);

    // CRITICAL: Using getExpoPushTokenAsync for Expo Go compatibility
    // This works with Expo Go and returns tokens in format: ExponentPushToken[xxxxxx]
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });

    if (!token || !token.data) {
      console.log('🔔 Notifications: ❌ Failed to obtain Expo push token');
      throw new Error('לא ניתן לקבל טוקן התראות. אנא צור קשר עם התמיכה.');
    }

    console.log('🔔 Notifications: ✅ Expo push token obtained successfully:', token.data);
    console.log('🔔 Notifications: Token type:', token.type); // 'expo'
    console.log('🔔 Notifications: Token will be saved by the caller (UserContext)');
    console.log('🔔 Notifications: ========== REGISTRATION COMPLETE ==========');

    return token.data; // Return the Expo push token (ExponentPushToken[xxxxxx])
  } catch (error: any) {
    console.log('🔔 Notifications: ⚠️ Push notification registration failed:', error?.message || error);
    console.log('🔔 Notifications: Full error details:', JSON.stringify(error, null, 2));
    console.log('🔔 Notifications: Error stack:', error?.stack);
    // Re-throw the error so the caller can handle it and show appropriate UI
    throw error;
  }
}

/**
 * Schedule a local notification (for testing purposes)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  triggerSeconds: number = 5
): Promise<string | null> {
  try {
    console.log('🔔 Notifications: Scheduling local notification', { title, body, triggerSeconds });

    // Check permissions first
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('🔔 Notifications: ⚠️ Permission not granted, requesting...');
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        console.log('🔔 Notifications: ⚠️ Permission denied, cannot schedule notification');
        return null;
      }
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { test: true },
      },
      trigger: triggerSeconds === 0 ? null : { seconds: triggerSeconds },
    });

    console.log('🔔 Notifications: ✅ Local notification scheduled with ID:', notificationId);
    return notificationId;
  } catch (error: any) {
    console.log('🔔 Notifications: ⚠️ Error scheduling local notification:', error?.message || error);
    console.log('🔔 Notifications: Full error details:', JSON.stringify(error, null, 2));
    return null;
  }
}

/**
 * Show an immediate notification (no delay)
 */
export async function showImmediateNotification(
  title: string,
  body: string
): Promise<string | null> {
  try {
    console.log('🔔 Notifications: Showing immediate notification', { title, body });

    // Check permissions first
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('🔔 Notifications: ⚠️ Permission not granted, requesting...');
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        console.log('🔔 Notifications: ⚠️ Permission denied, cannot show notification');
        return null;
      }
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { test: true },
      },
      trigger: null, // null = immediate
    });

    console.log('🔔 Notifications: ✅ Immediate notification shown with ID:', notificationId);
    return notificationId;
  } catch (error: any) {
    console.log('🔔 Notifications: ⚠️ Error showing immediate notification:', error?.message || error);
    console.log('🔔 Notifications: Full error details:', JSON.stringify(error, null, 2));
    return null;
  }
}

/**
 * Send all 3 types of task reminder notifications for testing
 * Simulates 7-day, 3-day, and 1-day reminders for a random task
 */
export async function sendTestTaskReminders(taskTitle: string): Promise<void> {
  try {
    console.log('🔔 Notifications: Sending all 3 test task reminders for:', taskTitle);

    // Check permissions first
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('🔔 Notifications: ⚠️ Permission not granted, requesting...');
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') {
        console.log('🔔 Notifications: ⚠️ Permission denied, cannot send notifications');
        throw new Error('לא ניתנו הרשאות להתראות');
      }
    }

    // 7-day reminder (first notification - immediate)
    const sevenDayTitle = '📅 תזכורת: 7 ימים למשימה';
    const sevenDayBody = `נותרו 7 ימים למשימה: ${taskTitle}`;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: sevenDayTitle,
        body: sevenDayBody,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: '7_day_reminder', taskTitle },
      },
      trigger: null, // Immediate
    });
    console.log('🔔 Notifications: ✅ 7-day reminder sent');

    // Wait 2 seconds before sending next notification
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3-day reminder (second notification - after 2 seconds)
    const threeDayTitle = '⚠️ תזכורת: 3 ימים למשימה';
    const threeDayBody = `נותרו רק 3 ימים למשימה: ${taskTitle}`;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: threeDayTitle,
        body: threeDayBody,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { type: '3_day_reminder', taskTitle },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TimeInterval,
        seconds: 2,
        repeats: false,
      },
    });
    console.log('🔔 Notifications: ✅ 3-day reminder scheduled');

    // Wait 2 more seconds before sending final notification
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 1-day reminder (third notification - after 4 seconds total, critical)
    const oneDayTitle = '🚨 דחוף: יום אחד למשימה!';
    const oneDayBody = `נותר יום אחד בלבד למשימה: ${taskTitle} - דורש טיפול מיידי!`;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: oneDayTitle,
        body: oneDayBody,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: { type: '1_day_reminder', taskTitle, critical: true },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TimeInterval,
        seconds: 4,
        repeats: false,
      },
    });
    console.log('🔔 Notifications: ✅ 1-day critical reminder scheduled');

    console.log('🔔 Notifications: ✅ All 3 test reminders sent/scheduled successfully');
  } catch (error: any) {
    console.log('🔔 Notifications: ⚠️ Error sending test task reminders:', error?.message || error);
    throw error;
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    console.log('🔔 Notifications: Cancelling all scheduled notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🔔 Notifications: ✅ All notifications cancelled');
  } catch (error) {
    console.log('🔔 Notifications: ⚠️ Error cancelling notifications:', error);
  }
}

/**
 * Send a push notification via Supabase Edge Function to specific Expo push tokens
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
    console.log('🔔 Notifications: Sending push notification via Supabase Edge Function');
    console.log('🔔 Notifications: Tokens:', Array.isArray(tokens) ? tokens.length : 1);
    console.log('🔔 Notifications: Title:', title);
    console.log('🔔 Notifications: Body:', body);

    const response = await fetch(
      'https://pgrcmurwamszgjsdbgtq.supabase.co/functions/v1/send-push-notification',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          to: tokens,
          title,
          body,
          data: data || {},
          sound: options?.sound || 'default',
          badge: options?.badge,
          priority: options?.priority || 'high',
          channelId: options?.channelId || 'default',
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('🔔 Notifications: ⚠️ Failed to send push notification:', result);
      return false;
    }

    console.log('🔔 Notifications: ✅ Push notification sent successfully:', result);
    return true;
  } catch (error: any) {
    console.error('🔔 Notifications: ⚠️ Error sending push notification:', error?.message || error);
    return false;
  }
}

/**
 * Send a push notification via Supabase Edge Function to specific user IDs
 * The Edge Function will fetch the push tokens from the database
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
    console.log('🔔 Notifications: Sending push notification to users via Supabase Edge Function');
    console.log('🔔 Notifications: User IDs:', Array.isArray(userIds) ? userIds.length : 1);
    console.log('🔔 Notifications: Title:', title);
    console.log('🔔 Notifications: Body:', body);

    const response = await fetch(
      'https://pgrcmurwamszgjsdbgtq.supabase.co/functions/v1/send-push-notification',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          type: 'send-to-users',
          userId: userIds,
          title,
          body,
          data: data || {},
          sound: options?.sound || 'default',
          badge: options?.badge,
          priority: options?.priority || 'high',
          channelId: options?.channelId || 'default',
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('🔔 Notifications: ⚠️ Failed to send push notification to users:', result);
      return false;
    }

    console.log('🔔 Notifications: ✅ Push notification sent to users successfully:', result);
    return true;
  } catch (error: any) {
    console.error('🔔 Notifications: ⚠️ Error sending push notification to users:', error?.message || error);
    return false;
  }
}

/**
 * Trigger the task reminders Edge Function to send reminders for tasks due in 7, 3, or 1 day
 * This can be called manually or set up as a cron job
 */
export async function triggerTaskReminders(accessToken: string): Promise<boolean> {
  try {
    console.log('🔔 Notifications: Triggering task reminders via Supabase Edge Function');

    const response = await fetch(
      'https://pgrcmurwamszgjsdbgtq.supabase.co/functions/v1/send-task-reminders',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({}),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('🔔 Notifications: ⚠️ Failed to trigger task reminders:', result);
      return false;
    }

    console.log('🔔 Notifications: ✅ Task reminders triggered successfully:', result);
    return true;
  } catch (error: any) {
    console.error('🔔 Notifications: ⚠️ Error triggering task reminders:', error?.message || error);
    return false;
  }
}
