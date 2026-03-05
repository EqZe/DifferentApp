
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import OneSignal from 'react-native-onesignal';
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
  const isMounted = useRef(false);
  const isInitializing = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    
    // Skip initialization on web or simulator
    if (Platform.OS === 'web' || !Device.isDevice) {
      console.log('🔔 OneSignal: Skipping initialization (web or simulator)');
      return;
    }
    
    // Prevent multiple initializations
    if (isInitializing.current) {
      console.log('🔔 OneSignal: Already initializing, skipping...');
      return;
    }
    
    isInitializing.current = true;
    console.log('🔔 OneSignal: ========== STARTING INITIALIZATION ==========');
    console.log('🔔 OneSignal: Platform:', Platform.OS);
    console.log('🔔 OneSignal: Is Device:', Device.isDevice);
    
    // Initialize OneSignal with App ID
    const initializeOneSignal = async () => {
      try {
        const appId = 'b732b467-6886-4c7b-b3d9-5010de1199d6';
        console.log('🔔 OneSignal: Initializing with App ID:', appId);
        console.log('🔔 OneSignal: ⚠️ IMPORTANT: If initialized=false, you need to REBUILD the APK with the updated app.json');
        
        // Set the OneSignal App ID
        OneSignal.initialize(appId);
        
        // Set log level for debugging
        OneSignal.Debug.setLogLevel(6);
        
        console.log('🔔 OneSignal: SDK initialized successfully');
        
        // Wait a moment for SDK to fully initialize
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Check current permission status
        const permission = await OneSignal.Notifications.getPermissionAsync();
        console.log('🔔 OneSignal: Current permission status:', permission);
        
        // Get device state to retrieve Player ID
        const deviceState = await OneSignal.User.pushSubscription.getIdAsync();
        console.log('🔔 OneSignal: Player ID (Push Subscription ID):', deviceState);
        
        // Check if we actually initialized (if deviceState is null, initialization likely failed)
        const actuallyInitialized = deviceState !== null || permission !== false;
        console.log('🔔 OneSignal: Actually initialized?', actuallyInitialized);
        
        // Only update state if component is still mounted
        if (isMounted.current) {
          setIsInitialized(actuallyInitialized);
          setHasPermission(permission);
          setPlayerId(deviceState);
          console.log('🔔 OneSignal: State updated - initialized:', actuallyInitialized, 'permission:', permission, 'playerId:', deviceState);
          
          if (!actuallyInitialized) {
            console.error('🔔 OneSignal: ❌❌❌ INITIALIZATION FAILED ❌❌❌');
            console.error('🔔 OneSignal: This usually means the APK was built WITHOUT the appId in app.json');
            console.error('🔔 OneSignal: SOLUTION: Rebuild the APK after updating app.json with the appId property');
          }
        }
        
        // Listen for permission changes
        OneSignal.Notifications.addEventListener('permissionChange', (granted) => {
          console.log('🔔 OneSignal: Permission changed:', granted);
          if (isMounted.current) {
            setHasPermission(granted);
          }
        });
        
        // Listen for notification clicks
        OneSignal.Notifications.addEventListener('click', (event) => {
          console.log('🔔 OneSignal: Notification clicked:', JSON.stringify(event, null, 2));
          // Handle notification click navigation here if needed
        });
        
        // Listen for foreground notifications
        OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
          console.log('🔔 OneSignal: Notification received in foreground:', JSON.stringify(event.notification, null, 2));
          
          // Show alert when notification arrives in foreground
          const notification = event.getNotification();
          Alert.alert(
            notification.title || 'התראה חדשה',
            notification.body || 'יש לך התראה חדשה',
            [{ text: 'אישור' }]
          );
          
          // Display the notification
          event.preventDefault();
          event.getNotification();
        });
        
        console.log('🔔 OneSignal: ========== INITIALIZATION COMPLETE ==========');
        
      } catch (error) {
        console.error('🔔 OneSignal: ❌ Initialization error:', error);
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
    // Wait for both OneSignal and user to be ready
    if (!isInitialized || isUserLoading || !user?.authUserId) {
      console.log('🔔 OneSignal: Waiting for initialization or user data', {
        isInitialized,
        isUserLoading,
        hasUser: !!user?.authUserId
      });
      return;
    }

    console.log('🔔 OneSignal: ========== SETTING EXTERNAL USER ID ==========');
    console.log('🔔 OneSignal: User ID:', user.authUserId);
    console.log('🔔 OneSignal: User Name:', user.fullName);
    
    try {
      // Login user with external ID
      OneSignal.login(user.authUserId);
      console.log('🔔 OneSignal: ✅ External user ID set successfully');
      
      // Set user properties for segmentation
      OneSignal.User.addTags({
        user_id: user.authUserId,
        full_name: user.fullName || '',
        city: user.city || '',
        has_contract: user.hasContract ? 'true' : 'false',
      });
      console.log('🔔 OneSignal: ✅ User tags set successfully');
      
      // Log subscription status
      OneSignal.User.pushSubscription.getIdAsync().then(id => {
        console.log('🔔 OneSignal: Current Push Subscription ID after login:', id);
        if (isMounted.current) {
          setPlayerId(id);
        }
      });
      
    } catch (error) {
      console.error('🔔 OneSignal: ❌ Error setting user ID:', error);
      console.error('🔔 OneSignal: Error details:', JSON.stringify(error, null, 2));
    }
  }, [isInitialized, isUserLoading, user]);

  const requestPermission = async (): Promise<boolean> => {
    try {
      console.log('🔔 OneSignal: ========== REQUESTING PERMISSION ==========');
      
      if (Platform.OS === 'web') {
        console.log('🔔 OneSignal: Web platform - permission not supported');
        return false;
      }
      
      if (!Device.isDevice) {
        console.log('🔔 OneSignal: Simulator detected - permission not supported');
        return false;
      }
      
      console.log('🔔 OneSignal: Calling requestPermission...');
      const permission = await OneSignal.Notifications.requestPermission(true);
      console.log('🔔 OneSignal: Permission result:', permission);
      
      if (isMounted.current) {
        setHasPermission(permission);
      }
      
      // Get updated Player ID after permission granted
      if (permission) {
        const id = await OneSignal.User.pushSubscription.getIdAsync();
        console.log('🔔 OneSignal: Player ID after permission granted:', id);
        if (isMounted.current) {
          setPlayerId(id);
        }
      }
      
      console.log('🔔 OneSignal: ========== PERMISSION REQUEST COMPLETE ==========');
      return permission;
    } catch (error) {
      console.error('🔔 OneSignal: ❌ Permission request error:', error);
      console.error('🔔 OneSignal: Error details:', JSON.stringify(error, null, 2));
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
