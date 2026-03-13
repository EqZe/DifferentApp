
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { useUser } from './UserContext';

// ─── Availability check ───────────────────────────────────────────────────────
// react-native-onesignal requires native modules that are absent in Expo Go.
// We probe for the module at startup so every call below can be safely guarded.
let isOneSignalAvailable = false;
try {
  require('react-native-onesignal');
  isOneSignalAvailable = true;
} catch (e) {
  console.warn('🔔 OneSignal: Native module not available (Expo Go). Push notifications disabled.');
}

// Lazy import — only resolved when the native module is confirmed present.
// Using `any` here intentionally to avoid a top-level import that would throw
// at module-evaluation time in Expo Go.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let OneSignal: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let LogLevel: any = null;
if (isOneSignalAvailable) {
  try {
    const mod = require('react-native-onesignal');
    OneSignal = mod.default ?? mod.OneSignal ?? mod;
    LogLevel = mod.LogLevel;
  } catch (e) {
    console.warn('🔔 OneSignal: Failed to load module after availability check:', e);
    isOneSignalAvailable = false;
  }
}

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

// Helper to safely read push subscription properties (v5 uses getters, not methods)
function getPushSubscriptionId(): string | null {
  if (!isOneSignalAvailable || !OneSignal) return null;
  try {
    const id = OneSignal.User.pushSubscription.id;
    return id || null;
  } catch {
    return null;
  }
}

function getPushSubscriptionToken(): string | null {
  if (!isOneSignalAvailable || !OneSignal) return null;
  try {
    const token = OneSignal.User.pushSubscription.token;
    return token || null;
  } catch {
    return null;
  }
}

