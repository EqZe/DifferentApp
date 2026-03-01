
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

    // CRITICAL: Web platform requires different handling
    if (Platform.OS === 'web') {
      console.log('🔔 Notifications: ⚠️ Running on web platform');
      console.log('🔔 Notifications: Web push notifications require service worker setup');
      console.log('🔔 Notifications: This is not supported in the current configuration');
      throw new Error('התראות Push אינן נתמכות בגרסת הדפדפן. אנא השתמש באפליקציה במכשיר נייד.');
    }

    // Check if running on a physical device OR in Expo Go
    // CRITICAL: On iOS with Expo Go, Device.isDevice is TRUE and appOwnership is 'expo'
    // On Android with Expo Go, Device.isDevice is TRUE and appOwnership is 'expo'
    // We should allow registration if EITHER condition is true
    const isExpoGo = Constants.appOwnership === 'expo';
    const isPhysicalDevice = Device.isDevice;
    
    console.log('🔔 Notifications: isPhysicalDevice =', isPhysicalDevice);
    console.log('🔔 Notifications: isExpoGo =', isExpoGo);
    
    // Allow registration if:
    // 1. Running on physical device (Device.isDevice === true), OR
    // 2. Running in Expo Go (Constants.appOwnership === 'expo')
    const canRegister = isPhysicalDevice || isExpoGo;
    
    if (!canRegister) {
      console.log('🔔 Notifications: ❌ Cannot register - not on physical device or Expo Go');
      console.log('🔔 Notifications: This typically means running in iOS Simulator or Android Emulator');
      throw new Error('התראות Push זמינות רק במכשירים פיזיים. אנא נסה במכשיר אמיתי (לא סימולטור).');
    }

    console.log('🔔 Notifications: ✅ Device check passed - can register for push notifications');

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
    let permissionsResult;
    try {
      permissionsResult = await Notifications.getPermissionsAsync();
      console.log('🔔 Notifications: Existing permission status:', permissionsResult.status);
      console.log('🔔 Notifications: Full permissions object:', JSON.stringify(permissionsResult, null, 2));
    } catch (permError: any) {
      console.log('🔔 Notifications: ❌ Error checking permissions:', permError?.message || permError);
      throw new Error('לא ניתן לבדוק הרשאות התראות. אנא בדוק את הגדרות המכשיר.');
    }

    let finalStatus = permissionsResult.status;

    // Request permissions if not already granted
    if (finalStatus !== 'granted') {
      console.log('🔔 Notifications: Requesting permissions from user...');
      try {
        const requestResult = await Notifications.requestPermissionsAsync();
        finalStatus = requestResult.status;
        console.log('🔔 Notifications: Permission request result:', finalStatus);
        console.log('🔔 Notifications: Full request result:', JSON.stringify(requestResult, null, 2));
      } catch (reqError: any) {
        console.log('🔔 Notifications: ❌ Error requesting permissions:', reqError?.message || reqError);
        throw new Error('לא ניתן לבקש הרשאות התראות. אנא אפשר התראות בהגדרות המכשיר.');
      }
    }

    // If permission not granted, throw error
    if (finalStatus !== 'granted') {
      console.log('🔔 Notifications: ❌ Permission not granted, cannot register for push notifications');
      console.log('🔔 Notifications: Final status:', finalStatus);
      throw new Error('לא ניתנו הרשאות להתראות. אנא אפשר התראות בהגדרות המכשיר ונסה שוב.');
    }

    console.log('🔔 Notifications: ✅ Permissions granted, attempting to get Expo push token');

    // Get EAS project ID from app.json
    const projectId = Constants.easConfig?.projectId;
    console.log('🔔 Notifications: EAS Project ID from Constants:', projectId);
    console.log('🔔 Notifications: Constants.expoConfig?.extra?.eas?.projectId:', Constants.expoConfig?.extra?.eas?.projectId);
    console.log('🔔 Notifications: App ownership:', Constants.appOwnership);
    
    if (!projectId) {
      console.log('🔔 Notifications: ⚠️ No EAS Project ID found in Constants.easConfig');
      console.log('🔔 Notifications: ⚠️ This is expected in development/Expo Go');
      console.log('🔔 Notifications: ⚠️ For production APK builds, you need to configure EAS project ID in app.json');
    }

    // CRITICAL: Using getExpoPushTokenAsync for Expo Go compatibility
    // This works with Expo Go and returns tokens in format: ExponentPushToken[xxxxxx]
    // For standalone builds (APK/IPA), it requires a valid EAS project ID
    console.log('🔔 Notifications: Calling getExpoPushTokenAsync...');
    let token;
    try {
      // If we have a project ID, use it. Otherwise, let getExpoPushTokenAsync try without it
      // (this will work in Expo Go but may fail in standalone builds)
      const tokenOptions = projectId ? { projectId } : {};
      console.log('🔔 Notifications: Token options:', JSON.stringify(tokenOptions, null, 2));
      
      token = await Notifications.getExpoPushTokenAsync(tokenOptions);
      console.log('🔔 Notifications: ✅ getExpoPushTokenAsync returned successfully');
    } catch (tokenError: any) {
      console.log('🔔 Notifications: ❌ Error getting Expo push token:', tokenError?.message || tokenError);
      console.log('🔔 Notifications: Token error details:', JSON.stringify(tokenError, null, 2));
      console.log('🔔 Notifications: Token error stack:', tokenError?.stack);
      console.log('🔔 Notifications: Token error code:', tokenError?.code);
      console.log('🔔 Notifications: Token error name:', tokenError?.name);
      
      // Provide more specific error messages based on the error
      const errorMessage = tokenError?.message?.toLowerCase() || '';
      const errorCode = tokenError?.code?.toLowerCase() || '';
      
      if (errorMessage.includes('network') || errorCode.includes('network')) {
        throw new Error('בעיית רשת. אנא בדוק את החיבור לאינטרנט ונסה שוב.');
      } else if (errorMessage.includes('project') || errorCode.includes('project') || errorMessage.includes('projectid')) {
        console.log('🔔 Notifications: ⚠️ Project ID error - this APK may not be configured correctly');
        console.log('🔔 Notifications: ⚠️ To fix: Add "extra": { "eas": { "projectId": "YOUR_PROJECT_ID" } } to app.json');
        throw new Error('האפליקציה לא מוגדרת כראוי להתראות. אנא צור קשר עם התמיכה.');
      } else if (errorMessage.includes('experience') || errorMessage.includes('manifest')) {
        console.log('🔔 Notifications: ⚠️ Experience/manifest error - APK configuration issue');
        throw new Error('שגיאת תצורה באפליקציה. אנא צור קשר עם התמיכה.');
      } else if (errorMessage.includes('timeout')) {
        throw new Error('פג תוקף הבקשה. אנא נסה שוב.');
      } else {
        console.log('🔔 Notifications: ⚠️ Unknown error type');
        throw new Error(`לא ניתן לקבל טוקן התראות: ${tokenError?.message || 'שגיאה לא ידועה'}. אנא נסה שוב או צור קשר עם התמיכה.`);
      }
    }

    if (!token || !token.data) {
      console.log('🔔 Notifications: ❌ Token object is invalid');
      console.log('🔔 Notifications: Token object:', JSON.stringify(token, null, 2));
      throw new Error('לא ניתן לקבל טוקן התראות. אנא נסה שוב מאוחר יותר.');
    }

    console.log('🔔 Notifications: ✅ Expo push token obtained successfully:', token.data);
    console.log('🔔 Notifications: Token type:', token.type); // 'expo'
    console.log('🔔 Notifications: Token will be saved by the caller (UserContext)');
    console.log('🔔 Notifications: ========== REGISTRATION COMPLETE ==========');

    return token.data; // Return the Expo push token (ExponentPushToken[xxxxxx])
  } catch (error: any) {
    console.log('🔔 Notifications: ⚠️ Push notification registration failed:', error?.message || error);
    console.log('🔔 Notifications: Error name:', error?.name);
    console.log('🔔 Notifications: Error code:', error?.code);
    console.log('🔔 Notifications: Full error details:', JSON.stringify(error, null, 2));
    console.log('🔔 Notifications: Error stack:', error?.stack);
    console.log('🔔 Notifications: ========== REGISTRATION FAILED ==========');
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
