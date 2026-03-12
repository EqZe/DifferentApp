
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
  externalUserId: string | null;
  isSubscribed: boolean;
  requestPermission: () => Promise<boolean>;
}

const OneSignalContext = createContext<OneSignalContextType>({
  isInitialized: false,
  hasPermission: false,
  playerId: null,
  externalUserId: null,
  isSubscribed: false,
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
  const [externalUserId, setExternalUserId] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const isMounted = useRef(true);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Skip initialization on web or simulator
    if (Platform.OS === 'web' || !Device.isDevice) {
      console.log('🔔 OneSignal: ⚠️ SKIPPING - Running on web or simulator');
      console.log('🔔 OneSignal: Platform:', Platform.OS);
      console.log('🔔 OneSignal: Is Device:', Device.isDevice);
      console.log('🔔 OneSignal: ⚠️ OneSignal ONLY works on physical iOS/Android devices');
      return;
    }
    
    // Prevent multiple initializations
    if (hasInitialized.current) {
      console.log('🔔 OneSignal: Already initialized, skipping...');
      return;
    }
    
    // Get App ID from app.json
    const oneSignalAppId = Constants.expoConfig?.extra?.oneSignalAppId || 'b732b467-6886-4c7b-b3d9-5010de1199d6';
    
    if (!oneSignalAppId) {
      console.error('🔔 OneSignal: ❌ App ID not configured');
      return;
    }
    
    hasInitialized.current = true;
    
    console.log('🔔 OneSignal: ========================================');
    console.log('🔔 OneSignal: 🚀 STARTING INITIALIZATION');
    console.log('🔔 OneSignal: ========================================');
    console.log('🔔 OneSignal: Platform:', Platform.OS);
    console.log('🔔 OneSignal: Is Physical Device:', Device.isDevice);
    console.log('🔔 OneSignal: Device Model:', Device.modelName);
    console.log('🔔 OneSignal: OS Version:', Device.osVersion);
    console.log('🔔 OneSignal: App ID:', oneSignalAppId);
    console.log('🔔 OneSignal: ========================================');
    
    const initializeOneSignal = async () => {
      try {
        // Step 1: Initialize OneSignal SDK
        console.log('🔔 OneSignal: Step 1/6 - Calling OneSignal.initialize()');
        OneSignal.initialize(oneSignalAppId);
        console.log('🔔 OneSignal: ✅ OneSignal.initialize() called successfully');
        
        // Step 2: Enable verbose logging
        console.log('🔔 OneSignal: Step 2/6 - Setting log level to VERBOSE (6)');
        OneSignal.Debug.setLogLevel(6);
        console.log('🔔 OneSignal: ✅ Verbose logging enabled');
        
        // Step 3: Wait for SDK to initialize
        console.log('🔔 OneSignal: Step 3/6 - Waiting 3 seconds for SDK to initialize...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('🔔 OneSignal: ✅ Wait complete');
        
        // Step 4: Check permission status
        console.log('🔔 OneSignal: Step 4/6 - Checking notification permission status');
        const permission = await OneSignal.Notifications.getPermissionAsync();
        console.log('🔔 OneSignal: Permission status:', permission ? '✅ GRANTED' : '❌ NOT GRANTED');
        
        // Step 5: Get Player ID (Push Subscription ID)
        console.log('🔔 OneSignal: Step 5/6 - Getting Player ID (Push Subscription ID)');
        const subscriptionId = await OneSignal.User.pushSubscription.getIdAsync();
        console.log('🔔 OneSignal: Player ID:', subscriptionId || '⚠️ Not available yet (permission may be needed)');
        
        // Step 6: Check subscription status
        console.log('🔔 OneSignal: Step 6/6 - Checking subscription status');
        const optedIn = await OneSignal.User.pushSubscription.getOptedInAsync();
        console.log('🔔 OneSignal: Opted In:', optedIn ? '✅ YES' : '❌ NO');
        
        // Update state
        if (isMounted.current) {
          setIsInitialized(true);
          setHasPermission(permission);
          setPlayerId(subscriptionId);
          setIsSubscribed(optedIn);
          
          console.log('🔔 OneSignal: ========================================');
          console.log('🔔 OneSignal: ✅✅✅ INITIALIZATION COMPLETE ✅✅✅');
          console.log('🔔 OneSignal: ========================================');
          console.log('🔔 OneSignal: SDK Initialized:', '✅ YES');
          console.log('🔔 OneSignal: Permission Granted:', permission ? '✅ YES' : '❌ NO');
          console.log('🔔 OneSignal: Player ID:', subscriptionId || '⚠️ Not available');
          console.log('🔔 OneSignal: Subscribed:', optedIn ? '✅ YES' : '❌ NO');
          console.log('🔔 OneSignal: ========================================');
          
          if (!permission) {
            console.log('🔔 OneSignal: ⚠️⚠️⚠️ ACTION REQUIRED ⚠️⚠️⚠️');
            console.log('🔔 OneSignal: User needs to grant notification permission');
            console.log('🔔 OneSignal: Go to Profile screen and tap "בקש הרשאות התראות"');
            console.log('🔔 OneSignal: ========================================');
          }
          
          if (!subscriptionId) {
            console.log('🔔 OneSignal: ⚠️⚠️⚠️ PLAYER ID MISSING ⚠️⚠️⚠️');
            console.log('🔔 OneSignal: This is normal if permission is not granted yet');
            console.log('🔔 OneSignal: Player ID will appear after permission is granted');
            console.log('🔔 OneSignal: ========================================');
          }
        }
        
        // Set up event listeners
        console.log('🔔 OneSignal: Setting up event listeners...');
        
        // Permission change listener
        OneSignal.Notifications.addEventListener('permissionChange', (granted) => {
          console.log('🔔 OneSignal: ========================================');
          console.log('🔔 OneSignal: 📢 PERMISSION CHANGED EVENT');
          console.log('🔔 OneSignal: ========================================');
          console.log('🔔 OneSignal: Permission granted:', granted ? '✅ YES' : '❌ NO');
          
          if (isMounted.current) {
            setHasPermission(granted);
            
            // Get updated Player ID after permission change
            if (granted) {
              console.log('🔔 OneSignal: Permission granted! Getting Player ID...');
              OneSignal.User.pushSubscription.getIdAsync().then(id => {
                console.log('🔔 OneSignal: Updated Player ID:', id || '⚠️ Still not available');
                if (isMounted.current && id) {
                  setPlayerId(id);
                  console.log('🔔 OneSignal: ✅ Player ID updated successfully');
                  console.log('🔔 OneSignal: 🎉 Device is now registered with OneSignal!');
                  console.log('🔔 OneSignal: Check OneSignal dashboard - device should appear');
                }
              });
            }
          }
          console.log('🔔 OneSignal: ========================================');
        });
        
        // Subscription change listener (CRITICAL for debugging)
        OneSignal.User.pushSubscription.addEventListener('change', (state) => {
          console.log('🔔 OneSignal: ========================================');
          console.log('🔔 OneSignal: 📢 SUBSCRIPTION CHANGED EVENT');
          console.log('🔔 OneSignal: ========================================');
          console.log('🔔 OneSignal: Current state:', JSON.stringify(state.current, null, 2));
          console.log('🔔 OneSignal: Previous state:', JSON.stringify(state.previous, null, 2));
          
          if (state.current.id) {
            console.log('🔔 OneSignal: 🎉🎉🎉 PLAYER ID RECEIVED 🎉🎉🎉');
            console.log('🔔 OneSignal: Player ID:', state.current.id);
            console.log('🔔 OneSignal: Token:', state.current.token ? '✅ Present' : '❌ Missing');
            console.log('🔔 OneSignal: Opted In:', state.current.optedIn ? '✅ YES' : '❌ NO');
            
            if (isMounted.current) {
              setPlayerId(state.current.id);
              setIsSubscribed(state.current.optedIn);
              console.log('🔔 OneSignal: ✅ State updated with Player ID');
              console.log('🔔 OneSignal: 🎉 Device should now appear in OneSignal dashboard!');
            }
          } else {
            console.log('🔔 OneSignal: ⚠️ No Player ID in subscription state');
          }
          console.log('🔔 OneSignal: ========================================');
        });
        
        // Notification click listener
        OneSignal.Notifications.addEventListener('click', (event) => {
          console.log('🔔 OneSignal: ========================================');
          console.log('🔔 OneSignal: 📢 NOTIFICATION CLICKED');
          console.log('🔔 OneSignal: ========================================');
          console.log('🔔 OneSignal: Click data:', JSON.stringify(event, null, 2));
          console.log('🔔 OneSignal: ========================================');
        });
        
        // Foreground notification listener
        OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
          console.log('🔔 OneSignal: ========================================');
          console.log('🔔 OneSignal: 📢 NOTIFICATION RECEIVED (FOREGROUND)');
          console.log('🔔 OneSignal: ========================================');
          const notification = event.getNotification();
          console.log('🔔 OneSignal: Title:', notification.title);
          console.log('🔔 OneSignal: Body:', notification.body);
          console.log('🔔 OneSignal: Data:', JSON.stringify(notification.additionalData, null, 2));
          console.log('🔔 OneSignal: ========================================');
          
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
        
        console.log('🔔 OneSignal: ✅ Event listeners configured successfully');
        console.log('🔔 OneSignal: ========================================');
        
      } catch (error) {
        console.error('🔔 OneSignal: ========================================');
        console.error('🔔 OneSignal: ❌❌❌ INITIALIZATION ERROR ❌❌❌');
        console.error('🔔 OneSignal: ========================================');
        console.error('🔔 OneSignal: Error:', error);
        console.error('🔔 OneSignal: Error type:', typeof error);
        console.error('🔔 OneSignal: Error details:', JSON.stringify(error, null, 2));
        console.error('🔔 OneSignal: ========================================');
        console.error('🔔 OneSignal: TROUBLESHOOTING STEPS:');
        console.error('🔔 OneSignal: 1. Check internet connection');
        console.error('🔔 OneSignal: 2. Verify App ID in OneSignal dashboard');
        console.error('🔔 OneSignal: 3. Make sure react-native-onesignal is installed');
        console.error('🔔 OneSignal: 4. Try restarting the app');
        console.error('🔔 OneSignal: 5. Check if APK was built with OneSignal plugin');
        console.error('🔔 OneSignal: ========================================');
      }
    };

    initializeOneSignal();

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Set external user ID when user logs in (THE HANDSHAKE)
  useEffect(() => {
    // Skip on web or simulator
    if (Platform.OS === 'web' || !Device.isDevice) {
      return;
    }

    if (!isInitialized || isUserLoading || !user?.authUserId) {
      console.log('🔔 OneSignal: ⏳ Waiting for handshake prerequisites...');
      console.log('🔔 OneSignal: - SDK Initialized:', isInitialized ? '✅' : '❌');
      console.log('🔔 OneSignal: - User Loading:', isUserLoading ? '⏳' : '✅');
      console.log('🔔 OneSignal: - User Auth ID:', user?.authUserId ? '✅' : '❌');
      return;
    }

    console.log('🔔 OneSignal: ========================================');
    console.log('🔔 OneSignal: 🤝 STARTING USER HANDSHAKE');
    console.log('🔔 OneSignal: ========================================');
    console.log('🔔 OneSignal: User Auth ID:', user.authUserId);
    console.log('🔔 OneSignal: User Name:', user.fullName);
    console.log('🔔 OneSignal: User Email:', user.email);
    console.log('🔔 OneSignal: User City:', user.city);
    console.log('🔔 OneSignal: Has Contract:', user.hasContract);
    
    try {
      // CRITICAL: Login user with external ID
      // This is the "handshake" that links the device to the user in OneSignal
      console.log('🔔 OneSignal: Step 1/3 - Calling OneSignal.login()');
      console.log('🔔 OneSignal: External User ID:', user.authUserId);
      OneSignal.login(user.authUserId);
      console.log('🔔 OneSignal: ✅ OneSignal.login() called successfully');
      
      if (isMounted.current) {
        setExternalUserId(user.authUserId);
      }
      
      // Set user tags for segmentation
      console.log('🔔 OneSignal: Step 2/3 - Setting user tags');
      const tags = {
        user_id: user.authUserId,
        full_name: user.fullName || '',
        email: user.email || '',
        city: user.city || '',
        has_contract: user.hasContract ? 'true' : 'false',
      };
      console.log('🔔 OneSignal: Tags:', JSON.stringify(tags, null, 2));
      OneSignal.User.addTags(tags);
      console.log('🔔 OneSignal: ✅ User tags set successfully');
      
      // Set email for better user identification
      if (user.email) {
        console.log('🔔 OneSignal: Step 3/3 - Setting user email');
        console.log('🔔 OneSignal: Email:', user.email);
        OneSignal.User.addEmail(user.email);
        console.log('🔔 OneSignal: ✅ User email set successfully');
      } else {
        console.log('🔔 OneSignal: Step 3/3 - Skipping email (not available)');
      }
      
      // Get updated Player ID after login
      console.log('🔔 OneSignal: Getting Player ID after handshake...');
      OneSignal.User.pushSubscription.getIdAsync().then(id => {
        console.log('🔔 OneSignal: Player ID after handshake:', id || '⚠️ Not available yet');
        if (isMounted.current && id) {
          setPlayerId(id);
          console.log('🔔 OneSignal: ✅ Player ID updated in state');
        } else if (!id) {
          console.log('🔔 OneSignal: ⚠️ Player ID not available yet');
          console.log('🔔 OneSignal: This is normal if permission is not granted');
          console.log('🔔 OneSignal: Grant permission to complete registration');
        }
      });
      
      console.log('🔔 OneSignal: ========================================');
      console.log('🔔 OneSignal: ✅✅✅ HANDSHAKE COMPLETE ✅✅✅');
      console.log('🔔 OneSignal: ========================================');
      console.log('🔔 OneSignal: External User ID:', user.authUserId);
      console.log('🔔 OneSignal: User should now be linked in OneSignal dashboard');
      console.log('🔔 OneSignal: If permission is granted, device will appear in dashboard');
      console.log('🔔 OneSignal: ========================================');
      
    } catch (error) {
      console.error('🔔 OneSignal: ========================================');
      console.error('🔔 OneSignal: ❌❌❌ HANDSHAKE ERROR ❌❌❌');
      console.error('🔔 OneSignal: ========================================');
      console.error('🔔 OneSignal: Error:', error);
      console.error('🔔 OneSignal: Error details:', JSON.stringify(error, null, 2));
      console.error('🔔 OneSignal: ⚠️ User will NOT appear in OneSignal dashboard');
      console.error('🔔 OneSignal: ========================================');
    }
  }, [isInitialized, isUserLoading, user]);

  const requestPermission = async (): Promise<boolean> => {
    try {
      console.log('🔔 OneSignal: ========================================');
      console.log('🔔 OneSignal: 🔔 REQUESTING NOTIFICATION PERMISSION');
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
      
      console.log('🔔 OneSignal: Requesting permission from user...');
      console.log('🔔 OneSignal: A system dialog should appear now');
      const granted = await OneSignal.Notifications.requestPermission(true);
      console.log('🔔 OneSignal: Permission result:', granted ? '✅ GRANTED' : '❌ DENIED');
      
      if (isMounted.current) {
        setHasPermission(granted);
      }
      
      if (granted) {
        console.log('🔔 OneSignal: ✅ Permission granted! Waiting for Player ID...');
        // Wait a bit for OneSignal to register the device
        await new Promise(resolve => setTimeout(resolve, 2000));
        const id = await OneSignal.User.pushSubscription.getIdAsync();
        console.log('🔔 OneSignal: Player ID after permission:', id || '⚠️ Still not available');
        
        if (id) {
          console.log('🔔 OneSignal: 🎉🎉🎉 SUCCESS 🎉🎉🎉');
          console.log('🔔 OneSignal: Device is now registered with OneSignal!');
          console.log('🔔 OneSignal: Player ID:', id);
          console.log('🔔 OneSignal: Check OneSignal dashboard - device should appear');
          
          if (isMounted.current) {
            setPlayerId(id);
          }
        } else {
          console.log('🔔 OneSignal: ⚠️ Player ID not available yet');
          console.log('🔔 OneSignal: This may take a few seconds');
          console.log('🔔 OneSignal: Check the subscription change event listener');
        }
      } else {
        console.log('🔔 OneSignal: ❌ Permission denied by user');
        console.log('🔔 OneSignal: User must grant permission in device settings');
      }
      
      console.log('🔔 OneSignal: ========================================');
      return granted;
      
    } catch (error) {
      console.error('🔔 OneSignal: ========================================');
      console.error('🔔 OneSignal: ❌ PERMISSION REQUEST ERROR');
      console.error('🔔 OneSignal: ========================================');
      console.error('🔔 OneSignal: Error:', error);
      console.error('🔔 OneSignal: ========================================');
      return false;
    }
  };

  return (
    <OneSignalContext.Provider
      value={{
        isInitialized,
        hasPermission,
        playerId,
        externalUserId,
        isSubscribed,
        requestPermission,
      }}
    >
      {children}
    </OneSignalContext.Provider>
  );
}
