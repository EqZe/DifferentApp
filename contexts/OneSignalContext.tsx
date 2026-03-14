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

function readPushSubscriptionState(): { id: string | null; optedIn: boolean; token: string | null } {
  try {
    const id = OS.User.pushSubscription.id ?? null;
    const optedIn = OS.User.pushSubscription.optedIn ?? false;
    const token = OS.User.pushSubscription.token ?? null;
    return { id, optedIn, token };
  } catch {
    return { id: null, optedIn: false, token: null };
  }
}

export function OneSignalProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isUserLoading } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [externalUserId, setExternalUserId] = useState<string | null>(null);
  const initialized = useRef(false);
  const playerIdRef = useRef<string | null>(null);

  // Keep ref in sync so interval callbacks can read latest value without stale closure
  useEffect(() => {
    playerIdRef.current = playerId;
  }, [playerId]);

  // Initialize once on mount
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!OS) return;
    if (initialized.current) return;
    initialized.current = true;

    try {
      if (LogLevel) OS.Debug.setLogLevel(LogLevel.Verbose);
      OS.initialize(APP_ID);
      console.log('OneSignal: initialized with', APP_ID);
    } catch (e) {
      console.warn('OneSignal: initialize error', e);
      initialized.current = false;
      return;
    }

    // Listen for permission changes
    try {
      OS.Notifications.addEventListener('permissionChange', (granted: boolean) => {
        console.log('OneSignal: permissionChange ->', granted);
        setHasPermission(granted);
        if (granted) {
          try { OS.User.pushSubscription.optIn(); } catch {}
        }
      });
    } catch {}

    // Listen for subscription changes
    try {
      OS.User.pushSubscription.addEventListener('change', (state: any) => {
        const id = state?.current?.id ?? null;
        const optedIn = state?.current?.optedIn ?? false;
        console.log('OneSignal: subscription change — id:', id, 'optedIn:', optedIn);
        if (id) {
          setPlayerId(id);
          playerIdRef.current = id;
        }
        setIsSubscribed(optedIn);
      });
    } catch {}

    setIsInitialized(true);

    // Periodic poll for the first 30 seconds (every 5s, up to 6 times)
    // Catches registration on Android when change events don't fire
    let pollCount = 0;
    const pollInterval = setInterval(() => {
      pollCount += 1;
      const { id, optedIn } = readPushSubscriptionState();
      console.log(`OneSignal: poll #${pollCount} — id: ${id}, optedIn: ${optedIn}`);
      if (id) {
        setPlayerId(id);
        playerIdRef.current = id;
      }
      if (optedIn) setIsSubscribed(true);
      if (id || pollCount >= 6) {
        clearInterval(pollInterval);
      }
    }, 5000);

    // Auto-request permission
    (async () => {
      try {
        const granted = await OS.Notifications.requestPermission(true);
        console.log('OneSignal: requestPermission result ->', granted);
        setHasPermission(granted);
        if (granted) {
          try { OS.User.pushSubscription.optIn(); } catch {}

          // Poll after 3s — change event is unreliable on Android
          setTimeout(() => {
            const { id, optedIn, token } = readPushSubscriptionState();
            console.log('OneSignal: post-permission poll — id:', id, 'optedIn:', optedIn, 'token:', token);
            if (id) {
              setPlayerId(id);
              playerIdRef.current = id;
            }
            if (optedIn) setIsSubscribed(true);
          }, 3000);
        }
      } catch (e) {
        console.warn('OneSignal: requestPermission error', e);
      }
    })();

    return () => clearInterval(pollInterval);
  }, []);

  // Login/logout when user changes
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
          console.log('OneSignal: logged out');
        } catch (e) {
          console.warn('OneSignal: logout error', e);
        }
      }
      return;
    }

    if (userId === externalUserId) return;

    try {
      OS.login(userId);
      setExternalUserId(userId);
      console.log('OneSignal: login ->', userId);

      // Ensure opted in after login
      try { OS.User.pushSubscription.optIn(); } catch {}

      // Poll after 2s — change event is unreliable on Android after login
      setTimeout(() => {
        const { id, optedIn, token } = readPushSubscriptionState();
        console.log('OneSignal: post-login poll — id:', id, 'optedIn:', optedIn, 'token:', token);
        if (id) {
          setPlayerId(id);
          playerIdRef.current = id;
        }
        if (optedIn) setIsSubscribed(true);
      }, 2000);

      // Set tags
      try {
        OS.User.addTags({
          user_id: userId,
          full_name: user?.fullName ?? '',
          email: user?.email ?? '',
        });
      } catch {}

      if (user?.email) {
        try { OS.User.addEmail(user.email); } catch {}
      }
    } catch (e) {
      console.warn('OneSignal: login error', e);
    }
  }, [isInitialized, isUserLoading, user?.id]);

  const requestPermission = async (): Promise<boolean> => {
    if (!OS || Platform.OS === 'web') return false;
    console.log('OneSignal: requestPermission called');
    try {
      const granted = await OS.Notifications.requestPermission(true);
      console.log('OneSignal: requestPermission result ->', granted);
      setHasPermission(granted);
      if (granted) {
        try { OS.User.pushSubscription.optIn(); } catch {}

        // Poll after 3s — change event is unreliable on Android
        setTimeout(() => {
          const { id, optedIn, token } = readPushSubscriptionState();
          console.log('OneSignal: post-requestPermission poll — id:', id, 'optedIn:', optedIn, 'token:', token);
          if (id) {
            setPlayerId(id);
            playerIdRef.current = id;
          }
          if (optedIn) setIsSubscribed(true);
        }, 3000);
      }
      return granted;
    } catch {
      return false;
    }
  };

  return (
    <OneSignalContext.Provider value={{ isInitialized, hasPermission, isSubscribed, playerId, externalUserId, requestPermission }}>
      {children}
    </OneSignalContext.Provider>
  );
}
