/**
 * OneSignalContext — Native push notification integration via OneSignal SDK v5.
 *
 * Responsibilities:
 *  1. Load the native module safely (guard with NativeModules before require).
 *  2. Initialize OneSignal once with the App ID from app.json.
 *  3. On user login → call OS.login(userId), register push token to backend.
 *  4. On user logout → call OS.logout(), clear state.
 *  5. After login, auto-request permission if not already granted.
 *  6. Handle foreground notification display.
 *  7. Handle notification tap → navigate to the correct screen.
 *  8. Keep push token in sync (subscription change events + polling).
 *
 * Provider nesting in _layout.tsx (order matters):
 *   <UserProvider>
 *     <OneSignalProvider>          ← initialises OneSignal, owns all token state
 *       <NotificationProvider>     ← reads OneSignal state, exposes useNotifications()
 *         ...app screens...
 *       </NotificationProvider>
 *     </OneSignalProvider>
 *   </UserProvider>
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Platform, NativeModules } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useUser } from './UserContext';
import {
  registerOneSignalPlayer,
  RegisterOneSignalPlayerResult,
} from '@/utils/api';

// ─── Lazy-load OneSignal native module ───────────────────────────────────────
// We MUST check NativeModules before calling require() because
// TurboModuleRegistry.getEnforcing() throws synchronously even inside try/catch
// in newer React Native. Guarding with NativeModules prevents the crash in
// Expo Go and web where the native module is absent.
let OS: any = null;
let LogLevel: any = null;

function loadOneSignal(): void {
  if (OS !== null) return; // already loaded (or already attempted)

  const hasNativeModule =
    !!NativeModules.OneSignal || !!NativeModules.RNOneSignal;

  if (!hasNativeModule) {
    console.warn(
      '[OneSignal] Native module not found in NativeModules — skipping require().' +
        ' This is expected in Expo Go and web builds.'
    );
    OS = undefined; // mark as attempted so we never retry
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-onesignal');
    OS = mod.OneSignal ?? mod.default ?? mod;
    LogLevel = mod.LogLevel;
    console.log('[OneSignal] Native module loaded successfully');
  } catch (e) {
    console.warn('[OneSignal] require() failed (Expo Go / web):', e);
    OS = undefined;
  }
}

// ─── Context shape ────────────────────────────────────────────────────────────
interface OneSignalContextType {
  isInitialized: boolean;
  hasPermission: boolean;
  isSubscribed: boolean;
  playerId: string | null;
  onesignalUserId: string | null;
  externalUserId: string | null;
  pushTokenDebugInfo: RegisterOneSignalPlayerResult | null;
  requestPermission: () => Promise<boolean>;
  /** Request permission only if not already granted. Safe to call after login. */
  requestPermissionIfNeeded: () => Promise<boolean>;
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
  requestPermissionIfNeeded: async () => false,
});

export function useOneSignal() {
  return useContext(OneSignalContext);
}

const APP_ID =
  Constants.expoConfig?.extra?.oneSignalAppId ??
  'b732b467-6886-4c7b-b3d9-5010de1199d6';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Read the full push subscription + user state from OneSignal.
 * Returns safe defaults if the SDK is not available.
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
      '[OneSignal] readSubscriptionState — subscriptionId:', id,
      '| onesignalId:', onesignalId,
      '| optedIn:', optedIn,
      '| token:', token ? token.substring(0, 20) + '...' : null
    );
    return { id, onesignalId, optedIn, token };
  } catch (e) {
    console.warn('[OneSignal] readSubscriptionState error:', e);
    return { id: null, onesignalId: null, optedIn: false, token: null };
  }
}

function isTrulySubscribed(id: string | null, token: string | null): boolean {
  return !!id && !!token;
}

/**
 * Attempt to register the push token with the backend.
 * Requires both the OneSignal subscription ID (playerId) AND the actual
 * FCM/APNs push token. Returns early if either is missing.
 */
