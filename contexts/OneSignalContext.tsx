import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useUser } from './UserContext';
import { registerOneSignalPlayer, RegisterOneSignalPlayerResult } from '@/utils/api';

// OS and LogLevel are loaded lazily inside the provider to avoid crashing
// on web/Expo Go where the native module is unavailable at module-eval time.
let OS: any = null;
let LogLevel: any = null;

function loadOneSignal(): void {
  if (OS !== null) return; // already loaded
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-onesignal');
    OS = mod.OneSignal ?? mod.default ?? mod;
    LogLevel = mod.LogLevel;
  } catch {
    console.warn('OneSignal: native module not available (Expo Go / web)');
    OS = undefined; // mark as attempted so we don't retry
  }
}

interface OneSignalContextType {
  isInitialized: boolean;
  hasPermission: boolean;
  isSubscribed: boolean;
  playerId: string | null;
  onesignalUserId: string | null;
  externalUserId: string | null;
  pushTokenDebugInfo: RegisterOneSignalPlayerResult | null;
  requestPermission: () => Promise<boolean>;
}

const OneSignalContext = createContext<OneSignalContextType>({
  isInitialized: false,
  hasPermission: false,
  isSubscribed: false,
  playerId: null,
  onesignalUserId: null,
  externalUserId: null,
  pushTokenDebugInfo: null,
  requestPermission: async () => false,
});

export function useOneSignal() {
  return useContext(OneSignalContext);
}

const APP_ID = Constants.expoConfig?.extra?.oneSignalAppId ?? 'b732b467-6886-4c7b-b3d9-5010de1199d6';

/**
 * Read the full push subscription + user state from OneSignal.
 * - id: OneSignal subscription ID (OneSignal.User.pushSubscription.id)
 * - onesignalId: OneSignal user-level ID (OneSignal.User.onesignalId)
 * - optedIn: whether the user has opted in to push
 * - token: the raw FCM/APNs device token
 *
 * A device is truly subscribed only when BOTH id AND token are present.
 */
function readSubscriptionState(): {
  id: string | null;
  onesignalId: string | null;
  optedIn: boolean;
  token: string | null;
} {
  try {
    const id = OS?.User?.pushSubscription?.id ?? null;
    const onesignalId = OS?.User?.onesignalId ?? null;
    const optedIn = OS?.User?.pushSubscription?.optedIn ?? false;
    const token = OS?.User?.pushSubscription?.token ?? null;
    console.log(
      'OneSignal: readSubscriptionState — subscriptionId:', id,
      '| onesignalId:', onesignalId,
      '| optedIn:', optedIn,
      '| token:', token ? token.substring(0, 20) + '...' : null
    );
    return { id, onesignalId, optedIn, token };
  } catch (e) {
    console.warn('OneSignal: readSubscriptionState error', e);
    return { id: null, onesignalId: null, optedIn: false, token: null };
  }
}

function isTrulySubscribed(id: string | null, token: string | null): boolean {
  return !!id && !!token;
}

/**
 * Attempt to register the push token with the backend.
 * Uses the OneSignal subscription ID (playerId) as the token identifier.
 * Logs both the subscription ID and the OneSignal user ID for diagnostics.
 */
function attemptRegistration(
  subscriptionId: string,
  authUserId: string,
  label: string,
  onResult: (result: RegisterOneSignalPlayerResult) => void
): void {
  const onesignalId = OS?.User?.onesignalId ?? null;
  console.log(`[PushToken] attemptRegistration (${label})`);
  console.log('[PushToken] authUserId:', authUserId);
  console.log('[PushToken] subscriptionId (playerId):', subscriptionId);
  console.log('[PushToken] onesignalId:', onesignalId);

  registerOneSignalPlayer(subscriptionId, authUserId)
    .then((result) => {
      console.log(`[PushToken] registration complete (${label}) — success:`, result.success);
      onResult(result);
    })
    .catch((err: any) => {
      console.error(`[PushToken] registerOneSignalPlayer threw (${label}):`, err?.message || err);
    });
}

/**
 * After OS.login() is called, OneSignal may reassign the subscription ID as it
 * associates the device with the external user. This helper polls for up to
 * `maxMs` milliseconds (default 15s) and saves the ID to the backend as soon as
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
      const { id, onesignalId, token } = readSubscriptionState();
      console.log(
        `OneSignal: post-login poll (${elapsed}ms) — subscriptionId: ${id}, onesignalId: ${onesignalId}, token: ${token ? 'present' : 'null'}`
      );

      if (id && id !== lastSavedId) {
        lastSavedId = id;
        console.log('OneSignal: ✅ Post-login poll found new/updated subscription ID:', id);
        onIdFound(id);
        attemptRegistration(id, authUserId, 'post-login-poll', () => {});
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

/**
 * Wait for the OneSignal subscription ID to become available, then call the
 * provided callback. Polls every `intervalMs` for up to `maxMs`.
 * Returns a cancel function.
 */
