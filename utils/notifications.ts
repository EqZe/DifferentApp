
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

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
    console.log('🔔 Notifications: Starting push notification registration');
    console.log('🔔 Notifications: Device.isDevice =', Device.isDevice);
    console.log('🔔 Notifications: Platform.OS =', Platform.OS);

    // Check if running on a physical device
    if (!Device.isDevice) {
      console.log('🔔 Notifications: ⚠️ Skipping - must use physical device for push notifications');
      return null;
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
        return null;
      }
    }

    // If permission not granted, return null
    if (finalStatus !== 'granted') {
      console.log('🔔 Notifications: ❌ Permission not granted, cannot register for push notifications');
      return null;
    }

    console.log('🔔 Notifications: ✅ Permissions granted, attempting to get Expo push token');

    // Get the Expo push token
    console.log('🔔 Notifications: Attempting to get Expo push token');
    
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
      hasProjectId: hasValidProjectId
    });

    let token: string | null = null;
    
    // Try multiple approaches to get the token
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
        // Continue to next attempt
      }
    }

    if (!token) {
      console.log('🔔 Notifications: ⚠️ All token retrieval attempts failed - push notifications will not work');
      console.log('🔔 Notifications: This is normal in development mode without EAS configuration');
      return null;
    }

    console.log('🔔 Notifications: ✅ Push token obtained successfully:', token);

    // Save token to database
    try {
      console.log('🔔 Notifications: Getting current user from Supabase...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        console.log('🔔 Notifications: Saving push token to database for user:', user.id);
        const { error } = await supabase
          .from('users')
          .update({ push_token: token })
          .eq('auth_user_id', user.id);
        
        if (error) {
          console.log('🔔 Notifications: ⚠️ Failed to save push token to database:', error.message);
        } else {
          console.log('🔔 Notifications: ✅ Push token saved to database successfully');
        }
      } else {
        console.log('🔔 Notifications: ⚠️ No user found, cannot save push token');
      }
    } catch (dbError) {
      console.log('🔔 Notifications: ⚠️ Error saving push token to database:', dbError);
    }

    return token;
  } catch (error: any) {
    console.log('🔔 Notifications: ⚠️ Push notification registration failed:', error?.message || error);
    console.log('🔔 Notifications: This is expected in development mode - push notifications require EAS build or proper configuration');
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
</write file>

<write file="contexts/UserContext.tsx">
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { api, type User } from '@/utils/api';
import { registerForPushNotificationsAsync } from '@/utils/notifications';

interface UserContextType {
  user: User | null;
  session: Session | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  registerPushNotifications: () => Promise<string | null>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserProfile = useCallback(async (authUserId: string) => {
    try {
      console.log('👤 UserContext: Loading user profile for auth user', authUserId);
      const userData = await api.getUserByAuthId(authUserId);
      console.log('👤 UserContext: ✅ User profile loaded -', userData.fullName, 'hasContract:', userData.hasContract);
      setUserState(userData);

      // Register for push notifications after successful login (non-blocking)
      // Use setTimeout to ensure this doesn't block the UI
      setTimeout(() => {
        console.log('👤 UserContext: Triggering push notification registration (delayed 2 seconds)');
        registerPushToken(authUserId).catch(err => {
          console.log('👤 UserContext: ⚠️ Push token registration failed (non-critical):', err?.message || err);
        });
      }, 2000);
    } catch (error) {
      console.error('👤 UserContext: ❌ Error loading user profile:', error);
      setUserState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerPushToken = async (authUserId: string): Promise<string | null> => {
    try {
      console.log('👤 UserContext: Starting push notification token registration for user:', authUserId);
      const pushToken = await registerForPushNotificationsAsync();
      
      if (pushToken) {
        console.log('👤 UserContext: ✅ Push token obtained:', pushToken);
        
        try {
          await api.savePushToken(authUserId, pushToken);
          console.log('👤 UserContext: ✅ Push token saved to database');
          return pushToken;
        } catch (saveError: any) {
          console.log('👤 UserContext: ⚠️ Failed to save push token:', saveError?.message || saveError);
          return null;
        }
      } else {
        console.log('👤 UserContext: ℹ️ No push token obtained (expected in development/simulator)');
        return null;
      }
    } catch (error: any) {
      console.log('👤 UserContext: ⚠️ Push notification setup failed:', error?.message || error);
      // This is non-critical - app continues to work without push notifications
      return null;
    }
  };

  // Expose registerPushNotifications so it can be called manually from UI
  const registerPushNotifications = useCallback(async (): Promise<string | null> => {
    if (!session?.user?.id) {
      console.log('👤 UserContext: Cannot register push notifications - no session');
      return null;
    }
    console.log('👤 UserContext: Manual push notification registration triggered');
    return registerPushToken(session.user.id);
  }, [session]);

  useEffect(() => {
    console.log('👤 UserContext: Initializing Supabase Auth session');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('👤 UserContext: Error getting initial session', error);
        setIsLoading(false);
        return;
      }

      console.log('👤 UserContext: Initial session check', session ? 'session found' : 'no session');
      
      if (session) {
        console.log('👤 UserContext: Session exists, user ID:', session.user.id);
        console.log('👤 UserContext: Session expires at:', new Date(session.expires_at! * 1000).toLocaleString());
        setSession(session);
        loadUserProfile(session.user.id);
      } else {
        console.log('👤 UserContext: No existing session found');
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('👤 UserContext: Auth state changed -', _event, session ? 'session exists' : 'no session');
      
      if (session) {
        console.log('👤 UserContext: New session for user:', session.user.id);
      }
      
      setSession(session);
      
      if (session) {
        loadUserProfile(session.user.id);
      } else {
        console.log('👤 UserContext: Session cleared, logging out user');
        setUserState(null);
        setIsLoading(false);
      }
    });

    return () => {
      console.log('👤 UserContext: Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const setUser = async (userData: User | null) => {
    console.log('👤 UserContext: setUser called', userData ? userData.fullName : 'null');
    setUserState(userData);
  };

  const refreshUser = async () => {
    if (!session?.user?.id) {
      console.log('👤 UserContext: refreshUser - No session to refresh');
      return;
    }

    try {
      console.log('👤 UserContext: Refreshing user data from database');
      const freshUserData = await api.getUserByAuthId(session.user.id);
      console.log('👤 UserContext: ✅ User data refreshed, hasContract:', freshUserData.hasContract);
      setUserState(freshUserData);
    } catch (error) {
      console.error('👤 UserContext: ❌ Failed to refresh user data', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, session, setUser, refreshUser, registerPushNotifications, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
</write file>

Now let's update the profile screen to add a manual "Register for Push Notifications" button:

<write file="app/(tabs)/profile.tsx">
import LottieView from 'lottie-react-native';
import { api } from '@/utils/api';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { designColors, typography, spacing, radius, shadows, layout } from '@/styles/designSystem';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  useColorScheme,
  I18nManager,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { sendTestTaskReminders } from '@/utils/notifications';
import React, { useState, useEffect } from 'react';
import { IconSymbol } from '@/components/IconSymbol';
import { useUser } from '@/contexts/UserContext';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl * 2,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  greeting: {
    ...typography.h1,
    color: designColors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'right',
  },
  subtitle: {
    ...typography.body,
    color: designColors.text.secondary,
    textAlign: 'right',
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: designColors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'right',
  },
  card: {
    backgroundColor: designColors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: designColors.border,
  },
  infoLabel: {
    ...typography.body,
    color: designColors.text.secondary,
    textAlign: 'right',
  },
  infoValue: {
    ...typography.bodyBold,
    color: designColors.text.primary,
    textAlign: 'right',
  },
  button: {
    backgroundColor: designColors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.small,
  },
  buttonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  logoutButton: {
    backgroundColor: designColors.error,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadows.small,
  },
  logoutButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: designColors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '80%',
    maxWidth: 400,
    ...shadows.large,
  },
  modalTitle: {
    ...typography.h2,
    color: designColors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  modalText: {
    ...typography.body,
    color: designColors.text.secondary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: designColors.border,
  },
  modalButtonConfirm: {
    backgroundColor: designColors.error,
  },
  modalButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  notificationButton: {
    backgroundColor: designColors.secondary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.small,
  },
  notificationButtonText: {
    ...typography.button,
    color: '#FFFFFF',
  },
});

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'לא הוגדר';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    return 'תאריך לא תקין';
  }
}

export default function ProfileScreen() {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRegisteringNotifications, setIsRegisteringNotifications] = useState(false);
  const router = useRouter();
  const { user, session, refreshUser, registerPushNotifications } = useUser();
  const colorScheme = useColorScheme();

  useEffect(() => {
    console.log('ProfileScreen: Component mounted, user:', user?.fullName);
    console.log('ProfileScreen: Session:', session ? 'exists' : 'none');
    
    // Refresh user data when screen is focused
    if (session && user) {
      refreshUser();
    }
  }, [session, user, refreshUser]);

  const handleLogout = async () => {
    console.log('ProfileScreen: User tapped logout button');
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    console.log('ProfileScreen: User confirmed logout');
    setIsLoggingOut(true);
    
    try {
      await api.signOut();
      console.log('ProfileScreen: ✅ Logout successful');
      setShowLogoutModal(false);
      router.replace('/register');
    } catch (error: any) {
      console.error('ProfileScreen: ❌ Logout failed:', error);
      Alert.alert('שגיאה', error.message || 'שגיאה בהתנתקות');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleTestNotification = async () => {
    console.log('ProfileScreen: User tapped test notification button');
    
    try {
      await sendTestTaskReminders('בדיקת התראות מערכת');
      Alert.alert(
        'התראות נשלחו',
        'נשלחו 3 התראות בדיקה (7 ימים, 3 ימים, יום אחד). בדוק את מגש ההתראות.',
        [{ text: 'אישור' }]
      );
    } catch (error: any) {
      console.error('ProfileScreen: ❌ Test notification failed:', error);
      Alert.alert('שגיאה', error.message || 'שגיאה בשליחת התראות בדיקה');
    }
  };

  const handleRegisterPushNotifications = async () => {
    console.log('ProfileScreen: User tapped register push notifications button');
    setIsRegisteringNotifications(true);
    
    try {
      const token = await registerPushNotifications();
      
      if (token) {
        console.log('ProfileScreen: ✅ Push token registered:', token);
        Alert.alert(
          'הצלחה!',
          'הרישום להתראות הושלם בהצלחה. תקבל התראות על עדכונים במערכת.',
          [{ text: 'אישור' }]
        );
        // Refresh user data to show updated push token status
        await refreshUser();
      } else {
        console.log('ProfileScreen: ⚠️ No push token obtained');
        Alert.alert(
          'שים לב',
          'לא ניתן לרשום להתראות. ודא שהאפליקציה רצה על מכשיר פיזי ושניתנו הרשאות להתראות.',
          [{ text: 'אישור' }]
        );
      }
    } catch (error: any) {
      console.error('ProfileScreen: ❌ Push notification registration failed:', error);
      Alert.alert('שגיאה', error.message || 'שגיאה ברישום להתראות');
    } finally {
      setIsRegisteringNotifications(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={designColors.primary} />
          <Text style={{ ...typography.body, color: designColors.text.secondary, marginTop: spacing.md }}>
            טוען פרטי משתמש...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const greetingText = `שלום, ${user.fullName}`;
  const subtitleText = user.hasContract ? 'משתמש עם הסכם' : 'משתמש ללא הסכם';
  const contractStatusText = user.hasContract ? 'יש הסכם' : 'אין הסכם';
  const contractStatusColor = user.hasContract ? designColors.success : designColors.warning;
  const travelDateText = formatDate(user.travelDate);
  const pushTokenStatusText = user.pushToken ? 'רשום להתראות ✓' : 'לא רשום להתראות';
  const pushTokenStatusColor = user.pushToken ? designColors.success : designColors.error;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{greetingText}</Text>
          <Text style={styles.subtitle}>{subtitleText}</Text>
        </View>

        {/* User Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>פרטים אישיים</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{user.fullName}</Text>
              <Text style={styles.infoLabel}>שם מלא</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{user.city}</Text>
              <Text style={styles.infoLabel}>עיר</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{user.phoneNumber || 'לא הוזן'}</Text>
              <Text style={styles.infoLabel}>טלפון</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoValue}>{user.email || 'לא הוזן'}</Text>
              <Text style={styles.infoLabel}>אימייל</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.statusBadge, { backgroundColor: contractStatusColor + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: contractStatusColor }]}>
                  {contractStatusText}
                </Text>
              </View>
              <Text style={styles.infoLabel}>סטטוס הסכם</Text>
            </View>
          </View>
        </View>

        {/* Travel Info Section (only if has contract) */}
        {user.hasContract && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>פרטי נסיעה</Text>
            <View style={styles.card}>
              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.infoValue}>{travelDateText}</Text>
                <Text style={styles.infoLabel}>תאריך נסיעה</Text>
              </View>
            </View>
          </View>
        )}

        {/* Push Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>התראות</Text>
          <View style={styles.card}>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.statusBadge, { backgroundColor: pushTokenStatusColor + '20' }]}>
                <Text style={[styles.statusBadgeText, { color: pushTokenStatusColor }]}>
                  {pushTokenStatusText}
                </Text>
              </View>
              <Text style={styles.infoLabel}>סטטוס התראות</Text>
            </View>

            {/* Register for Push Notifications Button */}
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={handleRegisterPushNotifications}
              disabled={isRegisteringNotifications}
            >
              {isRegisteringNotifications ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.notificationButtonText}>
                  {user.pushToken ? 'רענן רישום להתראות' : 'הירשם להתראות'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Test Notification Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleTestNotification}
            >
              <Text style={styles.buttonText}>שלח התראת בדיקה</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>התנתק</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Confirmation Modal */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>התנתקות</Text>
            <Text style={styles.modalText}>
              האם אתה בטוח שברצונך להתנתק מהמערכת?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
              >
                <Text style={styles.modalButtonText}>ביטול</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonText}>התנתק</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
