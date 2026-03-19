import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useUser } from './UserContext';
import { saveOneSignalPlayerId } from '@/utils/api';

/**
 * After OS.login() is called, OneSignal may reassign the subscription ID as it
 * associates the device with the external user. This helper polls for up to
 * `maxMs` milliseconds (default 15s) and saves the ID to Supabase as soon as
 * it becomes available (or updates if it changes post-login).
 */
function pollAndSavePlayerIdAfterLogin(
  authUserId: string,
  knownIdBeforeLogin: string | null,
  onIdFound: (id: string) => void,
  maxMs = 15000,
  intervalMs = 1500
): () => void {
  let elapsed = 0;
  let lastSavedId: string | null = knownIdBeforeLogin;

  const timer = setInterval(() => {
    elapsed += intervalMs;
    try {
      const id = OS?.User?.pushSubscription?.id ?? null;
      const token = OS?.User?.pushSubscription?.token ?? null;
      console.log(
        `OneSignal: post-login poll (${elapsed}ms) — id: ${id}, token: ${token ? 'present' : 'null'}`
      );

      if (id && id !== lastSavedId) {
        lastSavedId = id;
        console.log('OneSignal: ✅ Post-login poll found new/updated player ID:', id);
        onIdFound(id);
        saveOneSignalPlayerId(authUserId, id);
      }
    } catch (e) {
      console.warn('OneSignal: post-login poll error:', e);
    }

    if (elapsed >= maxMs) {
      clearInterval(timer);
      console.log('OneSignal: post-login poll finished after', elapsed, 'ms');
    }
  }, intervalMs);

  return () => clearInterval(timer);
}

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
  // Stores a userId that needs to be associated once the subscription ID arrives
  const loginPendingRef = useRef<string | null>(null);
  // Tracks the last userId we successfully called OS.login() for, persisted across re-renders
  const loggedInUserRef = useRef<string | null>(null);
  // Cancels any in-flight post-login poll when a new login/logout occurs
  const cancelPostLoginPollRef = useRef<(() => void) | null>(null);

  // ─── Step 1: Initialize OneSignal on mount ───────────────────────────────────
  // This MUST happen before any permission request or login call.
  // requestPermission(false) is called immediately after initialize() so that
  // Android shows the POST_NOTIFICATIONS dialog as early as possible — before
  // the user even reaches the login/register screen.
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

    // ── Subscription change listener ──────────────────────────────────────────
    // Fires when FCM/APNs registration completes and a subscription ID is assigned.
    // This is the primary trigger for the deferred-login path.
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
          console.log('OneSignal: 🔄 Subscription arrived — retrying deferred login for user:', pendingUserId);
          try {
            OS.login(pendingUserId);
            // IMPORTANT: update both the ref and state so we don't re-login on next render
            loggedInUserRef.current = pendingUserId;
            setExternalUserId(pendingUserId);
            console.log('OneSignal: ✅ Deferred login() called for:', pendingUserId);
            // Save the current ID immediately, then poll for any post-login ID update
            saveOneSignalPlayerId(pendingUserId, id);
            cancelPostLoginPollRef.current?.();
            cancelPostLoginPollRef.current = pollAndSavePlayerIdAfterLogin(
              pendingUserId,
              id,
              (newId) => setPlayerId(newId)
            );
          } catch (loginErr) {
            console.warn('OneSignal: Deferred login() error:', loginErr);
          }
        }
      });
      console.log('OneSignal: pushSubscription change listener registered');
    } catch (e) {
      console.warn('OneSignal: Failed to register pushSubscription change listener:', e);
    }

    // ── Permission change listener ────────────────────────────────────────────
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

    // ── Request permission IMMEDIATELY after initialize() ─────────────────────
    // Called here (app launch) so Android shows the POST_NOTIFICATIONS dialog
    // BEFORE the user reaches the login/register screen. This ensures the FCM
    // token is obtained early, so OS.login() can be called with a valid
    // subscription ID when the user authenticates.
    // false = do NOT use fallback — always show the native dialog.
    (async () => {
      try {
        console.log('OneSignal: Requesting notification permission on app launch...');
        const granted = await OS.Notifications.requestPermission(false);
        console.log('OneSignal: requestPermission result:', granted);
        setHasPermission(granted);

        if (granted) {
          try {
            OS.User.pushSubscription.optIn();
            console.log('OneSignal: optIn() called after launch permission grant');
          } catch (e) {
            console.warn('OneSignal: optIn() error:', e);
          }
        }
      } catch (e) {
        console.warn('OneSignal: requestPermission error:', e);
      }
    })();

    // ── Polling fallback for Android ──────────────────────────────────────────
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

      // If a login was pending and we now have a subscription ID, complete it
      if (id && loginPendingRef.current) {
        const pendingUserId = loginPendingRef.current;
        loginPendingRef.current = null;
        console.log('OneSignal: 🔄 Poll found subscription — completing deferred login for:', pendingUserId);
        try {
          OS.login(pendingUserId);
          loggedInUserRef.current = pendingUserId;
          setExternalUserId(pendingUserId);
          console.log('OneSignal: ✅ Deferred login() (poll) called for:', pendingUserId);
          // Save the current ID immediately, then poll for any post-login ID update
          saveOneSignalPlayerId(pendingUserId, id);
          cancelPostLoginPollRef.current?.();
          cancelPostLoginPollRef.current = pollAndSavePlayerIdAfterLogin(
            pendingUserId,
            id,
            (newId) => setPlayerId(newId)
          );
        } catch (e) {
          console.warn('OneSignal: Deferred login() (poll) error:', e);
        }
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

  // ─── Step 2: Login/logout when user changes ───────────────────────────────
  // This effect handles THREE scenarios:
  //   A) New registration: user just signed up, setUser() was called in register.tsx
  //   B) Existing user login: user signed in, setUser() was called in register.tsx
  //   C) App reopen while already logged in: UserContext restores user from Supabase session
  //
  // In all cases, OS.login(userId) must be called to associate the device
  // subscription with the user in the OneSignal dashboard.
  //
  // IMPORTANT: We use loggedInUserRef (not externalUserId state) as the guard
  // to prevent duplicate logins, because state resets on every cold start but
  // we want to re-login on every app open to ensure the association is fresh.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!OS) return;
    if (!isInitialized) return;
    if (isUserLoading) return;

    const userId = user?.id;

    if (!userId) {
      // User logged out — clear OneSignal association
      if (loggedInUserRef.current) {
        try {
          cancelPostLoginPollRef.current?.();
          cancelPostLoginPollRef.current = null;
          OS.logout();
          loggedInUserRef.current = null;
          loginPendingRef.current = null;
          setExternalUserId(null);
          console.log('OneSignal: logout() called — user signed out');
        } catch (e) {
          console.warn('OneSignal: logout() error:', e);
        }
      }
      return;
    }

    // Skip if we already called login() for this user in this session
    if (userId === loggedInUserRef.current) {
      console.log('OneSignal: login() already called for user:', userId, '— skipping');
      return;
    }

    console.log('OneSignal: User changed to:', userId, '— checking subscription readiness');

    // Check if the device already has a subscription ID before calling login()
    const { id: currentId, token: currentToken } = readPushSubscriptionState();

    if (!currentId) {
      // Subscription not ready yet — store the user ID and retry when:
      //   1. The pushSubscription change event fires (primary path)
      //   2. The polling loop finds a subscription ID (fallback)
      //   3. The 10s safety-net timeout below fires (last resort)
      console.log('OneSignal: Subscription ID not yet available — deferring login() for user:', userId);
      loginPendingRef.current = userId;

      // Safety-net: after 10s, call login() optimistically even without a subscription ID.
      // OneSignal will associate the user once FCM registration eventually completes.
      setTimeout(() => {
        if (loginPendingRef.current !== userId) {
          // Already handled by change event or poll — nothing to do
          return;
        }
        loginPendingRef.current = null;

        const { id: retryId } = readPushSubscriptionState();
        const logLabel = retryId ? '(subscription now ready)' : '(optimistic — no subscription yet)';
        console.log(`OneSignal: 10s safety-net firing for user: ${userId} ${logLabel}`);

        try {
          OS.login(userId);
          loggedInUserRef.current = userId;
          setExternalUserId(userId);
          console.log('OneSignal: ✅ Safety-net login() called for:', userId);
          applyUserTagsForUser(userId);
          if (retryId) {
            saveOneSignalPlayerId(userId, retryId);
          }
          // Poll post-login to catch any ID assigned/updated after OS.login() resolves
          cancelPostLoginPollRef.current?.();
          cancelPostLoginPollRef.current = pollAndSavePlayerIdAfterLogin(
            userId,
            retryId,
            (newId) => setPlayerId(newId)
          );
        } catch (e) {
          console.warn('OneSignal: Safety-net login() error:', e);
        }
      }, 10000);
      return;
    }

    // Subscription is ready — call login() immediately
    console.log('OneSignal: Subscription ready (id:', currentId, 'token:', currentToken ? 'present' : 'null', ') — calling login() for:', userId);
    loginPendingRef.current = null;
    try {
      OS.login(userId);
      loggedInUserRef.current = userId;
      setExternalUserId(userId);
      console.log('OneSignal: ✅ login() called for:', userId);

      try {
        OS.User.pushSubscription.optIn();
      } catch {}

      applyUserTagsForUser(userId);
      // Save the current ID immediately, then poll for any post-login ID update
      saveOneSignalPlayerId(userId, currentId);
      cancelPostLoginPollRef.current?.();
      cancelPostLoginPollRef.current = pollAndSavePlayerIdAfterLogin(
        userId,
        currentId,
        (newId) => setPlayerId(newId)
      );
    } catch (e) {
      console.warn('OneSignal: login() error:', e);
    }
  }, [isInitialized, isUserLoading, user?.id]);

  // ─── Apply user tags ──────────────────────────────────────────────────────
  // Separated from the effect so it can be called from both the immediate and
  // deferred paths. Uses the current `user` from closure — safe because this
  // is only called synchronously within the effect or the 10s timeout which
  // captures the same render's `user` value.
  function applyUserTagsForUser(userId: string) {
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

  // ─── Manual permission request (e.g. from settings screen) ───────────────
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