function attemptRegistration(
  subscriptionId: string,
  pushToken: string | null,
  authUserId: string,
  label: string,
  onResult: (result: RegisterOneSignalPlayerResult) => void
): void {
  const onesignalId = OS?.User?.onesignalId ?? null;
  console.log(`[PushToken] attemptRegistration (${label})`);
  console.log('[PushToken] authUserId:', authUserId);
  console.log('[PushToken] subscriptionId (playerId):', subscriptionId);
  console.log('[PushToken] onesignalId:', onesignalId);
  console.log('[PushToken] pushToken:', pushToken ? pushToken.substring(0, 20) + '...' : 'null');

  if (!pushToken || pushToken.trim() === '') {
    console.warn(
      `[PushToken] attemptRegistration (${label}) — skipped: push token is null/empty. ` +
        'Will retry when token arrives via subscription change event.'
    );
    return;
  }

  registerOneSignalPlayer(subscriptionId, authUserId, pushToken)
    .then((result) => {
      console.log(
        `[PushToken] registration complete (${label}) — success:`,
        result.success
      );
      onResult(result);
    })
    .catch((err: any) => {
      console.error(
        `[PushToken] registerOneSignalPlayer threw (${label}):`,
        err?.message || err
      );
    });
}

/**
 * After OS.login() is called, OneSignal may reassign the subscription ID as it
 * associates the device with the external user. This helper polls for up to
 * `maxMs` milliseconds and saves the ID+token to the backend as soon as BOTH
 * are available (or updates if they change post-login).
 * Returns a cancel function.
 */
function pollAndSavePlayerIdAfterLogin(
  authUserId: string,
  onIdFound: (id: string) => void,
  maxMs = 15000,
  intervalMs = 1500
): () => void {
  let elapsed = 0;
  let lastSavedId: string | null = null;

  const timer = setInterval(() => {
    elapsed += intervalMs;
    try {
      const { id, onesignalId, token } = readSubscriptionState();
      console.log(
        `[OneSignal] post-login poll (${elapsed}ms) — subscriptionId: ${id},` +
          ` onesignalId: ${onesignalId}, token: ${token ? 'present' : 'null'}`
      );

      // Only register when BOTH subscription ID and push token are available
      if (id && token && id !== lastSavedId) {
        lastSavedId = id;
        console.log(
          '[OneSignal] ✅ Post-login poll found new/updated subscription ID + token:',
          id
        );
        onIdFound(id);
        attemptRegistration(id, token, authUserId, 'post-login-poll', () => {});
      } else if (id && !token) {
        console.log(
          `[OneSignal] post-login poll — subscriptionId present but token not yet available, waiting...`
        );
      }
    } catch (e) {
      console.warn('[OneSignal] post-login poll error:', e);
    }

    if (elapsed >= maxMs) {
      clearInterval(timer);
      console.log('[OneSignal] post-login poll finished after', elapsed, 'ms');
    }
  }, intervalMs);

  return () => clearInterval(timer);
}

/**
 * Wait for BOTH the OneSignal subscription ID and push token to become
 * available, then call the provided callback. Polls every `intervalMs` for
 * up to `maxMs`. Returns a cancel function.
 */
