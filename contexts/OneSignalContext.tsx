
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
  runDiagnostics: () => Promise<void>;
}

const OneSignalContext = createContext<OneSignalContextType>({
  isInitialized: false,
  hasPermission: false,
  playerId: null,
  externalUserId: null,
  isSubscribed: false,
  requestPermission: async () => false,
  runDiagnostics: async () => {},
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
        // Step 1: Initialize OneSignal SDK (v5 API)
        console.log('🔔 OneSignal: Step 1/6 - Calling OneSignal.setAppId()');
        OneSignal.setAppId(oneSignalAppId);
        console.log('🔔 OneSignal: ✅ OneSignal.setAppId() called successfully');
        
        // Step 2: Enable verbose logging (v5 API)
        console.log('🔔 OneSignal: Step 2/6 - Setting log level to VERBOSE (6)');
        OneSignal.setLogLevel(6, 0);
        console.log('🔔 OneSignal: ✅ Verbose logging enabled');
        
        // Step 3: Wait for SDK to initialize
        console.log('🔔 OneSignal: Step 3/6 - Waiting 3 seconds for SDK to initialize...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log('🔔 OneSignal: ✅ Wait complete');
        
        // Step 4: Check permission status (v5 API)
        console.log('🔔 OneSignal: Step 4/6 - Checking notification permission status');
        const permission = OneSignal.Notifications.hasPermission();
        console.log('🔔 OneSignal: Permission status:', permission ? '✅ GRANTED' : '❌ NOT GRANTED');
        
        // Step 5: Get Player ID (Push Subscription ID) - v5 API
        console.log('🔔 OneSignal: Step 5/6 - Getting Player ID (Push Subscription ID)');
        const subscriptionId = OneSignal.User.pushSubscription.getPushSubscriptionId();
        console.log('🔔 OneSignal: Player ID:', subscriptionId || '⚠️ Not available yet (permission may be needed)');
        
        // Step 5.5: Get Push Token (FCM/APNS token) - v5 API
        console.log('🔔 OneSignal: Step 5.5/6 - Getting Push Token (FCM/APNS)');
        const pushToken = OneSignal.User.pushSubscription.getPushSubscriptionToken();
        console.log('🔔 OneSignal: Push Token:', pushToken ? `✅ ${pushToken.substring(0, 20)}...` : '❌ NOT AVAILABLE');
        
        if (!pushToken) {
          console.log('🔔 OneSignal: ⚠️⚠️⚠️ CRITICAL: NO PUSH TOKEN ⚠️⚠️⚠️');
          console.log('🔔 OneSignal: This means the device cannot receive push notifications');
          console.log('🔔 OneSignal: Possible causes:');
          console.log('🔔 OneSignal: 1. APK not built with OneSignal native modules');
          console.log('🔔 OneSignal: 2. Google Play Services not available (Android)');
          console.log('🔔 OneSignal: 3. APNS not configured (iOS)');
          console.log('🔔 OneSignal: 4. Network connectivity issues');
          console.log('🔔 OneSignal: 5. OneSignal servers unreachable');
        }
        
        // Step 6: Check subscription status (v5 API)
        console.log('🔔 OneSignal: Step 6/6 - Checking subscription status');
        const optedIn = OneSignal.User.pushSubscription.getOptedIn();
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
        
        // Set up event listeners (v5 API)
        console.log('🔔 OneSignal: Setting up event listeners...');
        
        // Permission change listener (v5 API)
        OneSignal.Notifications.addEventListener('permissionChange', (granted) => {
          console.log('🔔 OneSignal: ========================================');
          console.log('🔔 OneSignal: 📢 PERMISSION CHANGED EVENT');
          console.log('🔔 OneSignal: ========================================');
          console.log('🔔 OneSignal: Permission granted:', granted ? '✅ YES' : '❌ NO');
          
          if (isMounted.current) {
            setHasPermission(granted);
            
            // Get updated Player ID after permission change (v5 API)
            if (granted) {
              console.log('🔔 OneSignal: Permission granted! Getting Player ID...');
              const id = OneSignal.User.pushSubscription.getPushSubscriptionId();
              console.log('🔔 OneSignal: Updated Player ID:', id || '⚠️ Still not available');
              if (isMounted.current && id) {
                setPlayerId(id);
                console.log('🔔 OneSignal: ✅ Player ID updated successfully');
                console.log('🔔 OneSignal: 🎉 Device is now registered with OneSignal!');
                console.log('🔔 OneSignal: Check OneSignal dashboard - device should appear');
              }
            }
          }
          console.log('🔔 OneSignal: ========================================');
        });
        
        // Subscription change listener (CRITICAL for debugging) - v5 API
        OneSignal.User.pushSubscription.addEventListener('change', (state) => {
          console.log('🔔 OneSignal: ========================================');
          console.log('🔔 OneSignal: 📢 SUBSCRIPTION CHANGED EVENT');
          console.log('🔔 OneSignal: ========================================');
          console.log('🔔 OneSignal: Current state:', JSON.stringify(state.current, null, 2));
          console.log('🔔 OneSignal: Previous state:', JSON.stringify(state.previous, null, 2));
          
          const currentId = state.current?.id || OneSignal.User.pushSubscription.getPushSubscriptionId();
          const currentToken = state.current?.token || OneSignal.User.pushSubscription.getPushSubscriptionToken();
          const currentOptedIn = state.current?.optedIn !== undefined ? state.current.optedIn : OneSignal.User.pushSubscription.getOptedIn();
          
          if (currentId) {
            console.log('🔔 OneSignal: 🎉🎉🎉 PLAYER ID RECEIVED 🎉🎉🎉');
            console.log('🔔 OneSignal: Player ID:', currentId);
            console.log('🔔 OneSignal: Token:', currentToken ? '✅ Present' : '❌ Missing');
            console.log('🔔 OneSignal: Opted In:', currentOptedIn ? '✅ YES' : '❌ NO');
            
            if (isMounted.current) {
              setPlayerId(currentId);
              setIsSubscribed(currentOptedIn);
              console.log('🔔 OneSignal: ✅ State updated with Player ID');
              console.log('🔔 OneSignal: 🎉 Device should now appear in OneSignal dashboard!');
            }
          } else {
            console.log('🔔 OneSignal: ⚠️ No Player ID in subscription state');
          }
          console.log('🔔 OneSignal: ========================================');
        });
        
        // Notification click listener (v5 API)
        OneSignal.Notifications.addEventListener('click', (event) => {
          console.log('🔔 OneSignal: ========================================');
          console.log('🔔 OneSignal: 📢 NOTIFICATION CLICKED');
          console.log('🔔 OneSignal: ========================================');
          console.log('🔔 OneSignal: Click data:', JSON.stringify(event, null, 2));
          console.log('🔔 OneSignal: ========================================');
        });
        
        // Foreground notification listener (v5 API)
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
          
          // Display the notification (v5 API)
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
      
      // Get updated Player ID after login (v5 API)
      console.log('🔔 OneSignal: Getting Player ID after handshake...');
      const id = OneSignal.User.pushSubscription.getPushSubscriptionId();
      console.log('🔔 OneSignal: Player ID after handshake:', id || '⚠️ Not available yet');
      if (isMounted.current && id) {
        setPlayerId(id);
        console.log('🔔 OneSignal: ✅ Player ID updated in state');
      } else if (!id) {
        console.log('🔔 OneSignal: ⚠️ Player ID not available yet');
        console.log('🔔 OneSignal: This is normal if permission is not granted');
        console.log('🔔 OneSignal: Grant permission to complete registration');
      }
      
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

  const logFullDiagnostics = async () => {
    console.log('🔔 OneSignal: ========================================');
    console.log('🔔 OneSignal: 🔍 FULL DIAGNOSTIC REPORT');
    console.log('🔔 OneSignal: ========================================');
    
    try {
      // Platform info
      console.log('🔔 OneSignal: Platform:', Platform.OS);
      console.log('🔔 OneSignal: Is Physical Device:', Device.isDevice);
      console.log('🔔 OneSignal: Device Model:', Device.modelName);
      console.log('🔔 OneSignal: OS Version:', Device.osVersion);
      
      // SDK state
      console.log('🔔 OneSignal: SDK Initialized:', isInitialized ? '✅' : '❌');
      
      // Permission state (v5 API)
      const permission = OneSignal.Notifications.hasPermission();
      console.log('🔔 OneSignal: Permission Granted:', permission ? '✅' : '❌');
      
      // Subscription state (v5 API)
      const subscriptionId = OneSignal.User.pushSubscription.getPushSubscriptionId();
      console.log('🔔 OneSignal: Player ID:', subscriptionId || '❌ NOT AVAILABLE');
      
      const pushToken = OneSignal.User.pushSubscription.getPushSubscriptionToken();
      console.log('🔔 OneSignal: Push Token:', pushToken ? `✅ ${pushToken.substring(0, 30)}...` : '❌ NOT AVAILABLE');
      
      const optedIn = OneSignal.User.pushSubscription.getOptedIn();
      console.log('🔔 OneSignal: Opted In:', optedIn ? '✅' : '❌');
      
      // User state
      console.log('🔔 OneSignal: External User ID:', externalUserId || '❌ NOT SET');
      
      // Overall status
      if (subscriptionId && pushToken && permission && optedIn) {
        console.log('🔔 OneSignal: ========================================');
        console.log('🔔 OneSignal: ✅✅✅ ALL SYSTEMS OPERATIONAL ✅✅✅');
        console.log('🔔 OneSignal: Device is fully registered and can receive notifications');
        console.log('🔔 OneSignal: ========================================');
      } else {
        console.log('🔔 OneSignal: ========================================');
        console.log('🔔 OneSignal: ⚠️⚠️⚠️ ISSUES DETECTED ⚠️⚠️⚠️');
        if (!permission) console.log('🔔 OneSignal: - Permission not granted');
        if (!subscriptionId) console.log('🔔 OneSignal: - No Player ID (device not registered)');
        if (!pushToken) console.log('🔔 OneSignal: - No Push Token (FCM/APNS issue)');
        if (!optedIn) console.log('🔔 OneSignal: - Not opted in to notifications');
        if (!externalUserId) console.log('🔔 OneSignal: - No External User ID (handshake not complete)');
        console.log('🔔 OneSignal: ========================================');
      }
      
    } catch (error) {
      console.error('🔔 OneSignal: ❌ Diagnostic error:', error);
    }
    
    console.log('🔔 OneSignal: ========================================');
  };

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
        
        // CRITICAL: Force opt-in to push notifications (v5 API)
        console.log('🔔 OneSignal: 🔧 FORCING OPT-IN to push notifications...');
        try {
          OneSignal.User.pushSubscription.optIn();
          console.log('🔔 OneSignal: ✅ Opt-in successful');
        } catch (optInError) {
          console.error('🔔 OneSignal: ❌ Opt-in failed:', optInError);
        }
        
        // Wait a bit for OneSignal to register the device
        console.log('🔔 OneSignal: ⏳ Waiting 3 seconds for device registration...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Get Player ID (v5 API)
        const id = OneSignal.User.pushSubscription.getPushSubscriptionId();
        console.log('🔔 OneSignal: Player ID after permission:', id || '⚠️ Still not available');
        
        // Get Push Token (v5 API)
        const token = OneSignal.User.pushSubscription.getPushSubscriptionToken();
        console.log('🔔 OneSignal: Push Token after permission:', token ? `✅ ${token.substring(0, 20)}...` : '❌ NOT AVAILABLE');
        
        // Get Opted In status (v5 API)
        const optedIn = OneSignal.User.pushSubscription.getOptedIn();
        console.log('🔔 OneSignal: Opted In status:', optedIn ? '✅ YES' : '❌ NO');
        
        if (id && token) {
          console.log('🔔 OneSignal: 🎉🎉🎉 SUCCESS 🎉🎉🎉');
          console.log('🔔 OneSignal: Device is now registered with OneSignal!');
          console.log('🔔 OneSignal: Player ID:', id);
          console.log('🔔 OneSignal: Push Token:', token.substring(0, 30) + '...');
          console.log('🔔 OneSignal: Check OneSignal dashboard - device should appear');
          
          if (isMounted.current) {
            setPlayerId(id);
            setIsSubscribed(true);
          }
        } else if (id && !token) {
          console.log('🔔 OneSignal: ⚠️⚠️⚠️ PARTIAL SUCCESS ⚠️⚠️⚠️');
          console.log('🔔 OneSignal: Player ID exists but NO PUSH TOKEN');
          console.log('🔔 OneSignal: Device will appear in dashboard but CANNOT receive notifications');
          console.log('🔔 OneSignal: This indicates a problem with FCM/APNS configuration');
          
          if (isMounted.current) {
            setPlayerId(id);
          }
        } else {
          console.log('🔔 OneSignal: ❌❌❌ REGISTRATION FAILED ❌❌❌');
          console.log('🔔 OneSignal: No Player ID or Push Token after permission granted');
          console.log('🔔 OneSignal: ========================================');
          console.log('🔔 OneSignal: CRITICAL ISSUE DETECTED:');
          console.log('🔔 OneSignal: The OneSignal SDK is not properly integrated');
          console.log('🔔 OneSignal: ========================================');
          console.log('🔔 OneSignal: TROUBLESHOOTING:');
          console.log('🔔 OneSignal: 1. Was the APK built with EAS Build?');
          console.log('🔔 OneSignal: 2. Is onesignal-expo-plugin in app.json plugins?');
          console.log('🔔 OneSignal: 3. Is the OneSignal App ID correct?');
          console.log('🔔 OneSignal: 4. Is Google Play Services installed (Android)?');
          console.log('🔔 OneSignal: 5. Is the device connected to the internet?');
          console.log('🔔 OneSignal: 6. Check OneSignal dashboard for any errors');
          console.log('🔔 OneSignal: ========================================');
          console.log('🔔 OneSignal: NEXT STEPS:');
          console.log('🔔 OneSignal: 1. Rebuild the APK with: eas build -p android --profile preview');
          console.log('🔔 OneSignal: 2. Make sure app.json has onesignal-expo-plugin');
          console.log('🔔 OneSignal: 3. Verify OneSignal App ID in app.json extra.oneSignalAppId');
          console.log('🔔 OneSignal: 4. Check device has Google Play Services (Android)');
          console.log('🔔 OneSignal: ========================================');
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
        runDiagnostics: logFullDiagnostics,
      }}
    >
      {children}
    </OneSignalContext.Provider>
  );
}
