import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useUser } from './UserContext';

// Safely load OneSignal — it's a native module unavailable in Expo Go
let OS: any = null;
let LogLevel: any = null;
try {
  const mod = require('react-native-onesignal');
  OS = mod.OneSignal ?? mod.default ?? mod;
  LogLevel = mod.LogLevel;
} catch {
  console.warn('OneSignal: native module not available (Expo Go)');
}

interface OneSignalContextType {
  isInitialized: boolean;
  hasPermission: boolean;
  isSubscribed: boolean;
  playerId: string | null;
  externalUserId: string | null;
  requestPermission: () => Promise<boolean>;
}

const OneSignalContext = createContext<OneSignalContextType>({
  isInitialized: false,
  hasPermission: false,
  isSubscribed: false,
  playerId: null,
  externalUserId: null,
  requestPermission: async () => false,
});

export function useOneSignal() {
  return useContext(OneSignalContext);
}

const APP_ID = Constants.expoConfig?.extra?.oneSignalAppId ?? 'b732b467-6886-4c7b-b3d9-5010de1199d6';

/**
 * Read the current push subscription state from OneSignal.
 * A device is truly subscribed only when BOTH id (subscription ID) AND token (FCM/APNs token) are present.
 */
function readPushSubscriptionState(): { id: string | null; optedIn: boolean; token: string | null } {
  try {
    const id = OS?.User?.pushSubscription?.id ?? null;
    const optedIn = OS?.User?.pushSubscription?.optedIn ?? false;
    const token = OS?.User?.pushSubscription?.token ?? null;
    console.log('OneSignal: readPushSubscriptionState — id:', id, 'optedIn:', optedIn, 'token:', token ? token.substring(0, 20) + '...' : null);
    return { id, optedIn, token };
  } catch (e) {
    console.warn('OneSignal: readPushSubscriptionState error', e);
    return { id: null, optedIn: false, token: null };
  }
}

/**
 * A device is truly registered in the OneSignal dashboard only when it has a subscription ID.
 * optedIn alone is NOT sufficient — it just means the user hasn't opted out, but the device
 * may not have completed FCM/APNs registration yet.
 */