function waitForSubscriptionId(
  onReady: (id: string) => void,
  maxMs = 20000,
  intervalMs = 1500
): () => void {
  let elapsed = 0;

  const timer = setInterval(() => {
    elapsed += intervalMs;
    try {
      const { id, onesignalId, token } = readSubscriptionState();
      console.log(
        `OneSignal: waitForSubscriptionId poll (${elapsed}ms) — id: ${id}, onesignalId: ${onesignalId}, token: ${token ? 'present' : 'null'}`
      );

      if (id) {
        clearInterval(timer);
        console.log('OneSignal: ✅ Subscription ID became available after', elapsed, 'ms:', id);
        onReady(id);
        return;
      }
    } catch (e) {
      console.warn('OneSignal: waitForSubscriptionId poll error:', e);
    }

    if (elapsed >= maxMs) {
      clearInterval(timer);
      console.warn('OneSignal: ⚠️ waitForSubscriptionId timed out after', maxMs, 'ms — subscription ID never arrived');
    }
  }, intervalMs);

  return () => clearInterval(timer);
}

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  // Lazy-load the native module here, inside the component, so it never runs
  // at module evaluation time (which crashes on web / Expo Go).
  if (Platform.OS !== 'web') {
    loadOneSignal();
  }

  const { user, isLoading: isUserLoading } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [onesignalUserId, setOnesignalUserId] = useState<string | null>(null);
  const [externalUserId, setExternalUserId] = useState<string | null>(null);
  const [pushTokenDebugInfo, setPushTokenDebugInfo] = useState<RegisterOneSignalPlayerResult | null>(null);
  const initialized = useRef(false);
  // Stores a userId that needs to be associated once the subscription ID arrives
  const loginPendingRef = useRef<string | null>(null);
  // Tracks the last userId we successfully called OS.login() for, persisted across re-renders
  const loggedInUserRef = useRef<string | null>(null);
  // Cancels any in-flight post-login poll when a new login/logout occurs
  const cancelPostLoginPollRef = useRef<(() => void) | null>(null);
  // Cancels any in-flight waitForSubscriptionId poll
  const cancelWaitForSubRef = useRef<(() => void) | null>(null);

  // ─── Step 1: Initialize OneSignal on mount ───────────────────────────────────
  useEffect(() => { // eslint-disable-line react-hooks/exhaustive-deps
    if (Platform.OS === 'web') return;
    if (!OS) return;
    if (initialized.current) return;
    initialized.current = true;

    console.log('OneSignal: ========== INITIALIZING ==========');
    console.log('OneSignal: App ID:', APP_ID);
    console.log('OneSignal: Platform:', Platform.OS);

    try {
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

    setIsInitialized(true);

    // ── Subscription change listener ──────────────────────────────────────────
    try {
      OS.User.pushSubscription.addEventListener('change', (state: any) => {
        console.log('OneSignal: 🔔 pushSubscription change event fired');
        console.log('OneSignal: state.current:', JSON.stringify(state?.current));
        console.log('OneSignal: state.previous:', JSON.stringify(state?.previous));

        const id = state?.current?.id ?? null;
        const token = state?.current?.token ?? null;
        const optedIn = state?.current?.optedIn ?? false;
        // Also read onesignalId from the User object (not in the event payload)
        const onesignalId = OS?.User?.onesignalId ?? null;

        console.log(
          'OneSignal: subscription change — subscriptionId:', id,
          '| onesignalId:', onesignalId,
          '| token:', token ? token.substring(0, 20) + '...' : null,
          '| optedIn:', optedIn
        );

        if (id) {
          setPlayerId(id);
        }
        if (onesignalId) {
          setOnesignalUserId(onesignalId);
        }
        setIsSubscribed(isTrulySubscribed(id, token));

        // If login was pending (user was set before subscription was ready), retry now
        if (id && loginPendingRef.current) {
          const pendingUserId = loginPendingRef.current;
          loginPendingRef.current = null;
          console.log('OneSignal: 🔄 Subscription arrived via change event — completing deferred login for user:', pendingUserId);
          cancelWaitForSubRef.current?.();
          cancelWaitForSubRef.current = null;
          performLogin(pendingUserId, id);
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

    // ── Startup poll: read subscription state once it stabilises ─────────────
    // This handles the case where the subscription is already active from a
    // previous session but the change event won't fire (no state transition).
    let pollCount = 0;
    const MAX_POLLS = 12; // 12 × 5s = 60s
    const pollInterval = setInterval(() => {
      pollCount += 1;
      const { id, onesignalId, optedIn, token } = readSubscriptionState();
      console.log(
        `OneSignal: startup poll #${pollCount}/${MAX_POLLS} — subscriptionId: ${id}, onesignalId: ${onesignalId}, token: ${token ? 'present' : 'null'}, optedIn: ${optedIn}`
      );

      if (id) {
        setPlayerId(id);
      }
      if (onesignalId) {
        setOnesignalUserId(onesignalId);
      }
      if (isTrulySubscribed(id, token)) {
        setIsSubscribed(true);
        console.log('OneSignal: ✅ Device is truly subscribed (has subscriptionId + token)');
      }

      // If a login was pending and we now have a subscription ID, complete it
      if (id && loginPendingRef.current) {
        const pendingUserId = loginPendingRef.current;
        loginPendingRef.current = null;
        console.log('OneSignal: 🔄 Startup poll found subscription — completing deferred login for:', pendingUserId);
        cancelWaitForSubRef.current?.();
        cancelWaitForSubRef.current = null;
        clearInterval(pollInterval);
        performLogin(pendingUserId, id);
        return;
      }

      if (id || pollCount >= MAX_POLLS) {
        clearInterval(pollInterval);
        if (!id && pollCount >= MAX_POLLS) {
          console.warn('OneSignal: ⚠️ Startup polling timed out — device never received a subscription ID.');
          console.warn('OneSignal: Check: 1) google-services.json is correct, 2) App ID matches dashboard, 3) FCM is configured in OneSignal dashboard');
        }
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  // ─── Step 2: Login/logout when user changes ───────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          cancelWaitForSubRef.current?.();
          cancelWaitForSubRef.current = null;
          loginPendingRef.current = null;
          OS.logout();
          loggedInUserRef.current = null;
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
      console.log('OneSignal: OS.login() already called for user:', userId, '— checking startup re-registration');

      // Startup re-registration: ensure the player ID is saved to user_push_tokens
      // even if login() was already called (handles reinstalls / missed registrations).
      const { id: existingId, onesignalId } = readSubscriptionState();

      if (existingId) {
        console.log('OneSignal: Startup re-registration — subscriptionId available:', existingId, '| onesignalId:', onesignalId);
        attemptRegistration(existingId, userId, 'startup-re-registration', (result) => {
          setPushTokenDebugInfo(result);
        });
      } else {
        // Subscription ID not available yet — wait for it, then re-register
        console.log('OneSignal: Startup re-registration — subscriptionId not yet available, waiting...');
        cancelWaitForSubRef.current?.();
        cancelWaitForSubRef.current = waitForSubscriptionId((id) => {
          cancelWaitForSubRef.current = null;
          console.log('OneSignal: Startup re-registration — subscriptionId arrived:', id);
          attemptRegistration(id, userId, 'startup-re-registration-delayed', (result) => {
            setPushTokenDebugInfo(result);
          });
          setPlayerId(id);
          const { onesignalId: oid } = readSubscriptionState();
          if (oid) setOnesignalUserId(oid);
        });
      }
      return;
    }

    console.log('OneSignal: User changed to:', userId, '— checking subscription readiness');

    const { id: currentId, onesignalId: currentOnesignalId, token: currentToken } = readSubscriptionState();

    if (!currentId) {
      // Subscription not ready yet — defer login until subscription ID arrives
      console.log('OneSignal: Subscription ID not yet available — deferring OS.login() for user:', userId);
      loginPendingRef.current = userId;

      // Use waitForSubscriptionId to react as soon as the ID arrives (faster than 5s poll)
      cancelWaitForSubRef.current?.();
      cancelWaitForSubRef.current = waitForSubscriptionId((id) => {
        cancelWaitForSubRef.current = null;
        if (loginPendingRef.current !== userId) {
          console.log('OneSignal: waitForSubscriptionId resolved but pending user changed — skipping');
          return;
        }
        loginPendingRef.current = null;
        console.log('OneSignal: waitForSubscriptionId resolved — performing login for:', userId);
        performLogin(userId, id);
      });

      // Safety-net: after 10s, call login() optimistically even without a subscription ID
      setTimeout(() => {
        if (loginPendingRef.current !== userId) {
          return; // already handled
        }
        loginPendingRef.current = null;
        cancelWaitForSubRef.current?.();
        cancelWaitForSubRef.current = null;

        const { id: retryId, onesignalId: retryOnesignalId } = readSubscriptionState();
        const logLabel = retryId ? '(subscription now ready)' : '(optimistic — no subscription yet)';
        console.log(`OneSignal: 10s safety-net firing for user: ${userId} ${logLabel}`);

        try {
          console.log('OneSignal: Calling OS.login() via 10s safety-net for user:', userId);
          OS.login(userId);
          loggedInUserRef.current = userId;
          setExternalUserId(userId);
          console.log('OneSignal: ✅ Safety-net OS.login() called for:', userId);
          applyUserTagsForUser(userId);

          if (retryId) {
            console.log('[PushToken] safety-net — subscriptionId:', retryId, '| onesignalId:', retryOnesignalId);
            attemptRegistration(retryId, userId, 'safety-net', (result) => {
              setPushTokenDebugInfo(result);
            });
          }

          cancelPostLoginPollRef.current?.();
          cancelPostLoginPollRef.current = pollAndSavePlayerIdAfterLogin(
            userId,
            retryId,
            (newId) => {
              setPlayerId(newId);
              const { onesignalId: oid } = readSubscriptionState();
              if (oid) setOnesignalUserId(oid);
            }
          );
        } catch (e) {
          console.warn('OneSignal: Safety-net OS.login() error:', e);
        }
      }, 10000);
      return;
    }

    // Subscription is ready — call login() immediately
    console.log(
      'OneSignal: Subscription ready — subscriptionId:', currentId,
      '| onesignalId:', currentOnesignalId,
      '| token:', currentToken ? 'present' : 'null',
      '— calling OS.login() for:', userId
    );
    loginPendingRef.current = null;
    performLogin(userId, currentId);
  }, [isInitialized, isUserLoading, user?.id]);

  // ─── performLogin: call OS.login(), register token, start post-login poll ──
  function performLogin(userId: string, subscriptionId: string): void {
    try {
      console.log('OneSignal: Calling OS.login() for user:', userId);
      OS.login(userId);
      loggedInUserRef.current = userId;
      setExternalUserId(userId);
      console.log('OneSignal: ✅ OS.login() called successfully for:', userId);

      try {
        OS.User.pushSubscription.optIn();
      } catch {}

      applyUserTagsForUser(userId);

      // Read onesignalId immediately after login (may update asynchronously)
      const { onesignalId } = readSubscriptionState();
      if (onesignalId) setOnesignalUserId(onesignalId);

      console.log('[PushToken] performLogin — subscriptionId:', subscriptionId, '| onesignalId:', onesignalId);
      attemptRegistration(subscriptionId, userId, 'perform-login', (result) => {
        setPushTokenDebugInfo(result);
      });

      // Start post-login poll to catch any subscription ID reassignment
      cancelPostLoginPollRef.current?.();
      cancelPostLoginPollRef.current = pollAndSavePlayerIdAfterLogin(
        userId,
        subscriptionId,
        (newId) => {
          setPlayerId(newId);
          const { onesignalId: oid } = readSubscriptionState();
          if (oid) setOnesignalUserId(oid);
        }
      );
    } catch (e) {
      console.warn('OneSignal: performLogin error:', e);
    }
  }

  // ─── Apply user tags ──────────────────────────────────────────────────────
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

        // Wait for subscription to become available after opt-in, then register
        setTimeout(() => {
          const { id, onesignalId, token } = readSubscriptionState();
          if (id) {
            setPlayerId(id);
            if (onesignalId) setOnesignalUserId(onesignalId);
            if (isTrulySubscribed(id, token)) {
              setIsSubscribed(true);
              console.log('OneSignal: ✅ Subscribed after user-triggered permission (5s check)');
            }
            // Re-register in case this is a fresh opt-in
            const userId = loggedInUserRef.current;
            if (userId) {
              console.log('[PushToken] requestPermission opt-in — subscriptionId:', id, '| onesignalId:', onesignalId);
              attemptRegistration(id, userId, 'request-permission-opt-in', (result) => {
                setPushTokenDebugInfo(result);
              });
            }
          } else {
            // Subscription not ready yet — wait for it
            cancelWaitForSubRef.current?.();
            cancelWaitForSubRef.current = waitForSubscriptionId((newId) => {
              cancelWaitForSubRef.current = null;
              setPlayerId(newId);
              const { onesignalId: oid, token: t } = readSubscriptionState();
              if (oid) setOnesignalUserId(oid);
              if (isTrulySubscribed(newId, t)) setIsSubscribed(true);
              const userId = loggedInUserRef.current;
              if (userId) {
                console.log('[PushToken] requestPermission delayed opt-in — subscriptionId:', newId, '| onesignalId:', oid);
                attemptRegistration(newId, userId, 'request-permission-opt-in-delayed', (result) => {
                  setPushTokenDebugInfo(result);
                });
              }
            });
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
    <OneSignalContext.Provider
      value={{
        isInitialized,
        hasPermission,
        isSubscribed,
        playerId,
        onesignalUserId,
        externalUserId,
        pushTokenDebugInfo,
        requestPermission,
      }}
    >
      {children}
    </OneSignalContext.Provider>
  );
}
