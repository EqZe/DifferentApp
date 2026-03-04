
import React, { createContext, useContext, useEffect, useState } from 'react';
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
  const userContext = useUser();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    console.log('🔔 OneSignal: Initializing OneSignal SDK');
    
    // Initialize OneSignal with App ID
    try {
      // Set the OneSignal App ID
      OneSignal.initialize('b732b467-6886-4c7b-b3d9-5010de1199d6');
      
      // Set log level for debugging
      OneSignal.Debug.setLogLevel(6);
      
      console.log('🔔 OneSignal: SDK initialized with App ID: b732b467-6886-4c7b-b3d9-5010de1199d6');
      setIsInitialized(true);
      
      // Check current permission status
      OneSignal.Notifications.getPermissionAsync().then((permission) => {
        console.log('🔔 OneSignal: Current permission status:', permission);
        setHasPermission(permission);
      });
      
      // Listen for permission changes
      OneSignal.Notifications.addEventListener('permissionChange', (granted) => {
        console.log('🔔 OneSignal: Permission changed:', granted);
        setHasPermission(granted);
      });
      
      // Listen for notification clicks
      OneSignal.Notifications.addEventListener('click', (event) => {
        console.log('🔔 OneSignal: Notification clicked:', event);
        // Handle notification click navigation here if needed
      });
      
    } catch (error) {
      console.error('🔔 OneSignal: Initialization error:', error);
    }
  }, []);

  // Set external user ID when user logs in
  useEffect(() => {
    // Safety check: only proceed if userContext and user are available
    if (!userContext || !userContext.user) {
      console.log('🔔 OneSignal: User context not ready yet, skipping user ID setup');
      return;
    }

    const user = userContext.user;

    if (isInitialized && user?.id) {
      console.log('🔔 OneSignal: Setting external user ID:', user.id);
      OneSignal.login(user.id);
      
      // Set user properties for segmentation
      OneSignal.User.addTags({
        user_id: user.id,
        full_name: user.fullName || '',
        city: user.city || '',
        has_contract: user.hasContract ? 'true' : 'false',
      });
    }
  }, [isInitialized, userContext?.user]);

  const requestPermission = async (): Promise<boolean> => {
    try {
      console.log('🔔 OneSignal: Requesting notification permission');
      
      if (Platform.OS === 'web') {
        console.log('🔔 OneSignal: Web platform - permission not supported');
        return false;
      }
      
      const permission = await OneSignal.Notifications.requestPermission(true);
      console.log('🔔 OneSignal: Permission result:', permission);
      setHasPermission(permission);
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