function isTrulySubscribed(id: string | null, token: string | null): boolean {
  return !!id && !!token;
}

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isUserLoading } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [externalUserId, setExternalUserId] = useState<string | null>(null);
  const initialized = useRef(false);
  const loginPendingRef = useRef<string | null>(null);

  // Initialize once on mount
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!OS) return;
    if (initialized.current) return;
    initialized.current = true;

    console.log('OneSignal: ========== INITIALIZING ==========');
    console.log('OneSignal: App ID:', APP_ID);
    console.log('OneSignal: Platform:', Platform.OS);

    try {
      // Enable verbose logging BEFORE initialize so we capture all SDK logs
      if (LogLevel) {
        OS.Debug.setLogLevel(LogLevel.Verbose);
        console.log('OneSignal: Verbose logging enabled');
      }
      OS.initialize(APP_ID);
      console.log('OneSignal: ✅ initialize() called with App ID:', APP_ID);
    } catch (e) {
      console.error('OneSignal: ❌ initialize() threw an error:', e);
      initialized.current = false;
      return;
    }

    // Mark initialized immediately after initialize() — listeners and permission
    // requests must happen AFTER this call
    setIsInitialized(true);

    // --- Subscription change listener ---
    // Fires when FCM/APNs registration completes and a subscription ID is assigned
    try {
      OS.User.pushSubscription.addEventListener('change', (state: any) => {
        console.log('OneSignal: 🔔 pushSubscription change event fired');
        console.log('OneSignal: state.current:', JSON.stringify(state?.current));
        console.log('OneSignal: state.previous:', JSON.stringify(state?.previous));

        const id = state?.current?.id ?? null;
        const token = state?.current?.token ?? null;
        const optedIn = state?.current?.optedIn ?? false;

        console.log('OneSignal: subscription change — id:', id, 'token:', token ? token.substring(0, 20) + '...' : null, 'optedIn:', optedIn);

        if (id) {
          setPlayerId(id);
        }
        // Only mark as subscribed when we have a real subscription ID
        setIsSubscribed(isTrulySubscribed(id, token));

        // If login was pending (user was set before subscription was ready), retry now
        if (id && loginPendingRef.current) {
          const pendingUserId = loginPendingRef.current;
          loginPendingRef.current = null;
          console.log('OneSignal: Retrying pending login for user:', pendingUserId);
          try {
            OS.login(pendingUserId);
            console.log('OneSignal: ✅ Deferred login() called for:', pendingUserId);
          } catch (loginErr) {
            console.warn('OneSignal: Deferred login() error:', loginErr);
          }
        }
      });
      console.log('OneSignal: pushSubscription change listener registered');
    } catch (e) {
      console.warn('OneSignal: Failed to register pushSubscription change listener:', e);
    }

    // --- Permission change listener ---
    try {
      OS.Notifications.addEventListener('permissionChange', (granted: boolean) => {
        console.log('OneSignal: 🔔 permissionChange event — granted:', granted);
        setHasPermission(granted);
        if (granted) {
          try {
            OS.User.pushSubscription.optIn();
            console.log('OneSignal: optIn() called after permission granted');
          } catch (e) {
            console.warn('OneSignal: optIn() error:', e);
          }
        }
      });
      console.log('OneSignal: permissionChange listener registered');
    } catch (e) {
      console.warn('OneSignal: Failed to register permissionChange listener:', e);
    }

    // --- Request permission AFTER initialize() and listener setup ---
    // On Android, requestPermission() triggers FCM registration which produces the subscription ID.
    // We must NOT pass `true` (fallback) on Android — it suppresses the dialog if previously denied.
    (async () => {
      try {
        console.log('OneSignal: Requesting notification permission...');
        const granted = await OS.Notifications.requestPermission(false);
        console.log('OneSignal: requestPermission result:', granted);
        setHasPermission(granted);

        if (granted) {
          try {
            OS.User.pushSubscription.optIn();
            console.log('OneSignal: optIn() called after permission granted');
          } catch (e) {
            console.warn('OneSignal: optIn() error:', e);
          }
        }
      } catch (e) {
        console.warn('OneSignal: requestPermission error:', e);
      }
    })();

    // --- Polling fallback for Android ---
    // The change event is unreliable on some Android versions/OEMs.
    // Poll every 5s for up to 60s to catch late FCM registrations.
    let pollCount = 0;
    const MAX_POLLS = 12; // 12 × 5s = 60s
    const pollInterval = setInterval(() => {
      pollCount += 1;
      const { id, optedIn, token } = readPushSubscriptionState();
      console.log(`OneSignal: poll #${pollCount}/${MAX_POLLS} — id: ${id}, token: ${token ? 'present' : 'null'}, optedIn: ${optedIn}`);

      if (id) {
        setPlayerId(id);
      }
      if (isTrulySubscribed(id, token)) {
        setIsSubscribed(true);
        console.log('OneSignal: ✅ Device is truly subscribed (has ID + token)');
      }

      if (id || pollCount >= MAX_POLLS) {
        clearInterval(pollInterval);
        if (!id && pollCount >= MAX_POLLS) {
          console.warn('OneSignal: ⚠️ Polling timed out — device never received a subscription ID.');
          console.warn('OneSignal: Check: 1) google-services.json is correct, 2) App ID matches dashboard, 3) FCM is configured in OneSignal dashboard');
        }
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  // --- Login/logout when user changes ---
  // IMPORTANT: OS.login() must be called AFTER the device has a subscription ID.
  // If called too early (before FCM registration), the external user ID won't appear in the dashboard.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!OS) return;
    if (!isInitialized) return;
    if (isUserLoading) return;

    const userId = user?.id;

    if (!userId) {
      if (externalUserId) {
        try {
          OS.logout();
          setExternalUserId(null);
          loginPendingRef.current = null;
          console.log('OneSignal: logout() called — user signed out');
        } catch (e) {
          console.warn('OneSignal: logout() error:', e);
        }
      }
      return;
    }

    if (userId === externalUserId) return;

    // Check if the device already has a subscription ID before calling login()
    const { id: currentId, token: currentToken } = readPushSubscriptionState();

    if (!currentId) {
      // Subscription not ready yet — store the user ID and retry when the change event fires
      console.log('OneSignal: Subscription ID not yet available — deferring login() for user:', userId);
      loginPendingRef.current = userId;

      // Also schedule a retry after 10s as a safety net
      setTimeout(() => {
        if (loginPendingRef.current === userId) {
          const { id: retryId } = readPushSubscriptionState();
          if (retryId) {
            loginPendingRef.current = null;
            try {
              OS.login(userId);
              setExternalUserId(userId);
              console.log('OneSignal: ✅ Deferred login() (10s retry) called for:', userId);
              applyUserTags(userId);
            } catch (e) {
              console.warn('OneSignal: Deferred login() (10s retry) error:', e);
            }
          } else {
            // Still no ID — call login() anyway so OneSignal can associate when it registers
            console.log('OneSignal: Still no subscription ID after 10s — calling login() optimistically for:', userId);
            loginPendingRef.current = null;
            try {
              OS.login(userId);
              setExternalUserId(userId);
              console.log('OneSignal: ✅ Optimistic login() called for:', userId);
              applyUserTags(userId);
            } catch (e) {
              console.warn('OneSignal: Optimistic login() error:', e);
            }
          }
        }
      }, 10000);
      return;
    }

    // Subscription is ready — call login() immediately
    console.log('OneSignal: Subscription ready (id:', currentId, ') — calling login() for:', userId);
    loginPendingRef.current = null;
    try {
      OS.login(userId);
      setExternalUserId(userId);
      console.log('OneSignal: ✅ login() called for:', userId);

      try {
        OS.User.pushSubscription.optIn();
      } catch {}

      applyUserTags(userId);
    } catch (e) {
      console.warn('OneSignal: login() error:', e);
    }
  }, [isInitialized, isUserLoading, user?.id]);

  function applyUserTags(userId: string) {
    try {
      OS.User.addTags({
        user_id: userId,
        full_name: user?.fullName ?? '',
        email: user?.email ?? '',
        platform: Platform.OS,
      });
      console.log('OneSignal: addTags() called for user:', userId);
    } catch (e) {
      console.warn('OneSignal: addTags() error:', e);
    }

    if (user?.email) {
      try {
        OS.User.addEmail(user.email);
        console.log('OneSignal: addEmail() called:', user.email);
      } catch (e) {
        console.warn('OneSignal: addEmail() error:', e);
      }
    }
  }

  const requestPermission = async (): Promise<boolean> => {
    if (!OS || Platform.OS === 'web') return false;
    console.log('OneSignal: requestPermission() called by user action');
    try {
      // false = do NOT use fallback — always show the native dialog
      const granted = await OS.Notifications.requestPermission(false);
      console.log('OneSignal: requestPermission result:', granted);
      setHasPermission(granted);

      if (granted) {
        try {
          OS.User.pushSubscription.optIn();
          console.log('OneSignal: optIn() called after user-triggered permission grant');
        } catch (e) {
          console.warn('OneSignal: optIn() error:', e);
        }

        // Poll after 5s — FCM registration takes time on Android
        setTimeout(() => {
          const { id, token } = readPushSubscriptionState();
          if (id) setPlayerId(id);
          if (isTrulySubscribed(id, token)) {
            setIsSubscribed(true);
            console.log('OneSignal: ✅ Subscribed after user-triggered permission (5s poll)');
          }
        }, 5000);
      }
      return granted;
    } catch (e) {
      console.warn('OneSignal: requestPermission() error:', e);
      return false;
    }
  };

  return (
    <OneSignalContext.Provider value={{ isInitialized, hasPermission, isSubscribed, playerId, externalUserId, requestPermission }}>
      {children}
    </OneSignalContext.Provider>
  );
}
