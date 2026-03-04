
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import OneSignal from 'react-native-onesignal';
import { useUser } from './UserContext';

interface OneSignalContextType {
  isInitialized: boolean;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

const OneSignalContext = createContext<OneSignalContextType>({
  isInitialized: false,
  hasPermission: false,
  requestPermission: async () => false,
});

export function useOneSignal() {
  return useContext(OneSignalContext);
}

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isUserLoading } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const isMounted = useRef(false);
  const isInitializing = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    
    // Prevent multiple initializations
    if (isInitializing.current) {
      return;
    }
    
    isInitializing.current = true;
    console.log('🔔 OneSignal: Initializing OneSignal SDK');
    
    // Initialize OneSignal with App ID
    const initializeOneSignal = async () => {
      try {
        // Set the OneSignal App ID
        OneSignal.initialize('b732b467-6886-4c7b-b3d9-5010de1199d6');
        
        // Set log level for debugging
        OneSignal.Debug.setLogLevel(6);
        
        console.log('🔔 OneSignal: SDK initialized with App ID: b732b467-6886-4c7b-b3d9-5010de1199d6');
        
        // Check current permission status
        const permission = await OneSignal.Notifications.getPermissionAsync();
        console.log('🔔 OneSignal: Current permission status:', permission);
        
        // Only update state if component is still mounted
        if (isMounted.current) {
          setIsInitialized(true);
          setHasPermission(permission);
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
          console.log('🔔 OneSignal: Notification clicked:', event);
          // Handle notification click navigation here if needed
        });
        
      } catch (error) {
        console.error('🔔 OneSignal: Initialization error:', error);
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
    if (!isInitialized || isUserLoading || !user?.id) {
      console.log('🔔 OneSignal: Waiting for initialization or user data', {
        isInitialized,
        isUserLoading,
        hasUser: !!user?.id
      });
      return;
    }

    console.log('🔔 OneSignal: Setting external user ID:', user.id);
    
    try {
      OneSignal.login(user.id);
      
      // Set user properties for segmentation
      OneSignal.User.addTags({
        user_id: user.id,
        full_name: user.fullName || '',
        city: user.city || '',
        has_contract: user.hasContract ? 'true' : 'false',
      });
    } catch (error) {
      console.error('🔔 OneSignal: Error setting user ID:', error);
    }
  }, [isInitialized, isUserLoading, user]);

  const requestPermission = async (): Promise<boolean> => {
    try {
      console.log('🔔 OneSignal: Requesting notification permission');
      
      if (Platform.OS === 'web') {
        console.log('🔔 OneSignal: Web platform - permission not supported');
        return false;
      }
      
      const permission = await OneSignal.Notifications.requestPermission(true);
      console.log('🔔 OneSignal: Permission result:', permission);
      
      if (isMounted.current) {
        setHasPermission(permission);
      }
      
      return permission;
    } catch (error) {
      console.error('🔔 OneSignal: Permission request error:', error);
      return false;
    }
  };

  return (
    <OneSignalContext.Provider
      value={{
        isInitialized,
        hasPermission,
        requestPermission,
      }}
    >
      {children}
    </OneSignalContext.Provider>
  );
}
