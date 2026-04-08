/**
 * OneSignal Push Notification Context — Native (iOS / Android)
 *
 * Thin bridge over OneSignalContext. The rest of the app uses
 * <NotificationProvider> / useNotifications() without knowing about OneSignal.
 *
 * IMPORTANT: OneSignal is initialised ONLY inside OneSignalContext.
 * This file must NOT call OneSignal.initialize() — double-init corrupts the
 * subscription state and prevents the player ID from being saved to Supabase.
 *
 * Token saving flow:
 *   1. User presses "Allow" → OneSignalContext permissionChange listener fires
 *   2. OneSignalContext calls optIn() then waits for pushSubscription change event
 *   3. pushSubscription change event fires with the subscription ID
 *   4. OneSignalContext calls registerOneSignalPlayer(subscriptionId, authUserId)
 *   5. registerOneSignalPlayer upserts the row into user_push_tokens in Supabase
 *
 * Provider nesting in _layout.tsx (order matters):
 *   <OneSignalProvider>          ← initialises OneSignal, owns all token state
 *     <NotificationProvider>     ← reads OneSignal state, exposes useNotifications()
 *       ...app screens...
 *     </NotificationProvider>
 *   </OneSignalProvider>
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { Platform } from "react-native";
import { useOneSignal } from "./OneSignalContext";

const isWeb = Platform.OS === "web";

interface NotificationContextType {
  /** Whether the user has granted notification permission */
  hasPermission: boolean;
  /** Whether OneSignal is initialised but permission was not granted */
  permissionDenied: boolean;
  /** True while OneSignal is still initialising */
  loading: boolean;
  /** Always false on native */
  isWeb: boolean;
  /** Request notification permission — delegates to OneSignalContext */
  requestPermission: () => Promise<boolean>;
  /** Set a OneSignal tag (no-op here; tags are managed by OneSignalContext) */
  sendTag: (key: string, value: string) => void;
  /** Remove a OneSignal tag (no-op here) */
  deleteTag: (key: string) => void;
  /** Last received notification payload (not wired — always null) */
  lastNotification: Record<string, unknown> | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

interface NotificationProviderProps {
  children: ReactNode;
}

/**
 * Must be rendered INSIDE <OneSignalProvider> so that useOneSignal() works.
 * See _layout.tsx for the correct nesting order.
 */
export function NotificationProvider({ children }: NotificationProviderProps) {
  // useOneSignal() is safe here because OneSignalProvider is an ancestor.
  // On web, OneSignalProvider returns safe defaults (isInitialized=false, etc.).
  const oneSignal = useOneSignal();

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (isWeb) return false;
    console.log('[NotificationContext] requestPermission() called');
    return oneSignal.requestPermission();
  }, [oneSignal.requestPermission]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tags are managed centrally by OneSignalContext.applyUserTagsForUser().
  // Exposing sendTag/deleteTag as no-ops prevents double-tagging.
  const sendTag = useCallback((_key: string, _value: string) => {
    // no-op — managed by OneSignalContext
  }, []);

  const deleteTag = useCallback((_key: string) => {
    // no-op — tag removal handled by OneSignalContext on logout
  }, []);

  const value = useMemo<NotificationContextType>(() => ({
    hasPermission: oneSignal.hasPermission,
    permissionDenied: oneSignal.isInitialized && !oneSignal.hasPermission,
    loading: !oneSignal.isInitialized,
    isWeb,
    requestPermission,
    sendTag,
    deleteTag,
    lastNotification: null,
  }), [
    oneSignal.hasPermission,
    oneSignal.isInitialized,
    requestPermission,
    sendTag,
    deleteTag,
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to access notification state and methods.
 *
 * @example
 * const { hasPermission, requestPermission } = useNotifications();
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within NotificationProvider"
    );
  }
  return context;
}
