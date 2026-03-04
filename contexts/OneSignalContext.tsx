
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import OneSignal from 'react-native-onesignal';
import { useUser } from './UserContext';

interface OneSignalContextType {
  isInitialized: boolean;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  playerId: string | null;
}

const OneSignalContext = createContext<OneSignalContextType>({
  isInitialized: false,
  hasPermission: false,
  requestPermission: async () => false,
  playerId: null,
});

export function useOneSignal() {
  return useContext(OneSignalContext);
}

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isUserLoading } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const isMounted = useRef(false);
  const isInitializing = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    
    // OneSignal doesn't work on Web - skip initialization
    if (Platform.OS === 'web') {
      console.log('🔔 OneSignal: Skipping initialization on Web platform');
      console.log('⚠️ Push notifications require a native Android or iOS build');
      console.log('📱 To test notifications:');
      console.log('   1. Build the app with: eas build --profile development --platform android');
      console.log('   2. Install the APK on a physical Android device');
      console.log('   3. Grant notification permissions when prompted');
      console.log('   4. Send a test notification from OneSignal dashboard');
      return;
    }
    
    // Prevent multiple initializations
    if (isInitializing.current) {
      console.log('🔔 OneSignal: Already initializing, skipping duplicate call');
      return;
    }
    
    isInitializing.current = true;
    console.log('🔔 OneSignal: Starting initialization on platform:', Platform.OS);
    
    // Initialize OneSignal with App ID
    const initializeOneSignal = async () => {
      try {
        console.log('🔔 OneSignal: Calling initialize with App ID: b732b467-6886-4c7b-b3d9-5010de1199d6');
        console.log('🔔 OneSignal: Platform:', Platform.OS);
        console.log('🔔 OneSignal: Device info:', {
          platform: Platform.OS,
          version: Platform.Version,
        });
        
        // Set the OneSignal App ID
        OneSignal.initialize('b732b467-6886-4c7b-b3d9-5010de1199d6');
        
        // Set log level for debugging
        OneSignal.Debug.setLogLevel(6);
        
        console.log('🔔 OneSignal: SDK initialized successfully');
        
        // Wait a moment for SDK to fully initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check current permission status
        const permission = await OneSignal.Notifications.getPermissionAsync();
        console.log('🔔 OneSignal: Current permission status:', permission);
        
        // Get the player ID (device token)
        const deviceState = await OneSignal.User.pushSubscription.getIdAsync();
        console.log('🔔 OneSignal: Player ID (device token):', deviceState);
        
        // Get subscription state
        const subscriptionState = await OneSignal.User.pushSubscription.getOptedInAsync();
        console.log('🔔 OneSignal: Subscription opted in:', subscriptionState);
        
        // Only update state if component is still mounted
        if (isMounted.current) {
          setIsInitialized(true);
          setHasPermission(permission);
          setPlayerId(deviceState);
        }
        
        console.log('🔔 OneSignal: Initialization complete. Ready to receive notifications.');
        console.log('🔔 OneSignal: To test notifications:');
        console.log('   1. Make sure you granted notification permissions');
        console.log('   2. Send a test notification from OneSignal dashboard');
        console.log('   3. Target this Player ID:', deviceState);
        
        // Listen for permission changes
        OneSignal.Notifications.addEventListener('permissionChange', (granted) => {
          console.log('🔔 OneSignal: Permission changed to:', granted);
          if (isMounted.current) {
            setHasPermission(granted);
          }
        });
        
        // Listen for foreground notifications (when app is open)
        OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
          console.log('🔔 OneSignal: Notification received in foreground:', event.notification);
          
          // Display the notification even when app is in foreground
          event.preventDefault();
          event.notification.display();
          
          // Show an alert to the user
          Alert.alert(
            event.notification.title || 'התראה חדשה',
            event.notification.body || '',
            [{ text: 'אישור', style: 'default' }]
          );
        });
        
        // Listen for notification clicks
        OneSignal.Notifications.addEventListener('click', (event) => {
          console.log('🔔 OneSignal: Notification clicked:', event.notification);
          console.log('🔔 OneSignal: Notification data:', event.notification.additionalData);
          
          // Handle notification click navigation here if needed
          // Example: router.push('/containers') based on notification data
        });
        
        console.log('🔔 OneSignal: All event listeners registered');
        
      } catch (error) {
        console.error('🔔 OneSignal: Initialization error:', error);
        console.error('🔔 OneSignal: Error details:', JSON.stringify(error, null, 2));
      }
    };

    initializeOneSignal();

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Set external user ID when user logs in
  useEffect(() => {
    // Skip on Web
    if (Platform.OS === 'web') {
      return;
    }
    
    // Wait for both OneSignal and user to be ready
    if (!isInitialized || isUserLoading || !user?.id) {
      console.log('🔔 OneSignal: Waiting for initialization or user data', {
        isInitialized,
        isUserLoading,
        hasUser: !!user?.id,
        userId: user?.id
      });
      return;
    }

    console.log('🔔 OneSignal: Setting external user ID:', user.id);
    console.log('🔔 OneSignal: User details:', {
      id: user.id,
      fullName: user.fullName,
      city: user.city,
      hasContract: user.hasContract
    });
    
    try {
      // Login the user with their ID
      OneSignal.login(user.id);
      console.log('🔔 OneSignal: User logged in successfully');
      
      // Set user properties for segmentation
      OneSignal.User.addTags({
        user_id: user.id,
        full_name: user.fullName || '',
        city: user.city || '',
        has_contract: user.hasContract ? 'true' : 'false',
      });
      console.log('🔔 OneSignal: User tags set successfully');
      
      // Log the subscription ID for debugging
      OneSignal.User.pushSubscription.getIdAsync().then(id => {
        console.log('🔔 OneSignal: Push subscription ID after login:', id);
        if (isMounted.current) {
          setPlayerId(id);
        }
      });
      
    } catch (error) {
      console.error('🔔 OneSignal: Error setting user ID:', error);
      console.error('🔔 OneSignal: Error details:', JSON.stringify(error, null, 2));
    }
  }, [isInitialized, isUserLoading, user]);

  const requestPermission = async (): Promise<boolean> => {
    try {
      console.log('🔔 OneSignal: User requested notification permission');
      console.log('🔔 OneSignal: Current state - isInitialized:', isInitialized, 'hasPermission:', hasPermission);
      
      if (Platform.OS === 'web') {
        console.log('🔔 OneSignal: Web platform - permission not supported');
        Alert.alert(
          'התראות לא זמינות',
          'התראות פוש זמינות רק באפליקציה המותקנת על מכשיר Android או iOS.',
          [{ text: 'הבנתי', style: 'default' }]
        );
        return false;
      }
      
      if (!isInitialized) {
        console.log('⚠️ OneSignal: SDK not initialized yet, waiting...');
        Alert.alert(
          'אנא המתן',
          'מערכת ההתראות עדיין נטענת. אנא נסה שוב בעוד רגע.',
          [{ text: 'הבנתי', style: 'default' }]
        );
        return false;
      }
      
      console.log('🔔 OneSignal: Requesting permission from user...');
      const permission = await OneSignal.Notifications.requestPermission(true);
      console.log('🔔 OneSignal: Permission request result:', permission);
      
      if (permission) {
        console.log('✅ OneSignal: Permission granted! User will receive notifications');
        
        // Wait a moment for the subscription to register
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get the player ID after permission is granted
        const deviceState = await OneSignal.User.pushSubscription.getIdAsync();
        console.log('🔔 OneSignal: Device registered with Player ID:', deviceState);
        
        // Check if we're opted in
        const optedIn = await OneSignal.User.pushSubscription.getOptedInAsync();
        console.log('🔔 OneSignal: Opted in status:', optedIn);
        
        if (isMounted.current) {
          setHasPermission(permission);
          setPlayerId(deviceState);
        }
        
        console.log('🔔 OneSignal: ✅ Setup complete! You can now receive push notifications.');
        console.log('🔔 OneSignal: Your Player ID:', deviceState);
        console.log('🔔 OneSignal: Send a test notification from OneSignal dashboard to this Player ID');
      } else {
        console.log('❌ OneSignal: Permission denied by user');
        console.log('🔔 OneSignal: User needs to enable notifications in device settings');
      }
      
      return permission;
    } catch (error) {
      console.error('🔔 OneSignal: Permission request error:', error);
      console.error('🔔 OneSignal: Error details:', JSON.stringify(error, null, 2));
      Alert.alert(
        'שגיאה',
        'אירעה שגיאה בעת בקשת הרשאות התראות. אנא נסה שוב.',
        [{ text: 'הבנתי', style: 'default' }]
      );
      return false;
    }
  };

  return (
    <OneSignalContext.Provider
      value={{
        isInitialized,
        hasPermission,
        requestPermission,
        playerId,
      }}
    >
      {children}
    </OneSignalContext.Provider>
  );
}
