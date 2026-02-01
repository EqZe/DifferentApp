
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
  console.log('Notifications: Starting push notification registration');

  // Check if running on a physical device
  if (!Device.isDevice) {
    console.log('Notifications: Must use physical device for push notifications');
    return null;
  }

  try {
    // Configure notification channel for Android FIRST (before requesting permissions)
    if (Platform.OS === 'android') {
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
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log('Notifications: Existing permission status:', existingStatus);

    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      console.log('Notifications: Requesting permissions');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log('Notifications: Permission request result:', status);
    }

    // If permission not granted, return null
    if (finalStatus !== 'granted') {
      console.log('Notifications: Permission not granted');
      return null;
    }

    // Get the Expo push token
    console.log('Notifications: Getting Expo push token');
    
    // Try to get projectId from Constants
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    console.log('Notifications: Project ID from config:', projectId);
    
    // Build experienceId for development/Expo Go
    const slug = Constants.expoConfig?.slug || 'Different';
    const owner = Constants.expoConfig?.owner || Constants.manifest?.owner || 'anonymous';
    const experienceId = `@${owner}/${slug}`;
    
    console.log('Notifications: Experience ID:', experienceId);
    console.log('Notifications: Slug:', slug);
    console.log('Notifications: Owner:', owner);

    let tokenData;
    
    try {
      // Try with projectId first (for production builds with EAS)
      if (projectId && projectId !== 'your-project-id-here') {
        console.log('Notifications: Attempting to get token with projectId');
        tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        });
      } else {
        // Fallback for development - try multiple approaches
        console.log('Notifications: Attempting to get token with experienceId (development mode)');
        
        try {
          // First attempt: Use full experienceId
          tokenData = await Notifications.getExpoPushTokenAsync({
            experienceId: experienceId,
          });
        } catch (firstError: any) {
          console.log('Notifications: First attempt failed, trying without parameters');
          
          try {
            // Second attempt: Try without any parameters (works in some dev environments)
            tokenData = await Notifications.getExpoPushTokenAsync();
          } catch (secondError: any) {
            console.log('Notifications: Second attempt failed, trying with slug only');
            
            // Third attempt: Try with just the slug
            tokenData = await Notifications.getExpoPushTokenAsync({
              experienceId: slug,
            });
          }
        }
      }
    } catch (tokenError: any) {
      console.error('Notifications: All token retrieval attempts failed:', tokenError);
      console.error('Notifications: Error code:', tokenError.code);
      console.error('Notifications: Error message:', tokenError.message);
      throw tokenError;
    }

    const token = tokenData.data;
    console.log('Notifications: Successfully obtained push token:', token);

    return token;
  } catch (error: any) {
    console.error('Notifications: Error registering for push notifications:', error);
    
    // Log more details about the error
    if (error.code) {
      console.error('Notifications: Error code:', error.code);
    }
    if (error.message) {
      console.error('Notifications: Error message:', error.message);
    }
    
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

    console.log('Notifications: Local notification scheduled with ID:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Notifications: Error scheduling local notification:', error);
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
    console.log('Notifications: All notifications cancelled');
  } catch (error) {
    console.error('Notifications: Error cancelling notifications:', error);
  }
}
