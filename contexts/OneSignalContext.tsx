
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import OneSignal from 'react-native-onesignal';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { useUser } from './UserContext';

interface OneSignalContextType {
  isInitialized: boolean;
  hasPermission: boolean;
  playerId: string | null;
  requestPermission: () => Promise<boolean>;
}

const OneSignalContext = createContext<OneSignalContextType>({
  isInitialized: false,
  hasPermission: false,
  playerId: null,
  requestPermission: async () => false,
});

export function useOneSignal() {
  return useContext(OneSignalContext);
}

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isUserLoading } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const isMounted = useRef(true);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Skip initialization on web or simulator
    if (Platform.OS === 'web' || !Device.isDevice) {
      console.log('🔔 OneSignal: Skipping initialization (web or simulator)');
      return;
    }
    
    // Prevent multiple initializations
    if (hasInitialized.current) {
      console.log('🔔 OneSignal: Already initialized, skipping...');
      return;
    }
    
    // Get OneSignal App ID from expo-constants
    const oneSignalAppId = Constants.expoConfig?.extra?.oneSignalAppId;
    
    if (!oneSignalAppId) {
      console.error('🔔 OneSignal: ❌ App ID not found in app.json extra.oneSignalAppId');
      console.error('🔔 OneSignal: Please add "oneSignalAppId" to app.json extra field');
      return;
    }
    
    hasInitialized.current = true;
    
    console.log('🔔 OneSignal: ========================================');
    console.log('🔔 OneSignal: STARTING INITIALIZATION');
    console.log('🔔 OneSignal: ========================================');
    console.log('🔔 OneSignal: Platform:', Platform.OS);
    console.log('🔔 OneSignal: Is Device:', Device.isDevice);
    console.log('🔔 OneSignal: App ID:', oneSignalAppId);
    
    const initializeOneSignal = async () => {
      try {
        // Initialize OneSignal SDK
        console.log('🔔 OneSignal: Step 1 - Calling OneSignal.initialize()');
        OneSignal.initialize(oneSignalAppId);
        
        // Enable verbose logging for debugging
        console.log('🔔 OneSignal: Step 2 - Setting log level to verbose');
        OneSignal.Debug.setLogLevel(6);
        
        // Wait for SDK to initialize
        console.log('🔔 OneSignal: Step 3 - Waiting for SDK to initialize...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check permission status
        console.log('🔔 OneSignal: Step 4 - Checking permission status');
        const permission = await OneSignal.Notifications.getPermissionAsync();
        console.log('🔔 OneSignal: Permission status:', permission);
        
        // Get Player ID (Push Subscription ID)
        console.log('🔔 OneSignal: Step 5 - Getting Player ID');
        const subscriptionId = await OneSignal.User.pushSubscription.getIdAsync();
        console.log('🔔 OneSignal: Player ID:', subscriptionId || 'Not available yet');
        
        // Update state
        if (isMounted.current) {
          const initialized = true; // SDK initialized successfully
          setIsInitialized(initialized);
          setHasPermission(permission);
          setPlayerId(subscriptionId);
          
          console.log('🔔 OneSignal: ========================================');
          console.log('🔔 OneSignal: INITIALIZATION COMPLETE');
          console.log('🔔 OneSignal: ========================================');
          console.log('🔔 OneSignal: Initialized:', initialized);
          console.log('🔔 OneSignal: Permission:', permission);
          console.log('🔔 OneSignal: Player ID:', subscriptionId || 'Not available');
          console.log('🔔 OneSignal: ========================================');
          
          if (!permission) {
            console.log('🔔 OneSignal: ⚠️ Permission not granted yet');
            console.log('🔔 OneSignal: User needs to grant notification permission');
          }
          
          if (!subscriptionId) {
            console.log('🔔 OneSignal: ⚠️ Player ID not available yet');
            console.log('🔔 OneSignal: This is normal - Player ID appears after permission is granted');
          }
        }
        
        // Set up event listeners
        console.log('🔔 OneSignal: Step 6 - Setting up event listeners');
        
        // Permission change listener
        OneSignal.Notifications.addEventListener('permissionChange', (granted) => {
          console.log('🔔 OneSignal: 📢 Permission changed:', granted);
          if (isMounted.current) {
            setHasPermission(granted);
            
            // Get updated Player ID after permission change
            if (granted) {
              OneSignal.User.pushSubscription.getIdAsync().then(id => {
                console.log('🔔 OneSignal: Updated Player ID after permission:', id);
                if (isMounted.current) {
                  setPlayerId(id);
                }
              });
            }
          }
        });
        
        // Notification click listener
        OneSignal.Notifications.addEventListener('click', (event) => {
          console.log('🔔 OneSignal: 📢 Notification clicked');
          console.log('🔔 OneSignal: Click data:', JSON.stringify(event, null, 2));
        });
        
        // Foreground notification listener
        OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
          console.log('🔔 OneSignal: 📢 Notification received in foreground');
          const notification = event.getNotification();
          console.log('🔔 OneSignal: Notification data:', JSON.stringify(notification, null, 2));
          
          // Show alert for foreground notifications
          Alert.alert(
            notification.title || 'התראה חדשה',
            notification.body || 'יש לך התראה חדשה',
            [{ text: 'אישור' }]
          );
          
          // Display the notification
          event.preventDefault();
          event.getNotification();
        });
        
        console.log('🔔 OneSignal: Event listeners configured successfully');
        
      } catch (error) {
        console.error('🔔 OneSignal: ❌❌❌ INITIALIZATION ERROR ❌❌❌');
        console.error('🔔 OneSignal: Error:', error);
        console.error('🔔 OneSignal: Error details:', JSON.stringify(error, null, 2));
        console.error('🔔 OneSignal: ========================================');
        console.error('🔔 OneSignal: TROUBLESHOOTING:');
        console.error('🔔 OneSignal: 1. Make sure app.json has oneSignalAppId in extra field');
        console.error('🔔 OneSignal: 2. Rebuild the APK/IPA after updating app.json');
        console.error('🔔 OneSignal: 3. Check that onesignal-expo-plugin is in plugins array');
        console.error('🔔 OneSignal: 4. Verify the App ID is correct in OneSignal dashboard');
        console.error('🔔 OneSignal: ========================================');
      }
    };

    initializeOneSignal();

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Set external user ID when user logs in
  useEffect(() => {
    if (!isInitialized || isUserLoading || !user?.authUserId) {
      return;
    }

    console.log('🔔 OneSignal: ========================================');
    console.log('🔔 OneSignal: SETTING EXTERNAL USER ID');
    console.log('🔔 OneSignal: ========================================');
    console.log('🔔 OneSignal: User ID:', user.authUserId);
    console.log('🔔 OneSignal: User Name:', user.fullName);
    
    try {
      // Login user with external ID
      OneSignal.login(user.authUserId);
      console.log('🔔 OneSignal: ✅ User logged in with external ID');
      
      // Set user tags for segmentation
      OneSignal.User.addTags({
        user_id: user.authUserId,
        full_name: user.fullName || '',
        city: user.city || '',
        has_contract: user.hasContract ? 'true' : 'false',
      });
      console.log('🔔 OneSignal: ✅ User tags set successfully');
      
      // Get updated Player ID
      OneSignal.User.pushSubscription.getIdAsync().then(id => {
        console.log('🔔 OneSignal: Player ID after login:', id);
        if (isMounted.current && id) {
          setPlayerId(id);
        }
      });
      
      console.log('🔔 OneSignal: ========================================');
      
    } catch (error) {
      console.error('🔔 OneSignal: ❌ Error setting user ID:', error);
    }
  }, [isInitialized, isUserLoading, user]);

  const requestPermission = async (): Promise<boolean> => {
    try {
      console.log('🔔 OneSignal: ========================================');
      console.log('🔔 OneSignal: REQUESTING NOTIFICATION PERMISSION');
      console.log('🔔 OneSignal: ========================================');
      
      if (Platform.OS === 'web') {
        console.log('🔔 OneSignal: ❌ Web platform - permission not supported');
        return false;
      }
      
      if (!Device.isDevice) {
        console.log('🔔 OneSignal: ❌ Simulator - permission not supported');
        return false;
      }
      
      if (!isInitialized) {
        console.log('🔔 OneSignal: ❌ SDK not initialized yet');
        return false;
      }
      
      console.log('🔔 OneSignal: Requesting permission...');
      const granted = await OneSignal.Notifications.requestPermission(true);
      console.log('🔔 OneSignal: Permission result:', granted);
      
      if (isMounted.current) {
        setHasPermission(granted);
      }
      
      // Get Player ID after permission granted
      if (granted) {
        const id = await OneSignal.User.pushSubscription.getIdAsync();
        console.log('🔔 OneSignal: Player ID after permission:', id);
        if (isMounted.current && id) {
          setPlayerId(id);
        }
      }
      
      console.log('🔔 OneSignal: ========================================');
      return granted;
      
    } catch (error) {
      console.error('🔔 OneSignal: ❌ Permission request error:', error);
      return false;
    }
  };

  return (
    <OneSignalContext.Provider
      value={{
        isInitialized,
        hasPermission,
        playerId,
        requestPermission,
      }}
    >
      {children}
    </OneSignalContext.Provider>
  );
}
