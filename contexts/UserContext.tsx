
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { api, type User } from '@/utils/api';
import { registerForPushNotificationsAsync } from '@/utils/notifications';

interface UserContextType {
  user: User | null;
  session: Session | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  registerPushNotifications: () => Promise<string | null>;
  isLoading: boolean;
  isRegisteringPush: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegisteringPush, setIsRegisteringPush] = useState(false);
  const hasAttemptedPushRegistration = useRef(false);

  const loadUserProfile = useCallback(async (authUserId: string) => {
    try {
      console.log('UserContext: Loading user profile for auth user', authUserId);
      const userData = await api.getUserByAuthId(authUserId);
      console.log('UserContext: ✅ User profile loaded -', userData.fullName, 'hasContract:', userData.hasContract);
      console.log('UserContext: Push token status:', userData.pushToken ? `exists (${userData.pushToken.substring(0, 20)}...)` : 'NULL or empty');
      setUserState(userData);
    } catch (error) {
      console.error('UserContext: ❌ Error loading user profile:', error);
      setUserState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerPushToken = async (authUserId: string): Promise<string | null> => {
    setIsRegisteringPush(true);
    try {
      console.log('👤 UserContext: Starting push notification token registration for user:', authUserId);
      const pushToken = await registerForPushNotificationsAsync();
      
      if (pushToken && pushToken.trim() !== '') {
        console.log('👤 UserContext: ✅ Push token obtained:', pushToken);
        
        try {
          console.log('👤 UserContext: Saving push token to database...');
          await api.savePushToken(authUserId, pushToken);
          console.log('👤 UserContext: ✅ Push token saved to database successfully');
          
          // Refresh user data to update the push_token in state
          console.log('👤 UserContext: Refreshing user data to confirm token save...');
          const freshUserData = await api.getUserByAuthId(authUserId);
          setUserState(freshUserData);
          console.log('👤 UserContext: ✅ User data refreshed, push_token now:', freshUserData.pushToken ? `exists (${freshUserData.pushToken.substring(0, 20)}...)` : 'NULL or empty');
          
          // Mark as successfully registered
          hasAttemptedPushRegistration.current = true;
          return pushToken;
        } catch (saveError: any) {
          console.log('👤 UserContext: ⚠️ Failed to save push token to database:', saveError?.message || saveError);
          // Don't mark as attempted if save failed - allow retry
          hasAttemptedPushRegistration.current = false;
          return null;
        }
      } else {
        console.log('👤 UserContext: ℹ️ No push token obtained or token is empty');
        console.log('👤 UserContext: ℹ️ Push notifications require a physical device');
        // Don't mark as attempted if no token - allow retry
        hasAttemptedPushRegistration.current = false;
        return null;
      }
    } catch (error: any) {
      console.log('👤 UserContext: ⚠️ Push notification setup failed:', error?.message || error);
      // Don't mark as attempted if error - allow retry
      hasAttemptedPushRegistration.current = false;
      return null;
    } finally {
      setIsRegisteringPush(false);
    }
  };

  // Expose registerPushNotifications so it can be called manually from UI
  const registerPushNotifications = useCallback(async (): Promise<string | null> => {
    if (!session?.user?.id) {
      console.log('👤 UserContext: Cannot register push notifications - no session');
      return null;
    }
    console.log('👤 UserContext: Manual push notification registration triggered by user');
    console.log('👤 UserContext: Resetting hasAttemptedPushRegistration flag to allow retry');
    hasAttemptedPushRegistration.current = false; // Allow retry
    return registerPushToken(session.user.id);
  }, [session]);

  // Separate effect for automatic push notification registration
  // This runs once when user data is loaded and push token is missing
  useEffect(() => {
    if (!user || !session?.user?.id) {
      return;
    }

    // Only attempt once per session (and only if previous attempt succeeded)
    if (hasAttemptedPushRegistration.current) {
      console.log('UserContext: 🔔 Push registration already attempted successfully this session, skipping');
      return;
    }

    // Check if push token is missing or empty
    const tokenIsMissing = !user.pushToken || user.pushToken.trim() === '';
    
    if (tokenIsMissing) {
      console.log('UserContext: 🔔 Push token is NULL/empty, will attempt automatic registration in 2 seconds...');
      console.log('UserContext: 🔔 Current push_token value:', user.pushToken === null ? 'null' : user.pushToken === '' ? 'empty string' : `"${user.pushToken}"`);
      
      const timeoutId = setTimeout(() => {
        console.log('UserContext: 🔔 Starting automatic push notification registration...');
        registerPushToken(session.user.id).catch(err => {
          console.log('UserContext: ⚠️ Automatic push token registration failed (non-critical):', err?.message || err);
          // This is expected to fail in simulators and Expo Go without proper setup
          // The user can manually register from the Profile screen if needed
        });
      }, 2000);

      return () => {
        console.log('UserContext: 🧹 Cleaning up push registration timeout');
        clearTimeout(timeoutId);
      };
    } else {
      console.log('UserContext: ✅ Push token already exists, skipping automatic registration');
      console.log('UserContext: ✅ Token preview:', user.pushToken.substring(0, 20) + '...');
    }
  }, [user, session]);

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
        // Reset the registration attempt flag on new sign-in
        hasAttemptedPushRegistration.current = false;
      } else if (_event === 'SIGNED_OUT') {
        console.log('UserContext: 🚪 User signed out');
        // Reset the registration attempt flag on sign-out
        hasAttemptedPushRegistration.current = false;
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
      console.log('UserContext: Push token status:', freshUserData.pushToken ? `exists (${freshUserData.pushToken.substring(0, 20)}...)` : 'NULL or empty');
      setUserState(freshUserData);
    } catch (error) {
      console.error('UserContext: ❌ Failed to refresh user data', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, session, setUser, refreshUser, registerPushNotifications, isLoading, isRegisteringPush }}>
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