function getPushSubscriptionOptedIn(): boolean {
  if (!isOneSignalAvailable || !OneSignal) return false;
  try {
    return OneSignal.User.pushSubscription.optedIn ?? false;
  } catch {
    return false;
  }
}

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  // user.id is the auth_user_id (see UserFrontend mapping in api.ts)
  const { user, isLoading: isUserLoading } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [externalUserId, setExternalUserId] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const isMounted = useRef(true);
  const hasInitialized = useRef(false);

  // ─── Step 1: Initialize OneSignal SDK on mount ───────────────────────────
  useEffect(() => {
    if (Platform.OS === 'web' || !Device.isDevice) {
      console.log('🔔 OneSignal: Skipping — web or simulator (Platform:', Platform.OS, ', isDevice:', Device.isDevice, ')');
      return;
    }

    if (!isOneSignalAvailable) {
      console.warn('🔔 OneSignal: Skipping initialization — native module unavailable (Expo Go).');
      return;
    }

    if (hasInitialized.current) {
      console.log('🔔 OneSignal: Already initialized, skipping duplicate init');
      return;
    }

    const oneSignalAppId: string =
      Constants.expoConfig?.extra?.oneSignalAppId || 'b732b467-6886-4c7b-b3d9-5010de1199d6';

    if (!oneSignalAppId) {
      console.error('🔔 OneSignal: ❌ App ID not configured — cannot initialize');
      return;
    }

    hasInitialized.current = true;

    console.log('🔔 OneSignal: ========================================');
    console.log('🔔 OneSignal: 🚀 INITIALIZING (v5 API)');
    console.log('🔔 OneSignal: App ID:', oneSignalAppId);
    console.log('🔔 OneSignal: Platform:', Platform.OS);
    console.log('🔔 OneSignal: Device:', Device.modelName, 'OS', Device.osVersion);
    console.log('🔔 OneSignal: ========================================');

    const initializeOneSignal = async () => {
      try {
        // v5 API: Debug.setLogLevel must come BEFORE initialize
        OneSignal.Debug.setLogLevel(LogLevel.Verbose);
        console.log('🔔 OneSignal: ✅ Debug log level set to VERBOSE');

        // v5 API: initialize() replaces setAppId()
        OneSignal.initialize(oneSignalAppId);
        console.log('🔔 OneSignal: ✅ OneSignal.initialize() called with App ID:', oneSignalAppId);

        // Give the SDK a moment to register with OneSignal servers
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Read permission & subscription state using v5 property accessors
        const permission = OneSignal.Notifications.hasPermission();
        const subId = getPushSubscriptionId();
        const optedIn = getPushSubscriptionOptedIn();

        console.log('🔔 OneSignal: Permission:', permission ? '✅ GRANTED' : '❌ NOT GRANTED');
        console.log('🔔 OneSignal: Subscription ID:', subId || '⚠️ not available yet');
        console.log('🔔 OneSignal: Opted In:', optedIn ? '✅ YES' : '❌ NO');

        if (isMounted.current) {
          setIsInitialized(true);
          setHasPermission(permission);
          setPlayerId(subId);
          setIsSubscribed(optedIn);
        }

        // ── Auto-request permission on first launch ───────────────────────
        // Always call requestPermission after init. On iOS this shows the OS
        // dialog the first time; on subsequent launches it resolves immediately
        // if already granted. optIn() is called inside requestPermission when
        // permission is granted.
        console.log('🔔 OneSignal: 🔔 Auto-requesting notification permission...');
        try {
          const granted = await OneSignal.Notifications.requestPermission(true);
          console.log('🔔 OneSignal: Auto-permission result:', granted ? '✅ GRANTED' : '❌ DENIED/ALREADY SET');
          if (isMounted.current) setHasPermission(granted);

          if (granted) {
            console.log('🔔 OneSignal: ✅ Calling optIn() after auto-permission grant');
            OneSignal.User.pushSubscription.optIn();

            // Wait for device registration to complete
            await new Promise(resolve => setTimeout(resolve, 2000));

            const registeredId = getPushSubscriptionId();
            const registeredOptedIn = getPushSubscriptionOptedIn();
            console.log('🔔 OneSignal: Subscription ID after auto-optIn:', registeredId || '⚠️ not yet available');
            console.log('🔔 OneSignal: Opted In after auto-optIn:', registeredOptedIn ? '✅' : '❌');
            if (isMounted.current) {
              if (registeredId) setPlayerId(registeredId);
              setIsSubscribed(registeredOptedIn);
            }
          }
        } catch (permErr) {
          console.warn('🔔 OneSignal: ❌ Auto-permission request error:', permErr);
        }

        // ── Event listeners (v5 API) ──────────────────────────────────────

        // Permission change
        OneSignal.Notifications.addEventListener('permissionChange', (granted: boolean) => {
          console.log('🔔 OneSignal: 📢 permissionChange ->', granted ? '✅ GRANTED' : '❌ DENIED');
          if (isMounted.current) {
            setHasPermission(granted);
            if (granted) {
              const id = getPushSubscriptionId();
              if (id && isMounted.current) {
                setPlayerId(id);
                console.log('🔔 OneSignal: Player ID after permission grant:', id);
              }
            }
          }
        });

        // Subscription change — fires when device registers / token changes
        OneSignal.User.pushSubscription.addEventListener('change', (state: any) => {
          console.log('🔔 OneSignal: 📢 pushSubscription change event');
          const currentId: string | null = state?.current?.id || getPushSubscriptionId();
          const currentOptedIn: boolean = state?.current?.optedIn ?? getPushSubscriptionOptedIn();
          console.log('🔔 OneSignal: Subscription ID:', currentId || '⚠️ none');
          console.log('🔔 OneSignal: Opted In:', currentOptedIn ? '✅' : '❌');
          if (isMounted.current) {
            if (currentId) setPlayerId(currentId);
            setIsSubscribed(currentOptedIn);
          }
        });

        // Notification click
        OneSignal.Notifications.addEventListener('click', (event: any) => {
          console.log('🔔 OneSignal: 📢 Notification clicked:', JSON.stringify(event?.notification?.title));
        });

        // Foreground notification
        OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event: any) => {
          const notification = event.getNotification();
          console.log('🔔 OneSignal: 📢 Foreground notification:', notification?.title);
          event.getNotification().display();
        });

        console.log('🔔 OneSignal: ✅ Event listeners registered');
        console.log('🔔 OneSignal: ========================================');
        console.log('🔔 OneSignal: ✅ INITIALIZATION COMPLETE');
        console.log('🔔 OneSignal: ========================================');

      } catch (error) {
        console.warn('🔔 OneSignal: ❌ Initialization error:', error);
        // Reset so a retry is possible
        hasInitialized.current = false;
      }
    };

    initializeOneSignal();

    return () => {
      isMounted.current = false;
    };
  }, []);

  // ─── Step 2: Login user with external ID once SDK is ready ───────────────
  // IMPORTANT: user.id === auth_user_id (see UserFrontend mapping in api.ts)
  useEffect(() => {
    if (Platform.OS === 'web' || !Device.isDevice) return;
    if (!isOneSignalAvailable) return;

    const userId = user?.id; // user.id is the Supabase auth_user_id

    if (!isInitialized) {
      console.log('🔔 OneSignal: ⏳ Waiting for SDK initialization before login...');
      return;
    }

    if (isUserLoading) {
      console.log('🔔 OneSignal: ⏳ Waiting for user to finish loading...');
      return;
    }

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      if (externalUserId) {
        // User logged out — call logout
        console.log('🔔 OneSignal: 🚪 User logged out — calling OneSignal.logout()');
        try {
          OneSignal.logout();
          if (isMounted.current) setExternalUserId(null);
          console.log('🔔 OneSignal: ✅ OneSignal.logout() complete');
        } catch (err) {
          console.warn('🔔 OneSignal: ❌ logout error:', err);
        }
      } else {
        console.log('🔔 OneSignal: ℹ️ No user logged in — skipping OneSignal.login()');
      }
      return;
    }

    // Skip if already logged in with the same ID
    if (externalUserId === userId) {
      console.log('🔔 OneSignal: ℹ️ Already logged in as', userId, '— skipping duplicate login');
      return;
    }

    console.log('🔔 OneSignal: ========================================');
    console.log('🔔 OneSignal: 🤝 LINKING USER TO ONESIGNAL');
    console.log('🔔 OneSignal: External User ID (auth_user_id):', userId);
    console.log('🔔 OneSignal: ========================================');

    (async () => {
      try {
        // v5 API: OneSignal.login(externalId) links the device to this user
        OneSignal.login(userId);
        console.log('🔔 OneSignal: ✅ OneSignal.login() called with ID:', userId);

        if (isMounted.current) setExternalUserId(userId);

        // Set tags for segmentation
        const tags: Record<string, string> = {
          user_id: userId,
          full_name: user.fullName || '',
          email: user.email || '',
          city: user.city || '',
          has_contract: user.hasContract ? 'true' : 'false',
        };
        OneSignal.User.addTags(tags);
        console.log('🔔 OneSignal: ✅ User tags set:', JSON.stringify(tags));

        // Set email for cross-channel identification
        if (user.email) {
          OneSignal.User.addEmail(user.email);
          console.log('🔔 OneSignal: ✅ Email linked:', user.email);
        }

        // Ensure device is opted-in after login (login can reset subscription state)
        console.log('🔔 OneSignal: ✅ Calling optIn() after login to ensure subscription');
        OneSignal.User.pushSubscription.optIn();

        // Wait for registration to settle
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Refresh subscription state after login
        const id = getPushSubscriptionId();
        const optedInAfterLogin = getPushSubscriptionOptedIn();
        console.log('🔔 OneSignal: Player ID after login:', id || '⚠️ not yet available');
        console.log('🔔 OneSignal: Opted In after login:', optedInAfterLogin ? '✅' : '❌');
        if (isMounted.current) {
          if (id) setPlayerId(id);
          setIsSubscribed(optedInAfterLogin);
        }

        console.log('🔔 OneSignal: ✅ USER HANDSHAKE COMPLETE — user should appear in dashboard');
        console.log('🔔 OneSignal: ========================================');

      } catch (error) {
        console.warn('🔔 OneSignal: ❌ login/handshake error:', error);
      }
    })();
  }, [isInitialized, isUserLoading, user?.id]);

  // ─── Diagnostics ─────────────────────────────────────────────────────────
  const logFullDiagnostics = async () => {
    console.log('🔔 OneSignal: ========================================');
    console.log('🔔 OneSignal: 🔍 DIAGNOSTIC REPORT');
    console.log('🔔 OneSignal: ========================================');
    console.log('🔔 OneSignal: Platform:', Platform.OS, '| isDevice:', Device.isDevice);
    console.log('🔔 OneSignal: Native module available:', isOneSignalAvailable ? '✅' : '❌ (Expo Go)');
    console.log('🔔 OneSignal: SDK Initialized:', isInitialized ? '✅' : '❌');

    if (!isOneSignalAvailable) {
      console.warn('🔔 OneSignal: Diagnostics skipped — native module unavailable (Expo Go).');
      console.log('🔔 OneSignal: ========================================');
      return;
    }

    try {
      const permission = OneSignal.Notifications.hasPermission();
      const subId = getPushSubscriptionId();
      const token = getPushSubscriptionToken();
      const optedIn = getPushSubscriptionOptedIn();

      console.log('🔔 OneSignal: Permission:', permission ? '✅' : '❌');
      console.log('🔔 OneSignal: Subscription ID:', subId || '❌ NOT AVAILABLE');
      console.log('🔔 OneSignal: Push Token:', token ? `✅ ${token.substring(0, 30)}...` : '❌ NOT AVAILABLE');
      console.log('🔔 OneSignal: Opted In:', optedIn ? '✅' : '❌');
      console.log('🔔 OneSignal: External User ID:', externalUserId || '❌ NOT SET');

      const allGood = permission && subId && token && optedIn && externalUserId;
      if (allGood) {
        console.log('🔔 OneSignal: ✅ ALL SYSTEMS OPERATIONAL');
      } else {
        console.log('🔔 OneSignal: ⚠️ ISSUES DETECTED:');
        if (!permission) console.log('🔔 OneSignal:   - Permission not granted');
        if (!subId) console.log('🔔 OneSignal:   - No Subscription ID (device not registered)');
        if (!token) console.log('🔔 OneSignal:   - No Push Token (FCM/APNS issue)');
        if (!optedIn) console.log('🔔 OneSignal:   - Not opted in');
        if (!externalUserId) console.log('🔔 OneSignal:   - No External User ID (login not called)');
      }
    } catch (error) {
      console.warn('🔔 OneSignal: ❌ Diagnostic error:', error);
    }
    console.log('🔔 OneSignal: ========================================');
  };

  // ─── Request permission ───────────────────────────────────────────────────
  const requestPermission = async (): Promise<boolean> => {
    console.log('🔔 OneSignal: requestPermission() called');

    if (Platform.OS === 'web' || !Device.isDevice) {
      console.log('🔔 OneSignal: ❌ Not supported on web/simulator');
      return false;
    }

    if (!isOneSignalAvailable) {
      console.warn('🔔 OneSignal: ❌ requestPermission skipped — native module unavailable (Expo Go).');
      return false;
    }

    if (!isInitialized) {
      console.log('🔔 OneSignal: ❌ SDK not initialized yet — cannot request permission');
      return false;
    }

    try {
      console.log('🔔 OneSignal: Requesting notification permission from user...');
      const granted = await OneSignal.Notifications.requestPermission(true);
      console.log('🔔 OneSignal: Permission result:', granted ? '✅ GRANTED' : '❌ DENIED');

      if (isMounted.current) setHasPermission(granted);

      if (granted) {
        // Force opt-in so the device registers immediately
        OneSignal.User.pushSubscription.optIn();
        console.log('🔔 OneSignal: ✅ optIn() called');

        // Wait for device registration
        await new Promise(resolve => setTimeout(resolve, 2000));

        const id = getPushSubscriptionId();
        const token = getPushSubscriptionToken();
        const optedIn = getPushSubscriptionOptedIn();

        console.log('🔔 OneSignal: Subscription ID after permission:', id || '⚠️ not yet available');
        console.log('🔔 OneSignal: Push Token after permission:', token ? '✅ present' : '❌ missing');
        console.log('🔔 OneSignal: Opted In:', optedIn ? '✅' : '❌');

        if (isMounted.current) {
          if (id) setPlayerId(id);
          setIsSubscribed(optedIn);
        }

        if (id && token) {
          console.log('🔔 OneSignal: 🎉 Device fully registered — should appear in dashboard');
        } else {
          console.log('🔔 OneSignal: ⚠️ Permission granted but registration incomplete — check FCM/APNS config');
        }
      }

      return granted;
    } catch (error) {
      console.warn('🔔 OneSignal: ❌ requestPermission error:', error);
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
