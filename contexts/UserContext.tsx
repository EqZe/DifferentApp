
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserProfile = useCallback(async (authUserId: string) => {
    try {
      console.log('UserContext: Loading user profile for auth user', authUserId);
      const userData = await api.getUserByAuthId(authUserId);
      console.log('UserContext: ✅ User profile loaded -', userData.fullName, 'hasContract:', userData.hasContract);
      setUserState(userData);

      // Register for push notifications after successful login (non-blocking)
      // Use setTimeout to ensure this doesn't block the UI
      setTimeout(() => {
        registerPushToken(authUserId).catch(err => {
          console.log('UserContext: Push token registration failed (non-critical):', err?.message || err);
        });
      }, 1000);
    } catch (error) {
      console.error('UserContext: ❌ Error loading user profile:', error);
      setUserState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerPushToken = async (authUserId: string): Promise<string | null> => {
    try {
      console.log('👤 UserContext: Starting push notification token registration for user:', authUserId);
      const pushToken = await registerForPushNotificationsAsync();
      
      if (pushToken) {
        console.log('👤 UserContext: ✅ Push token obtained:', pushToken);
        
        try {
          await api.savePushToken(authUserId, pushToken);
          console.log('👤 UserContext: ✅ Push token saved to database');
          return pushToken;
        } catch (saveError: any) {
          console.log('👤 UserContext: ⚠️ Failed to save push token:', saveError?.message || saveError);
          return null;
        }
      } else {
        console.log('👤 UserContext: ℹ️ No push token obtained (expected in development/simulator)');
        return null;
      }
    } catch (error: any) {
      console.log('👤 UserContext: ⚠️ Push notification setup failed:', error?.message || error);
      // This is non-critical - app continues to work without push notifications
      return null;
    }
  };

  // Expose registerPushNotifications so it can be called manually from UI
  const registerPushNotifications = useCallback(async (): Promise<string | null> => {
    if (!session?.user?.id) {
      console.log('👤 UserContext: Cannot register push notifications - no session');
      return null;
    }
    console.log('👤 UserContext: Manual push notification registration triggered');
    return registerPushToken(session.user.id);
  }, [session]);

  useEffect(() => {
    console.log('UserContext: Initializing Supabase Auth session');
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('UserContext: Error getting initial session', error);
        setIsLoading(false);
        return;
      }

      console.log('UserContext: Initial session check', session ? 'session found' : 'no session');
      
      if (session) {
        console.log('UserContext: Session exists, user ID:', session.user.id);
        console.log('UserContext: Session expires at:', new Date(session.expires_at! * 1000).toLocaleString());
        setSession(session);
        loadUserProfile(session.user.id);
      } else {
        console.log('UserContext: No existing session found');
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('UserContext: Auth state changed -', _event, session ? 'session exists' : 'no session');
      
      if (session) {
        console.log('UserContext: New session for user:', session.user.id);
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

    return () => {
      console.log('UserContext: Cleaning up auth subscription');
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
    <UserContext.Provider value={{ user, session, setUser, refreshUser, registerPushNotifications, isLoading }}>
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
