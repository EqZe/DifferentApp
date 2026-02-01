
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
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    console.log('Notifications: Starting push notification registration');

    // Check if running on a physical device
    if (!Device.isDevice) {
      console.log('Notifications: Skipping - must use physical device for push notifications');
      return null;
    }

    // Configure notification channel for Android FIRST (before requesting permissions)
    if (Platform.OS === 'android') {
      try {
        console.log('Notifications: Setting up Android notification channel');
        await Notifications.setNotificationChannelAsync('default', {
          name: 'תזכורות משימות',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#2784F5',
          sound: 'default',
          enableVibrate: true,
          showBadge: true,
        });
        console.log('Notifications: Android channel created successfully');
      } catch (channelError) {
        console.log('Notifications: Android channel setup failed (non-critical):', channelError);
        // Continue anyway - this is not critical
      }
    }

    // Check existing permissions
    let existingStatus = 'undetermined';
    try {
      const permissionResult = await Notifications.getPermissionsAsync();
      existingStatus = permissionResult.status;
      console.log('Notifications: Existing permission status:', existingStatus);
    } catch (permError) {
      console.log('Notifications: Could not check existing permissions:', permError);
      // Continue to request permissions anyway
    }

    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      try {
        console.log('Notifications: Requesting permissions');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('Notifications: Permission request result:', status);
      } catch (requestError) {
        console.log('Notifications: Permission request failed:', requestError);
        return null;
      }
    }

    // If permission not granted, return null
    if (finalStatus !== 'granted') {
      console.log('Notifications: Permission not granted, cannot register for push notifications');
      return null;
    }

    // Get the Expo push token
    console.log('Notifications: Attempting to get Expo push token');
    
    // Try to get projectId from Constants
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const hasValidProjectId = projectId && projectId !== 'your-project-id-here' && projectId.length > 10;
    
    if (hasValidProjectId) {
      console.log('Notifications: Found EAS project ID in config');
    } else {
      console.log('Notifications: No EAS project ID found - using development mode');
    }
    
    // Build experienceId for development/Expo Go
    const slug = Constants.expoConfig?.slug || 'Different';
    const owner = Constants.expoConfig?.owner || Constants.manifest?.owner || 'different';
    const experienceId = `@${owner}/${slug}`;
    
    console.log('Notifications: Configuration:', {
      slug,
      owner,
      experienceId,
      hasProjectId: hasValidProjectId
    });

    let token: string | null = null;
    
    // Try multiple approaches to get the token
    const attempts = [
      // Attempt 1: Use projectId if available (for EAS builds)
      async () => {
        if (!hasValidProjectId) throw new Error('No valid project ID');
        console.log('Notifications: Attempt 1 - Using EAS project ID');
        const result = await Notifications.getExpoPushTokenAsync({ projectId: projectId! });
        return result.data;
      },
      // Attempt 2: Use experienceId (for Expo Go / development)
      async () => {
        console.log('Notifications: Attempt 2 - Using experience ID:', experienceId);
        const result = await Notifications.getExpoPushTokenAsync({ experienceId });
        return result.data;
      },
      // Attempt 3: Try without parameters (works in some environments)
      async () => {
        console.log('Notifications: Attempt 3 - Using default configuration');
        const result = await Notifications.getExpoPushTokenAsync();
        return result.data;
      },
      // Attempt 4: Try with just the slug
      async () => {
        console.log('Notifications: Attempt 4 - Using slug only:', slug);
        const result = await Notifications.getExpoPushTokenAsync({ experienceId: slug });
        return result.data;
      }
    ];

    // Try each approach until one succeeds
    for (let i = 0; i < attempts.length; i++) {
      try {
        token = await attempts[i]();
        if (token) {
          console.log('Notifications: ✅ Successfully obtained push token (attempt', i + 1, '):', token);
          break;
        }
      } catch (attemptError: any) {
        console.log(`Notifications: Attempt ${i + 1} failed:`, attemptError?.message || attemptError);
        // Continue to next attempt
      }
    }

    if (!token) {
      console.log('Notifications: ⚠️ All token retrieval attempts failed - push notifications will not work');
      console.log('Notifications: This is normal in development mode without EAS configuration');
      return null;
    }

    return token;
  } catch (error: any) {
    console.log('Notifications: ⚠️ Push notification registration failed:', error?.message || error);
    console.log('Notifications: This is expected in development mode - push notifications require EAS build or proper configuration');
    return null;
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
    console.log('Notifications: Scheduling local notification', { title, body, triggerSeconds });

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        seconds: triggerSeconds,
      },
    });

    console.log('Notifications: ✅ Local notification scheduled with ID:', notificationId);
    return notificationId;
  } catch (error) {
    console.log('Notifications: ⚠️ Error scheduling local notification:', error);
    return null;
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  try {
    console.log('Notifications: Cancelling all scheduled notifications');
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Notifications: ✅ All notifications cancelled');
  } catch (error) {
    console.log('Notifications: ⚠️ Error cancelling notifications:', error);
  }
}
