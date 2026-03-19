
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { api, type User } from '@/utils/api';
import { registerForPushNotificationsAsync } from '@/utils/notifications';

interface UserContextType {
  user: User | null;
  session: Session | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Track which user IDs we've already attempted push token registration for
  // so we don't spam the registration on every re-render / token refresh
  const pushRegisteredForRef = useRef<Set<string>>(new Set());

  /**
   * Register for Expo push notifications and persist the token to Supabase.
   * Called once per authenticated user per app session.
   * Non-fatal — errors are logged but never bubble up to break the auth flow.
   */
  const registerPushToken = useCallback(async (authUserId: string) => {
    // Skip on web — push notifications require a native device
    if (Platform.OS === 'web') return;
    // Skip if we already registered for this user in this session
    if (pushRegisteredForRef.current.has(authUserId)) {
      console.log('UserContext: Push token already registered for user in this session — skipping');
      return;
    }
    pushRegisteredForRef.current.add(authUserId);

    try {
      console.log('UserContext: ========== REGISTERING PUSH TOKEN ==========');
      console.log('UserContext: User ID:', authUserId);

      const token = await registerForPushNotificationsAsync();

      if (!token) {
        console.log('UserContext: ⚠️ No push token returned — skipping save');
        return;
      }

      console.log('UserContext: ✅ Push token obtained:', token.substring(0, 30) + '...');

      // 1. Save to users.push_token (used by edge functions to send notifications)
      await api.savePushToken(authUserId, token);
      console.log('UserContext: ✅ Push token saved to users table');

      // 2. Also upsert into user_push_tokens for a reliable audit trail
      //    This table has RLS: user_id = auth.uid()::text
      const { error: upsertError } = await supabase
        .from('user_push_tokens')
        .upsert(
          {
            user_id: authUserId,
            player_id: token, // reuse player_id column for the Expo token
            push_token: token,
            platform: Platform.OS,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (upsertError) {
        // Non-fatal — the primary save to users.push_token already succeeded
        console.warn('UserContext: ⚠️ user_push_tokens upsert failed (non-fatal):', upsertError.message, upsertError.code);
      } else {
        console.log('UserContext: ✅ Push token saved to user_push_tokens table');
      }

      console.log('UserContext: ========== PUSH TOKEN REGISTRATION COMPLETE ==========');
    } catch (err: any) {
      // Non-fatal — push notification registration failure must never break login
      console.warn('UserContext: ⚠️ Push token registration failed (non-fatal):', err?.message || err);
      // Remove from the set so we retry next time the user opens the app
      pushRegisteredForRef.current.delete(authUserId);
    }
  }, []);

  const loadUserProfile = useCallback(async (authUserId: string) => {
    try {
      console.log('UserContext: Loading user profile for auth user', authUserId);
      const userData = await api.getUserByAuthId(authUserId);
      console.log('UserContext: ✅ User profile loaded -', userData.fullName, 'hasContract:', userData.hasContract);
      setUserState(userData);

      // Register for push notifications after the profile is loaded.
      // We do this here (not in a separate effect) so it runs on every
      // sign-in AND on every cold-start where a session is restored.
      // registerPushToken is idempotent — it skips if already done this session.
      registerPushToken(authUserId);
    } catch (error) {
      console.error('UserContext: ❌ Error loading user profile:', error);
      setUserState(null);
    } finally {
      setIsLoading(false);
    }
  }, [registerPushToken]);

  useEffect(() => {
    console.log('UserContext: ========== INITIALIZING AUTH ==========');
    console.log('UserContext: Supabase URL:', supabase.supabaseUrl);
    console.log('UserContext: Auth flow type: PKCE');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('UserContext: ❌ Error getting initial session:', error.message);
        console.error('UserContext: Error details:', JSON.stringify(error, null, 2));
        setIsLoading(false);
        return;
      }

      console.log('UserContext: Initial session check', session ? '✅ session found' : 'ℹ️ no session');
      
      if (session) {
        console.log('UserContext: Session exists, user ID:', session.user.id);
        console.log('UserContext: Session expires at:', new Date(session.expires_at! * 1000).toLocaleString());
        console.log('UserContext: Access token present:', !!session.access_token);
        console.log('UserContext: Refresh token present:', !!session.refresh_token);
        setSession(session);
        loadUserProfile(session.user.id);
      } else {
        console.log('UserContext: No existing session found - user needs to login');
        setIsLoading(false);
      }
    }).catch((err) => {
      console.error('UserContext: ❌ Unexpected error in getSession:', err);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('UserContext: 🔄 Auth state changed -', _event, session ? 'session exists' : 'no session');
      
      if (_event === 'SIGNED_IN') {
        console.log('UserContext: ✅ User signed in successfully');
      } else if (_event === 'SIGNED_OUT') {
        console.log('UserContext: 🚪 User signed out');
      } else if (_event === 'TOKEN_REFRESHED') {
        console.log('UserContext: 🔄 Token refreshed successfully');
      } else if (_event === 'USER_UPDATED') {
        console.log('UserContext: 👤 User data updated');
      }
      
      if (session) {
        console.log('UserContext: New session for user:', session.user.id);
        console.log('UserContext: Session expires at:', new Date(session.expires_at! * 1000).toLocaleString());
      }
      
      setSession(session);
      
      if (session) {
        loadUserProfile(session.user.id);
      } else {
        console.log('UserContext: Session cleared, logging out user');
        setUserState(null);
        setIsLoading(false);
        // Clear push registration tracking on logout so the next login re-registers
        pushRegisteredForRef.current.clear();
      }
    });

    console.log('UserContext: ✅ Auth listener registered');

    return () => {
      console.log('UserContext: 🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const setUser = async (userData: User | null) => {
    console.log('UserContext: setUser called', userData ? userData.fullName : 'null');
    setUserState(userData);
  };

  const refreshUser = async () => {
    if (!session?.user?.id) {
      console.log('UserContext: refreshUser - No session to refresh');
      return;
    }

    try {
      console.log('UserContext: Refreshing user data from database');
      const freshUserData = await api.getUserByAuthId(session.user.id);
      console.log('UserContext: ✅ User data refreshed, hasContract:', freshUserData.hasContract);
      setUserState(freshUserData);
    } catch (error) {
      console.error('UserContext: ❌ Failed to refresh user data', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, session, setUser, refreshUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