function waitForSubscriptionId(
  onReady: (id: string, token: string) => void,
  maxMs = 20000,
  intervalMs = 1500
): () => void {
  let elapsed = 0;

  const timer = setInterval(() => {
    elapsed += intervalMs;
    try {
      const { id, onesignalId, token } = readSubscriptionState();
      console.log(
        `[OneSignal] waitForSubscriptionId poll (${elapsed}ms) — id: ${id},` +
          ` onesignalId: ${onesignalId}, token: ${token ? 'present' : 'null'}`
      );

      if (id && token) {
        clearInterval(timer);
        console.log(
          '[OneSignal] ✅ Subscription ID + token both available after',
          elapsed,
          'ms:',
          id
        );
        onReady(id, token);
        return;
      } else if (id && !token) {
        console.log(
          '[OneSignal] waitForSubscriptionId — subscriptionId present but token not yet available, waiting...'
        );
      }
    } catch (e) {
      console.warn('[OneSignal] waitForSubscriptionId poll error:', e);
    }

    if (elapsed >= maxMs) {
      clearInterval(timer);
      console.warn(
        '[OneSignal] ⚠️ waitForSubscriptionId timed out after',
        maxMs,
        'ms — subscription ID and/or push token never arrived'
      );
    }
  }, intervalMs);

  return () => clearInterval(timer);
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function OneSignalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Load the native module inside the component so it never runs at module
  // evaluation time (which crashes on web / Expo Go).
  if (Platform.OS !== 'web') {
    loadOneSignal();
  }

  const { user, isLoading: isUserLoading } = useUser();
  const router = useRouter();

  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [onesignalUserId, setOnesignalUserId] = useState<string | null>(null);
  const [externalUserId, setExternalUserId] = useState<string | null>(null);
  const [pushTokenDebugInfo, setPushTokenDebugInfo] =
    useState<RegisterOneSignalPlayerResult | null>(null);

  const initialized = useRef(false);
  /** Stores a userId that needs to be associated once the subscription ID arrives */
  const loginPendingRef = useRef<string | null>(null);
  /** Tracks the last userId we successfully called OS.login() for */
  const loggedInUserRef = useRef<string | null>(null);
  /** Cancels any in-flight post-login poll */
  const cancelPostLoginPollRef = useRef<(() => void) | null>(null);
  /** Cancels any in-flight waitForSubscriptionId poll */
  const cancelWaitForSubRef = useRef<(() => void) | null>(null);

  // Keep a ref to the latest user so performLogin (called from event listeners)
  // can access it without stale closure issues.
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // ─── performLogin ────────────────────────────────────────────────────────
  // Defined as a ref-stable function so it can be called from event listeners
  // without capturing stale state.
  const performLogin = (userId: string, subscriptionId: string): void => {
    try {
      console.log('[OneSignal] Calling OS.login() for user:', userId);
      OS.login(userId);
      loggedInUserRef.current = userId;
      setExternalUserId(userId);
      console.log('[OneSignal] ✅ OS.login() called successfully for:', userId);

      // Ensure the device is opted in to push
      try {
        OS.User.pushSubscription.optIn();
      } catch (_e) {
        // non-fatal
      }

      applyUserTagsForUser(userId);

      const { onesignalId } = readSubscriptionState();
      if (onesignalId) setOnesignalUserId(onesignalId);

      const { token: loginToken } = readSubscriptionState();
      console.log(
        '[PushToken] performLogin — subscriptionId:',
        subscriptionId,
        '| onesignalId:',
        onesignalId,
        '| token:', loginToken ? loginToken.substring(0, 20) + '...' : 'null'
      );
      attemptRegistration(subscriptionId, loginToken, userId, 'perform-login', (result) => {
        setPushTokenDebugInfo(result);
      });

      // Start post-login poll to catch any subscription ID reassignment
      cancelPostLoginPollRef.current?.();
      cancelPostLoginPollRef.current = pollAndSavePlayerIdAfterLogin(
        userId,
        (newId) => {
          setPlayerId(newId);
          const { onesignalId: oid } = readSubscriptionState();
          if (oid) setOnesignalUserId(oid);
        }
      );
    } catch (e) {
      console.warn('[OneSignal] performLogin error:', e);
    }
  };

  // ─── applyUserTagsForUser ────────────────────────────────────────────────
  const applyUserTagsForUser = (userId: string): void => {
    const currentUser = userRef.current;
    try {
      OS.User.addTags({
        user_id: userId,
        full_name: currentUser?.fullName ?? '',
        email: currentUser?.email ?? '',
        platform: Platform.OS,
      });
      console.log('[OneSignal] addTags() called for user:', userId);
    } catch (e) {
      console.warn('[OneSignal] addTags() error:', e);
    }

    if (currentUser?.email) {
      try {
        OS.User.addEmail(currentUser.email);
        console.log('[OneSignal] addEmail() called:', currentUser.email);
      } catch (e) {
        console.warn('[OneSignal] addEmail() error:', e);
      }
    }
  };

  // ─── Step 1: Initialize OneSignal on mount ───────────────────────────────
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!OS) return;
    if (initialized.current) return;
    initialized.current = true;

    console.log('[OneSignal] ========== INITIALIZING ==========');
    console.log('[OneSignal] App ID:', APP_ID);
    console.log('[OneSignal] Platform:', Platform.OS);

    try {
      if (LogLevel) {
        OS.Debug.setLogLevel(LogLevel.Verbose);
        console.log('[OneSignal] Verbose logging enabled');
      }
      OS.initialize(APP_ID);
      console.log('[OneSignal] ✅ initialize() called with App ID:', APP_ID);
    } catch (e) {
      console.error('[OneSignal] ❌ initialize() threw an error:', e);
      initialized.current = false;
      return;
    }

    setIsInitialized(true);

    // ── Foreground notification display handler ───────────────────────────
    // Fires when a push notification arrives while the app is in the foreground.
    // Call event.preventDefault() to suppress the default banner, or let it
    // through by calling event.notification.display().
    try {
      OS.Notifications.addEventListener(
        'foregroundWillDisplay',
        (event: any) => {
          console.log(
            '[OneSignal] 🔔 foregroundWillDisplay — notification received in foreground'
          );
          const notification = event?.notification;
          console.log(
            '[OneSignal] foreground notification title:',
            notification?.title
          );
          console.log(
            '[OneSignal] foreground notification body:',
            notification?.body
          );
          console.log(
            '[OneSignal] foreground notification data:',
            JSON.stringify(notification?.additionalData)
          );
          // Display the notification banner even while the app is open
          event?.preventDefault();
          notification?.display();
        }
      );
      console.log('[OneSignal] foregroundWillDisplay listener registered');
    } catch (e) {
      console.warn(
        '[OneSignal] Failed to register foregroundWillDisplay listener:',
        e
      );
    }

    // ── Notification click / tap handler ─────────────────────────────────
    // Fires when the user taps a notification (from background or killed state).
    try {
      OS.Notifications.addEventListener('click', (event: any) => {
        console.log('[OneSignal] 🔔 Notification tapped (click event)');
        const notification = event?.notification;
        const data = notification?.additionalData ?? {};
        console.log('[OneSignal] Tapped notification title:', notification?.title);
        console.log('[OneSignal] Tapped notification data:', JSON.stringify(data));

        // Navigate based on the notification payload.
        // Supported data fields:
        //   data.screen  — route to navigate to (e.g. "/(tabs)/tasks")
        //   data.postId  — navigate to a specific post
        //   data.taskId  — navigate to tasks tab
        try {
          if (data.screen) {
            console.log('[OneSignal] Navigating to screen:', data.screen);
            router.push(data.screen as any);
          } else if (data.postId) {
            console.log('[OneSignal] Navigating to post:', data.postId);
            router.push(`/post/${data.postId}` as any);
          } else if (data.taskId) {
            console.log('[OneSignal] Navigating to tasks tab for task:', data.taskId);
            router.push('/(tabs)/tasks' as any);
          } else {
            // Default: navigate to the home tab
            console.log('[OneSignal] No specific screen in payload — navigating to home');
            router.push('/(tabs)' as any);
          }
        } catch (navErr) {
          console.warn('[OneSignal] Navigation after notification tap failed:', navErr);
        }
      });
      console.log('[OneSignal] click (notification tap) listener registered');
    } catch (e) {
      console.warn('[OneSignal] Failed to register click listener:', e);
    }

    // ── Subscription change listener ──────────────────────────────────────
    // Primary reliable path for capturing the subscription ID. Fires whenever
    // the subscription state changes (permission granted, optIn, post-login
    // ID reassignment). We attempt registration for ALL cases.
    try {
      OS.User.pushSubscription.addEventListener('change', (state: any) => {
        console.log('[OneSignal] 🔔 pushSubscription change event fired');
        console.log(
          '[OneSignal] state.current:',
          JSON.stringify(state?.current)
        );
        console.log(
          '[OneSignal] state.previous:',
          JSON.stringify(state?.previous)
        );

        const id = state?.current?.id ?? null;
        const token = state?.current?.token ?? null;
        const optedIn = state?.current?.optedIn ?? false;
        const onesignalId = OS?.User?.onesignalId ?? null;

        console.log(
          '[OneSignal] subscription change — subscriptionId:', id,
          '| onesignalId:', onesignalId,
          '| token:', token ? token.substring(0, 20) + '...' : null,
          '| optedIn:', optedIn
        );

        if (id) setPlayerId(id);
        if (onesignalId) setOnesignalUserId(onesignalId);
        setIsSubscribed(isTrulySubscribed(id, token));

        if (!id) return;

        // Case 1: Login was pending (user set before subscription was ready)
        if (loginPendingRef.current) {
          const pendingUserId = loginPendingRef.current;
          loginPendingRef.current = null;
          console.log(
            '[OneSignal] 🔄 Subscription arrived via change event — completing deferred login for user:',
            pendingUserId
          );
          cancelWaitForSubRef.current?.();
          cancelWaitForSubRef.current = null;
          performLogin(pendingUserId, id);
          return;
        }

        // Case 2: User is already logged in — register the new/updated token.
        const currentUserId = loggedInUserRef.current;
        if (currentUserId) {
          if (!token) {
            console.log(
              '[OneSignal] 🔄 Subscription change — subscriptionId present but token null, skipping registration'
            );
          } else {
            console.log(
              '[OneSignal] 🔄 Subscription change with logged-in user — registering token for:',
              currentUserId
            );
            attemptRegistration(
              id,
              token,
              currentUserId,
              'subscription-change-event',
              (result) => {
                setPushTokenDebugInfo(result);
              }
            );
          }
        }
      });
      console.log('[OneSignal] pushSubscription change listener registered');
    } catch (e) {
      console.warn(
        '[OneSignal] Failed to register pushSubscription change listener:',
        e
      );
    }

    // ── Permission change listener ────────────────────────────────────────
    try {
      OS.Notifications.addEventListener(
        'permissionChange',
        (granted: boolean) => {
          console.log(
            '[OneSignal] 🔔 permissionChange event — granted:',
            granted
          );
          setHasPermission(granted);
          if (granted) {
            try {
              OS.User.pushSubscription.optIn();
              console.log(
                '[OneSignal] optIn() called after permissionChange event'
              );
            } catch (e) {
              console.warn('[OneSignal] optIn() error:', e);
            }

            const {
              id: immediateId,
              onesignalId: immediateOid,
              token: immediateToken,
            } = readSubscriptionState();
            if (immediateId && loggedInUserRef.current) {
              console.log(
                '[OneSignal] permissionChange — subscription ID already available, registering immediately'
              );
              if (immediateOid) setOnesignalUserId(immediateOid);
              setPlayerId(immediateId);
              if (isTrulySubscribed(immediateId, immediateToken))
                setIsSubscribed(true);
              attemptRegistration(
                immediateId,
                immediateToken,
                loggedInUserRef.current,
                'permission-change-immediate',
                (result) => {
                  setPushTokenDebugInfo(result);
                }
              );
            } else if (!immediateId) {
              console.log(
                '[OneSignal] permissionChange — subscription ID not yet available, change event will handle it'
              );
            }
          }
        }
      );
      console.log('[OneSignal] permissionChange listener registered');
    } catch (e) {
      console.warn(
        '[OneSignal] Failed to register permissionChange listener:',
        e
      );
    }

    // ── Startup: sync current permission state (no prompt) ───────────────
    try {
      const alreadyGranted: boolean =
        OS.Notifications.hasPermission ?? false;
      console.log(
        '[OneSignal] startup permission check — already granted:',
        alreadyGranted
      );
      setHasPermission(alreadyGranted);
    } catch (e) {
      console.warn('[OneSignal] startup hasPermission check error:', e);
    }

    // ── Startup poll: read subscription state once it stabilises ─────────
    // Handles the case where the subscription is already active from a
    // previous session but the change event won't fire (no state transition).
    let pollCount = 0;
    const MAX_POLLS = 12; // 12 × 5s = 60s
    const pollInterval = setInterval(() => {
      pollCount += 1;
      const { id, onesignalId, optedIn, token } = readSubscriptionState();
      console.log(
        `[OneSignal] startup poll #${pollCount}/${MAX_POLLS} — subscriptionId: ${id},` +
          ` onesignalId: ${onesignalId}, token: ${token ? 'present' : 'null'}, optedIn: ${optedIn}`
      );

      if (id) setPlayerId(id);
      if (onesignalId) setOnesignalUserId(onesignalId);
      if (isTrulySubscribed(id, token)) {
        setIsSubscribed(true);
        console.log(
          '[OneSignal] ✅ Device is truly subscribed (has subscriptionId + token)'
        );
      }

      // If a login was pending and we now have BOTH subscription ID and token, complete it
      if (id && token && loginPendingRef.current) {
        const pendingUserId = loginPendingRef.current;
        loginPendingRef.current = null;
        console.log(
          '[OneSignal] 🔄 Startup poll found subscription + token — completing deferred login for:',
          pendingUserId
        );
        cancelWaitForSubRef.current?.();
        cancelWaitForSubRef.current = null;
        clearInterval(pollInterval);
        performLogin(pendingUserId, id);
        return;
      }

      if ((id && token) || pollCount >= MAX_POLLS) {
        clearInterval(pollInterval);
        if (!id && pollCount >= MAX_POLLS) {
          console.warn(
            '[OneSignal] ⚠️ Startup polling timed out — device never received a subscription ID.'
          );
          console.warn(
            '[OneSignal] Check: 1) google-services.json is correct,' +
              ' 2) App ID matches dashboard, 3) FCM is configured in OneSignal dashboard'
          );
        }
      }
    }, 5000);

    return () => {
      clearInterval(pollInterval);
      // Note: OneSignal v5 does not expose a removeEventListener API for all
      // event types. Listeners are cleaned up when the app process ends.
      // The provider is mounted for the lifetime of the app so this is fine.
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Step 2: Login/logout when user changes ──────────────────────────────
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
          console.log('[OneSignal] logout() called — user signed out');
        } catch (e) {
          console.warn('[OneSignal] logout() error:', e);
        }
      }
      return;
    }

    // Skip if we already called login() for this user in this session
    if (userId === loggedInUserRef.current) {
      console.log(
        '[OneSignal] OS.login() already called for user:',
        userId,
        '— checking startup re-registration'
      );

      // Startup re-registration: ensure the player ID is saved to user_push_tokens
      // even if login() was already called (handles reinstalls / missed registrations).
      const { id: existingId, onesignalId, token: existingToken } = readSubscriptionState();

      if (existingId && existingToken) {
        console.log(
          '[OneSignal] Startup re-registration — subscriptionId + token available:',
          existingId,
          '| onesignalId:',
          onesignalId
        );
        attemptRegistration(
          existingId,
          existingToken,
          userId,
          'startup-re-registration',
          (result) => {
            setPushTokenDebugInfo(result);
          }
        );
      } else {
        console.log(
          '[OneSignal] Startup re-registration — subscriptionId or token not yet available, waiting...',
          '| id:', existingId, '| token:', existingToken ? 'present' : 'null'
        );
        cancelWaitForSubRef.current?.();
        cancelWaitForSubRef.current = waitForSubscriptionId((id, token) => {
          cancelWaitForSubRef.current = null;
          console.log(
            '[OneSignal] Startup re-registration — subscriptionId + token arrived:',
            id
          );
          attemptRegistration(
            id,
            token,
            userId,
            'startup-re-registration-delayed',
            (result) => {
              setPushTokenDebugInfo(result);
            }
          );
          setPlayerId(id);
          const { onesignalId: oid } = readSubscriptionState();
          if (oid) setOnesignalUserId(oid);
        });
      }

      // Also ensure permission is requested if not yet granted
      requestPermissionIfNeeded();
      return;
    }

    console.log(
      '[OneSignal] User changed to:',
      userId,
      '— checking subscription readiness'
    );

    const {
      id: currentId,
      onesignalId: currentOnesignalId,
      token: currentToken,
    } = readSubscriptionState();

    if (!currentId) {
      // Subscription not ready yet — defer login until subscription ID arrives
      console.log(
        '[OneSignal] Subscription ID not yet available — deferring OS.login() for user:',
        userId
      );
      loginPendingRef.current = userId;

      cancelWaitForSubRef.current?.();
      cancelWaitForSubRef.current = waitForSubscriptionId((id, _token) => {
        cancelWaitForSubRef.current = null;
        if (loginPendingRef.current !== userId) {
          console.log(
            '[OneSignal] waitForSubscriptionId resolved but pending user changed — skipping'
          );
          return;
        }
        loginPendingRef.current = null;
        console.log(
          '[OneSignal] waitForSubscriptionId resolved — performing login for:',
          userId
        );
        performLogin(userId, id);
        // Request permission after login
        requestPermissionIfNeeded();
      });

      // Safety-net: after 10s, call login() optimistically even without a subscription ID
      setTimeout(() => {
        if (loginPendingRef.current !== userId) {
          return; // already handled
        }
        loginPendingRef.current = null;
        cancelWaitForSubRef.current?.();
        cancelWaitForSubRef.current = null;

        const { id: retryId, onesignalId: retryOnesignalId } =
          readSubscriptionState();
        const logLabel = retryId
          ? '(subscription now ready)'
          : '(optimistic — no subscription yet)';
        console.log(
          `[OneSignal] 10s safety-net firing for user: ${userId} ${logLabel}`
        );

        try {
          console.log(
            '[OneSignal] Calling OS.login() via 10s safety-net for user:',
            userId
          );
          OS.login(userId);
          loggedInUserRef.current = userId;
          setExternalUserId(userId);
          console.log(
            '[OneSignal] ✅ Safety-net OS.login() called for:',
            userId
          );
          applyUserTagsForUser(userId);

          const { token: retryToken } = readSubscriptionState();
          if (retryId && retryToken) {
            console.log(
              '[PushToken] safety-net — subscriptionId:',
              retryId,
              '| onesignalId:',
              retryOnesignalId,
              '| token: present'
            );
            attemptRegistration(retryId, retryToken, userId, 'safety-net', (result) => {
              setPushTokenDebugInfo(result);
            });
          } else if (retryId && !retryToken) {
            console.log(
              '[PushToken] safety-net — subscriptionId present but token null, post-login poll will handle registration'
            );
          }

          cancelPostLoginPollRef.current?.();
          cancelPostLoginPollRef.current = pollAndSavePlayerIdAfterLogin(
            userId,
            (newId) => {
              setPlayerId(newId);
              const { onesignalId: oid } = readSubscriptionState();
              if (oid) setOnesignalUserId(oid);
            }
          );

          // Request permission after safety-net login
          requestPermissionIfNeeded();
        } catch (e) {
          console.warn('[OneSignal] Safety-net OS.login() error:', e);
        }
      }, 10000);
      return;
    }

    // Subscription is ready — call login() immediately
    console.log(
      '[OneSignal] Subscription ready — subscriptionId:', currentId,
      '| onesignalId:', currentOnesignalId,
      '| token:', currentToken ? 'present' : 'null',
      '— calling OS.login() for:', userId
    );
    loginPendingRef.current = null;
    performLogin(userId, currentId);

    // Request permission after login (only if not already granted)
    requestPermissionIfNeeded();
  }, [isInitialized, isUserLoading, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── requestPermission ───────────────────────────────────────────────────
  // Shows the OS permission prompt. Uses `true` to force the prompt even if
  // the user previously dismissed it (iOS only — Android ignores this flag).
  const requestPermission = async (): Promise<boolean> => {
    if (!OS || Platform.OS === 'web') return false;
    console.log('[OneSignal] requestPermission() called by user action');
    try {
      // Pass `true` to force the permission prompt (required by audit spec)
      const granted = await OS.Notifications.requestPermission(true);
      console.log('[OneSignal] requestPermission result:', granted);
      setHasPermission(granted);

      if (granted) {
        try {
          OS.User.pushSubscription.optIn();
          console.log(
            '[OneSignal] optIn() called after user-triggered permission grant'
          );
        } catch (e) {
          console.warn('[OneSignal] optIn() error:', e);
        }

        const {
          id: immediateId,
          onesignalId: immediateOid,
          token: immediateToken,
        } = readSubscriptionState();

        if (immediateId && immediateToken) {
          setPlayerId(immediateId);
          if (immediateOid) setOnesignalUserId(immediateOid);
          setIsSubscribed(true);
          const userId = loggedInUserRef.current;
          if (userId) {
            console.log(
              '[PushToken] requestPermission — subscriptionId + token already available:',
              immediateId
            );
            attemptRegistration(
              immediateId,
              immediateToken,
              userId,
              'request-permission-immediate',
              (result) => {
                setPushTokenDebugInfo(result);
              }
            );
          } else {
            console.log(
              '[OneSignal] requestPermission — subscription ready but no user yet, deferring registration'
            );
          }
        } else {
          // Subscription ID or token not yet available — the pushSubscription change event
          // listener is the primary path. Start a safety-net poll as backup.
          console.log(
            '[OneSignal] requestPermission — subscription ID/token not yet available, change event will handle it',
            '| id:', immediateId, '| token:', immediateToken ? 'present' : 'null'
          );
          cancelWaitForSubRef.current?.();
          cancelWaitForSubRef.current = waitForSubscriptionId((newId, newToken) => {
            cancelWaitForSubRef.current = null;
            setPlayerId(newId);
            const { onesignalId: oid } = readSubscriptionState();
            if (oid) setOnesignalUserId(oid);
            setIsSubscribed(true);
            const userId = loggedInUserRef.current;
            if (userId) {
              console.log(
                '[PushToken] requestPermission safety-net poll — subscriptionId:',
                newId,
                '| onesignalId:',
                oid
              );
              attemptRegistration(
                newId,
                newToken,
                userId,
                'request-permission-safety-net',
                (result) => {
                  setPushTokenDebugInfo(result);
                }
              );
            } else {
              console.log(
                '[OneSignal] requestPermission safety-net — subscription ready but no user, deferring'
              );
            }
          });
        }
      } else {
        console.log(
          '[OneSignal] requestPermission — user denied permission. Degrading gracefully.'
        );
      }
      return granted;
    } catch (e) {
      console.warn('[OneSignal] requestPermission() error:', e);
      return false;
    }
  };

  // ─── requestPermissionIfNeeded ───────────────────────────────────────────
  // Call this after a successful login or registration. Skips the OS prompt if
  // the user already granted permission; still ensures optIn() is called so the
  // subscription ID is saved to the backend.
  const requestPermissionIfNeeded = async (): Promise<boolean> => {
    if (!OS || Platform.OS === 'web') return false;
    console.log('[OneSignal] requestPermissionIfNeeded() called');
    try {
      const alreadyGranted: boolean =
        OS.Notifications.hasPermission ?? false;
      console.log(
        '[OneSignal] requestPermissionIfNeeded — hasPermission:',
        alreadyGranted
      );

      if (alreadyGranted) {
        console.log(
          '[OneSignal] permission already granted — skipping prompt, ensuring optIn()'
        );
        setHasPermission(true);
        try {
          OS.User.pushSubscription.optIn();
        } catch (e) {
          console.warn(
            '[OneSignal] optIn() error in requestPermissionIfNeeded:',
            e
          );
        }
        // Ensure token is registered if subscription ID + token are already available
        const { id, onesignalId, token } = readSubscriptionState();
        if (id && token && loggedInUserRef.current) {
          console.log(
            '[OneSignal] requestPermissionIfNeeded — subscription + token already ready, re-registering'
          );
          if (onesignalId) setOnesignalUserId(onesignalId);
          setPlayerId(id);
          setIsSubscribed(true);
          attemptRegistration(
            id,
            token,
            loggedInUserRef.current,
            'permission-if-needed-already-granted',
            (result) => {
              setPushTokenDebugInfo(result);
            }
          );
        } else if (id && !token) {
          console.log(
            '[OneSignal] requestPermissionIfNeeded — subscriptionId present but token null, change event will handle registration'
          );
        }
        return true;
      }

      // Permission not yet granted — show the OS prompt
      console.log(
        '[OneSignal] requestPermissionIfNeeded — permission not granted, showing OS prompt'
      );
      return requestPermission();
    } catch (e) {
      console.warn('[OneSignal] requestPermissionIfNeeded() error:', e);
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
        requestPermissionIfNeeded,
      }}
    >
      {children}
    </OneSignalContext.Provider>
  );
}
