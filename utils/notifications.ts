
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
 * Returns null if registration fails or device is not physical
 * NOTE: This function does NOT save the token to the database
 * The caller (UserContext) is responsible for saving the token
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    console.log('🔔 Notifications: ========== STARTING PUSH NOTIFICATION REGISTRATION ==========');
    console.log('🔔 Notifications: Device.isDevice =', Device.isDevice);
    console.log('🔔 Notifications: Platform.OS =', Platform.OS);
    console.log('🔔 Notifications: App ownership =', Constants.appOwnership);

    // Check if running on a physical device
    if (!Device.isDevice) {
      console.log('🔔 Notifications: ⚠️ Skipping - must use physical device for push notifications');
      throw new Error('התראות דורשות מכשיר פיזי. לא ניתן להשתמש בסימולטור.');
    }

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
    let existingStatus = 'undetermined';
    try {
      const permissionResult = await Notifications.getPermissionsAsync();
      existingStatus = permissionResult.status;
      console.log('🔔 Notifications: Existing permission status:', existingStatus);
      console.log('🔔 Notifications: Full permission details:', JSON.stringify(permissionResult, null, 2));
    } catch (permError) {
      console.log('🔔 Notifications: ⚠️ Could not check existing permissions:', permError);
      // Continue to request permissions anyway
    }

    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      try {
        console.log('🔔 Notifications: Requesting permissions from user...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('🔔 Notifications: Permission request result:', status);
      } catch (requestError) {
        console.log('🔔 Notifications: ⚠️ Permission request failed:', requestError);
        throw new Error('לא ניתנו הרשאות להתראות. אנא אפשר התראות בהגדרות המכשיר.');
      }
    }

    // If permission not granted, return null
    if (finalStatus !== 'granted') {
      console.log('🔔 Notifications: ❌ Permission not granted, cannot register for push notifications');
      throw new Error('לא ניתנו הרשאות להתראות. אנא אפשר התראות בהגדרות המכשיר.');
    }

    console.log('🔔 Notifications: ✅ Permissions granted, attempting to get Expo push token');

    // Get the Expo push token
    console.log('🔔 Notifications: Attempting to get Expo push token');
    
    // Check if running in Expo Go
    const isExpoGo = Constants.appOwnership === 'expo';
    console.log('🔔 Notifications: Running in Expo Go:', isExpoGo);
    
    // Try to get projectId from Constants (EAS project ID)
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const hasValidProjectId = projectId && projectId !== 'YOUR_EAS_PROJECT_ID_HERE' && projectId.length > 10;
    
    if (hasValidProjectId) {
      console.log('🔔 Notifications: ✅ Found valid EAS project ID in config:', projectId);
    } else {
      console.log('🔔 Notifications: ⚠️ No valid EAS project ID found in app.json');
      console.log('🔔 Notifications: ⚠️ Please add your EAS project ID to app.json under extra.eas.projectId');
      console.log('🔔 Notifications: ⚠️ You can find your project ID by running: eas project:info');
    }
    
    // Build experienceId for development/Expo Go
    const slug = Constants.expoConfig?.slug || 'Different';
    const owner = Constants.expoConfig?.owner || 'different';
    const experienceId = `@${owner}/${slug}`;
    
    console.log('🔔 Notifications: Configuration:', {
      slug,
      owner,
      experienceId,
      hasProjectId: hasValidProjectId,
      isExpoGo,
      appOwnership: Constants.appOwnership
    });

    let token: string | null = null;
    let lastError: any = null;
    
    // Strategy 1: Try with EAS projectId first (for production builds)
    if (hasValidProjectId && !isExpoGo) {
      try {
        console.log('🔔 Notifications: Attempt 1 - Using EAS project ID (production build)');
        const result = await Notifications.getExpoPushTokenAsync({ 
          projectId: projectId! 
        });
        token = result.data;
        console.log('🔔 Notifications: ✅ Successfully obtained push token with EAS project ID:', token);
      } catch (projectIdError: any) {
        console.log('🔔 Notifications: ⚠️ EAS project ID approach failed:', projectIdError?.message || projectIdError);
        lastError = projectIdError;
      }
    }
    
    // Strategy 2: For Expo Go, use experienceId
    if (!token && isExpoGo) {
      try {
        console.log('🔔 Notifications: Attempt 2 - Using experienceId (Expo Go)');
        const result = await Notifications.getExpoPushTokenAsync({ 
          experienceId 
        });
        token = result.data;
        console.log('🔔 Notifications: ✅ Successfully obtained push token in Expo Go:', token);
      } catch (expoGoError: any) {
        console.log('🔔 Notifications: ⚠️ Expo Go experienceId approach failed:', expoGoError?.message || expoGoError);
        lastError = expoGoError;
      }
    }
    
    // Strategy 3: Try without parameters (fallback)
    if (!token) {
      try {
        console.log('🔔 Notifications: Attempt 3 - Using default configuration (fallback)');
        const result = await Notifications.getExpoPushTokenAsync();
        token = result.data;
        console.log('🔔 Notifications: ✅ Successfully obtained push token with default config:', token);
      } catch (defaultError: any) {
        console.log('🔔 Notifications: ⚠️ Default configuration approach failed:', defaultError?.message || defaultError);
        lastError = defaultError;
      }
    }

    if (!token) {
      console.log('🔔 Notifications: ❌ All token retrieval attempts failed');
      console.log('🔔 Notifications: Last error:', lastError?.message || lastError);
      console.log('🔔 Notifications: Full last error:', JSON.stringify(lastError, null, 2));
      
      if (!hasValidProjectId && !isExpoGo) {
        throw new Error('לא ניתן לקבל טוקן התראות.\n\nנדרש EAS Project ID בקובץ app.json.\nאנא צור קשר עם התמיכה.\n\nשגיאה טכנית: Missing EAS project ID');
      }
      
      if (isExpoGo) {
        throw new Error('לא ניתן לקבל טוקן התראות ב-Expo Go.\n\nנסה:\n1. ודא שיש חיבור אינטרנט יציב\n2. סגור ופתח מחדש את האפליקציה\n3. אם הבעיה נמשכת, נסה להתנתק ולהתחבר מחדש\n\nשגיאה טכנית: ' + (lastError?.message || 'Unknown error'));
      } else {
        throw new Error('לא ניתן לקבל טוקן התראות. אנא צור קשר עם התמיכה.\n\nשגיאה טכנית: ' + (lastError?.message || 'Unknown error'));
      }
    }

    console.log('🔔 Notifications: ✅ Push token obtained successfully:', token);
    console.log('🔔 Notifications: Token will be saved by the caller (UserContext)');
    console.log('🔔 Notifications: ========== REGISTRATION COMPLETE ==========');

    return token;
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
