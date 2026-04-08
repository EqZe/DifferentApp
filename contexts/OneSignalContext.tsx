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
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
    OS = undefined; // mark as attempted so we never retry
    return;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-onesignal');
    OS = mod.OneSignal ?? mod.default ?? mod;
    LogLevel = mod.LogLevel;
  } catch (e) {
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
    return { id, onesignalId, optedIn, token };
  } catch (e) {
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
  if (!pushToken || pushToken.trim() === '') {
    return;
  }

  registerOneSignalPlayer(subscriptionId, authUserId, pushToken)
    .then((result) => {
      onResult(result);
    })
    .catch((_err: any) => {
      // registration failure is non-fatal
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
  maxMs = 30000,
  intervalMs = 1500
): () => void {
  let elapsed = 0;
  let lastSavedId: string | null = null;

  const timer = setInterval(() => {
    elapsed += intervalMs;
    try {
      const { id, token } = readSubscriptionState();

      // Only register when BOTH subscription ID and push token are available
      if (id && token && id !== lastSavedId) {
        lastSavedId = id;
        onIdFound(id);
        attemptRegistration(id, token, authUserId, 'post-login-poll', () => {});
      }
    } catch (e) {
      // non-fatal
    }

    if (elapsed >= maxMs) {
      clearInterval(timer);
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
  maxMs = 30000,
  intervalMs = 1500
): () => void {
  let elapsed = 0;

  const timer = setInterval(() => {
    elapsed += intervalMs;
    try {
      const { id, token } = readSubscriptionState();

      if (id && token) {
        clearInterval(timer);
        onReady(id, token);
        return;
      }
    } catch (e) {
      // non-fatal
    }

    if (elapsed >= maxMs) {
      clearInterval(timer);
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
  /** Buffers a token that arrived before the user was logged in */
  const pendingTokenRef = useRef<{ id: string; token: string } | null>(null);

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
      OS.login(userId);
      loggedInUserRef.current = userId;
      setExternalUserId(userId);

      // Flush any buffered token that arrived before login
      if (pendingTokenRef.current) {
        const { id: bufferedId, token: bufferedToken } = pendingTokenRef.current;
        pendingTokenRef.current = null;
        attemptRegistration(bufferedId, bufferedToken, userId, 'perform-login-buffered', (result) => {
          setPushTokenDebugInfo(result);
        });
      }

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
      if (loginToken) {
        attemptRegistration(subscriptionId, loginToken, userId, 'perform-login', (result) => {
          setPushTokenDebugInfo(result);
        });
      }

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
      // non-fatal
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
    } catch (e) {
      // non-fatal
    }

    if (currentUser?.email) {
      try {
        OS.User.addEmail(currentUser.email);
      } catch (e) {
        // non-fatal
      }
    }
  };

  // ─── Step 1: Initialize OneSignal on mount ───────────────────────────────
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!OS) return;
    if (initialized.current) return;
    initialized.current = true;

    try {
      if (LogLevel) {
        OS.Debug.setLogLevel(LogLevel.Verbose);
      }
      OS.initialize(APP_ID);
    } catch (e) {
      initialized.current = false;
      return;
    }

    setIsInitialized(true);

    // ── Foreground notification display handler ───────────────────────────
    try {
      OS.Notifications.addEventListener(
        'foregroundWillDisplay',
        (event: any) => {
          // Display the notification banner even while the app is open
          event?.preventDefault();
          event?.notification?.display();
        }
      );
    } catch (e) {
      // non-fatal
    }

    // ── Notification click / tap handler ─────────────────────────────────
    try {
      OS.Notifications.addEventListener('click', (event: any) => {
        const notification = event?.notification;
        const data = notification?.additionalData ?? {};

        // Navigate based on the notification payload.
        try {
          if (data.screen) {
            router.push(data.screen as any);
          } else if (data.postId) {
            router.push(`/post/${data.postId}` as any);
          } else if (data.taskId) {
            router.push('/(tabs)/tasks' as any);
          } else {
            router.push('/(tabs)' as any);
          }
        } catch (_navErr) {
          // non-fatal
        }
      });
    } catch (e) {
      // non-fatal
    }

    // ── Subscription change listener ──────────────────────────────────────
    try {
      OS.User.pushSubscription.addEventListener('change', (state: any) => {
        const id = state?.current?.id ?? null;
        const token = state?.current?.token ?? null;
        const onesignalId = OS?.User?.onesignalId ?? null;

        if (id) setPlayerId(id);
        if (onesignalId) setOnesignalUserId(onesignalId);
        setIsSubscribed(isTrulySubscribed(id, token));

        if (!id) return;

        // Case 1: Login was pending (user set before subscription was ready)
        if (loginPendingRef.current) {
          const pendingUserId = loginPendingRef.current;
          loginPendingRef.current = null;
          cancelWaitForSubRef.current?.();
          cancelWaitForSubRef.current = null;
          performLogin(pendingUserId, id);
          return;
        }

        // Case 2: User is already logged in — register the new/updated token.
        const currentUserId = loggedInUserRef.current;
        if (currentUserId) {
          if (token) {
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
        } else if (id && token) {
          // No user logged in yet — buffer the token so performLogin can flush it
          pendingTokenRef.current = { id, token };
        }
      });
    } catch (e) {
      // non-fatal
    }

    // ── Permission change listener ────────────────────────────────────────
    try {
      OS.Notifications.addEventListener(
        'permissionChange',
        (granted: boolean) => {
          setHasPermission(granted);
          if (granted) {
            try {
              OS.User.pushSubscription.optIn();
            } catch (e) {
              // non-fatal
            }

            const {
              id: immediateId,
              onesignalId: immediateOid,
              token: immediateToken,
            } = readSubscriptionState();
            if (immediateId && loggedInUserRef.current) {
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
            }
          }
        }
      );
    } catch (e) {
      // non-fatal
    }

    // ── Startup: sync current permission state (no prompt) ───────────────
    try {
      const alreadyGranted: boolean =
        OS.Notifications.hasPermission ?? false;
      setHasPermission(alreadyGranted);
    } catch (e) {
      // non-fatal
    }

    // ── Startup poll: read subscription state once it stabilises ─────────
    let pollCount = 0;
    const MAX_POLLS = 12; // 12 × 5s = 60s
    const pollInterval = setInterval(() => {
      pollCount += 1;
      const { id, onesignalId, optedIn, token } = readSubscriptionState();

      if (id) setPlayerId(id);
      if (onesignalId) setOnesignalUserId(onesignalId);
      if (isTrulySubscribed(id, token)) {
        setIsSubscribed(true);
      }

      // If a login was pending and we now have BOTH subscription ID and token, complete it
      if (id && token && loginPendingRef.current) {
        const pendingUserId = loginPendingRef.current;
        loginPendingRef.current = null;
        cancelWaitForSubRef.current?.();
        cancelWaitForSubRef.current = null;
        clearInterval(pollInterval);
        performLogin(pendingUserId, id);
        return;
      }

      if ((id && token) || pollCount >= MAX_POLLS) {
        clearInterval(pollInterval);
      }

      // suppress unused variable warning
      void optedIn;
    }, 5000);

    return () => {
      clearInterval(pollInterval);
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
        } catch (e) {
          // non-fatal
        }
      }
      return;
    }

    // Skip if we already called login() for this user in this session
    if (userId === loggedInUserRef.current) {
      // Startup re-registration: ensure the player ID is saved to user_push_tokens
      const { id: existingId, onesignalId, token: existingToken } = readSubscriptionState();

      if (existingId && existingToken) {
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
        cancelWaitForSubRef.current?.();
        cancelWaitForSubRef.current = waitForSubscriptionId((id, token) => {
          cancelWaitForSubRef.current = null;
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

      // suppress unused variable warning
      void onesignalId;

      // Also ensure permission is requested if not yet granted
      requestPermissionIfNeeded();
      return;
    }

    const {
      id: currentId,
      onesignalId: currentOnesignalId,
      token: currentToken,
    } = readSubscriptionState();

    if (!currentId) {
      // Subscription not ready yet — defer login until subscription ID arrives
      loginPendingRef.current = userId;

      cancelWaitForSubRef.current?.();
      cancelWaitForSubRef.current = waitForSubscriptionId((id, _token) => {
        cancelWaitForSubRef.current = null;
        if (loginPendingRef.current !== userId) {
          return;
        }
        loginPendingRef.current = null;
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

        const { id: retryId } = readSubscriptionState();

        try {
          OS.login(userId);
          loggedInUserRef.current = userId;
          setExternalUserId(userId);
          applyUserTagsForUser(userId);

          const { token: retryToken } = readSubscriptionState();
          if (retryId && retryToken) {
            attemptRegistration(retryId, retryToken, userId, 'safety-net', (result) => {
              setPushTokenDebugInfo(result);
            });
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
          // non-fatal
        }
      }, 10000);
      return;
    }

    // Subscription is ready — call login() immediately
    // suppress unused variable warning
    void currentOnesignalId;
    void currentToken;
    loginPendingRef.current = null;
    performLogin(userId, currentId);

    // Request permission after login (only if not already granted)
    requestPermissionIfNeeded();
  }, [isInitialized, isUserLoading, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── requestPermission ───────────────────────────────────────────────────
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!OS || Platform.OS === 'web') return false;
    console.log('[OneSignal] requestPermission() called by user action');
    try {
      const granted = await OS.Notifications.requestPermission(true);
      setHasPermission(granted);

      if (granted) {
        try {
          OS.User.pushSubscription.optIn();
        } catch (e) {
          // non-fatal
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
            attemptRegistration(
              immediateId,
              immediateToken,
              userId,
              'request-permission-immediate',
              (result) => {
                setPushTokenDebugInfo(result);
              }
            );
          }
        } else {
          cancelWaitForSubRef.current?.();
          cancelWaitForSubRef.current = waitForSubscriptionId((newId, newToken) => {
            cancelWaitForSubRef.current = null;
            setPlayerId(newId);
            const { onesignalId: oid } = readSubscriptionState();
            if (oid) setOnesignalUserId(oid);
            setIsSubscribed(true);
            const userId = loggedInUserRef.current;
            if (userId) {
              attemptRegistration(
                newId,
                newToken,
                userId,
                'request-permission-safety-net',
                (result) => {
                  setPushTokenDebugInfo(result);
                }
              );
            }
          });
        }
      }
      return granted;
    } catch (e) {
      return false;
    }
  }, []); // reads only refs and module-level vars — stable

  // ─── requestPermissionIfNeeded ───────────────────────────────────────────
  const requestPermissionIfNeeded = useCallback(async (): Promise<boolean> => {
    if (!OS || Platform.OS === 'web') return false;
    try {
      const alreadyGranted: boolean =
        OS.Notifications.hasPermission ?? false;

      if (alreadyGranted) {
        setHasPermission(true);
        try {
          OS.User.pushSubscription.optIn();
        } catch (e) {
          // non-fatal
        }
        const { id, onesignalId, token } = readSubscriptionState();
        if (id && token && loggedInUserRef.current) {
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
        }
        return true;
      }

      // Permission not yet granted — show the OS prompt
      return requestPermission();
    } catch (e) {
      return false;
    }
  }, [requestPermission]);

  const contextValue = useMemo<OneSignalContextType>(() => ({
    isInitialized,
    hasPermission,
    isSubscribed,
    playerId,
    onesignalUserId,
    externalUserId,
    pushTokenDebugInfo,
    requestPermission,
    requestPermissionIfNeeded,
  }), [
    isInitialized,
    hasPermission,
    isSubscribed,
    playerId,
    onesignalUserId,
    externalUserId,
    pushTokenDebugInfo,
    requestPermission,
    requestPermissionIfNeeded,
  ]);

  return (
    <OneSignalContext.Provider value={contextValue}>
      {children}
    </OneSignalContext.Provider>
  );
}
