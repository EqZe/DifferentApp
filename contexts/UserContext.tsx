
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  }, []);

  const loadUserProfile = async (authUserId: string) => {
    try {
      console.log('UserContext: Loading user profile for auth user', authUserId);
      const userData = await api.getUserByAuthId(authUserId);
      console.log('UserContext: User profile loaded successfully -', userData.fullName, 'hasContract:', userData.hasContract);
      console.log('UserContext: Current push token in database:', userData.pushToken || 'none');
      setUserState(userData);

      // Register for push notifications after successful login
      registerPushToken(authUserId);
    } catch (error) {
      console.error('UserContext: Error loading user profile:', error);
      setUserState(null);
    } finally {
      setIsLoading(false);
    }
  };

  const registerPushToken = async (authUserId: string) => {
    try {
      console.log('UserContext: Starting push notification token registration');
      const pushToken = await registerForPushNotificationsAsync();
      
      if (pushToken) {
        console.log('UserContext: Push token obtained successfully:', pushToken);
        console.log('UserContext: Saving push token to database for user:', authUserId);
        
        try {
          await api.savePushToken(authUserId, pushToken);
          console.log('UserContext: ✅ Push token saved successfully to database');
          
          // Verify it was saved by fetching the user again
          const updatedUser = await api.getUserByAuthId(authUserId);
          console.log('UserContext: Verification - push token in database:', updatedUser.pushToken || 'FAILED TO SAVE');
          
          if (updatedUser.pushToken === pushToken) {
            console.log('UserContext: ✅ Push token verification successful');
          } else {
            console.error('UserContext: ❌ Push token verification failed - token mismatch');
          }
        } catch (saveError) {
          console.error('UserContext: ❌ Failed to save push token to database:', saveError);
          if (saveError instanceof Error) {
            console.error('UserContext: Error details:', saveError.message);
          }
        }
      } else {
        console.log('UserContext: Could not obtain push token (simulator, permission denied, or configuration issue)');
      }
    } catch (error) {
      console.error('UserContext: Error in push token registration flow:', error);
      if (error instanceof Error) {
        console.error('UserContext: Error details:', error.message);
      }
    }
  };

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
      console.log('UserContext: User data refreshed successfully, hasContract:', freshUserData.hasContract);
      console.log('UserContext: Push token after refresh:', freshUserData.pushToken || 'none');
      setUserState(freshUserData);
    } catch (error) {
      console.error('UserContext: Failed to refresh user data', error);
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
