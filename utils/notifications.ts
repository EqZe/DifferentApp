
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
    console.log('🔔 Notifications: Starting push notification registration');
    console.log('🔔 Notifications: Device.isDevice =', Device.isDevice);
    console.log('🔔 Notifications: Platform.OS =', Platform.OS);

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
    let existingStatus = 'undetermined';
    try {
      const permissionResult = await Notifications.getPermissionsAsync();
      existingStatus = permissionResult.status;
      console.log('🔔 Notifications: Existing permission status:', existingStatus);
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
    
    // Try to get projectId from Constants
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const hasValidProjectId = projectId && projectId !== 'your-project-id-here' && projectId.length > 10;
    
    if (hasValidProjectId) {
      console.log('🔔 Notifications: Found EAS project ID in config:', projectId);
    } else {
      console.log('🔔 Notifications: No EAS project ID found - using development mode');
    }
    
    // Build experienceId for development/Expo Go
    const slug = Constants.expoConfig?.slug || 'Different';
    const owner = Constants.expoConfig?.owner || Constants.manifest?.owner || 'different';
    const experienceId = `@${owner}/${slug}`;
    
    console.log('🔔 Notifications: Configuration:', {
      slug,
      owner,
      experienceId,
      hasProjectId: hasValidProjectId,
      isExpoGo
    });

    let token: string | null = null;
    let lastError: any = null;
    
    // For Expo Go, we need to use experienceId
    if (isExpoGo) {
      console.log('🔔 Notifications: Expo Go detected - using experienceId approach');
      try {
        const result = await Notifications.getExpoPushTokenAsync({ 
          experienceId 
        });
        token = result.data;
        console.log('🔔 Notifications: ✅ Successfully obtained push token in Expo Go:', token);
      } catch (expoGoError: any) {
        console.log('🔔 Notifications: ❌ Expo Go token retrieval failed:', expoGoError?.message || expoGoError);
        lastError = expoGoError;
        
        // Try alternative experienceId format
        try {
          console.log('🔔 Notifications: Trying alternative experienceId format...');
          const altExperienceId = slug;
          const result = await Notifications.getExpoPushTokenAsync({ 
            experienceId: altExperienceId 
          });
          token = result.data;
          console.log('🔔 Notifications: ✅ Successfully obtained push token with alternative format:', token);
        } catch (altError: any) {
          console.log('🔔 Notifications: ❌ Alternative format also failed:', altError?.message || altError);
          lastError = altError;
        }
      }
    } else {
      // Try multiple approaches for standalone builds
      const attempts = [
        // Attempt 1: Use projectId if available (for EAS builds)
        async () => {
          if (!hasValidProjectId) throw new Error('No valid project ID');
          console.log('🔔 Notifications: Attempt 1 - Using EAS project ID');
          const result = await Notifications.getExpoPushTokenAsync({ projectId: projectId! });
          return result.data;
        },
        // Attempt 2: Use experienceId (for Expo Go / development)
        async () => {
          console.log('🔔 Notifications: Attempt 2 - Using experience ID:', experienceId);
          const result = await Notifications.getExpoPushTokenAsync({ experienceId });
          return result.data;
        },
        // Attempt 3: Try without parameters (works in some environments)
        async () => {
          console.log('🔔 Notifications: Attempt 3 - Using default configuration');
          const result = await Notifications.getExpoPushTokenAsync();
          return result.data;
        },
        // Attempt 4: Try with just the slug
        async () => {
          console.log('🔔 Notifications: Attempt 4 - Using slug only:', slug);
          const result = await Notifications.getExpoPushTokenAsync({ experienceId: slug });
          return result.data;
        }
      ];

      // Try each approach until one succeeds
      for (let i = 0; i < attempts.length; i++) {
        try {
          token = await attempts[i]();
          if (token) {
            console.log('🔔 Notifications: ✅ Successfully obtained push token (attempt', i + 1, '):', token);
            break;
          }
        } catch (attemptError: any) {
          console.log(`🔔 Notifications: Attempt ${i + 1} failed:`, attemptError?.message || attemptError);
          lastError = attemptError;
          // Continue to next attempt
        }
      }
    }

    if (!token) {
      console.log('🔔 Notifications: ⚠️ All token retrieval attempts failed');
      console.log('🔔 Notifications: Last error:', lastError?.message || lastError);
      
      if (isExpoGo) {
        throw new Error('לא ניתן לקבל טוקן התראות ב-Expo Go. נסה:\n1. ודא שיש חיבור אינטרנט\n2. סגור ופתח מחדש את האפליקציה\n3. אם הבעיה נמשכת, צור EAS Build');
      } else {
        throw new Error('לא ניתן לקבל טוקן התראות. אנא צור קשר עם התמיכה.');
      }
    }

    console.log('🔔 Notifications: ✅ Push token obtained successfully:', token);
    console.log('🔔 Notifications: Token will be saved by the caller (UserContext)');

    return token;
  } catch (error: any) {
    console.log('🔔 Notifications: ⚠️ Push notification registration failed:', error?.message || error);
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
        return;
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
