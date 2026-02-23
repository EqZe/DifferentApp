
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
  const hasAttemptedAutoRegistration = useRef(false);
  const autoRegistrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const registerPushToken = async (authUserId: string): Promise<string | null> => {
    if (isRegisteringPush) {
      console.log('UserContext: ⚠️ Registration already in progress, skipping...');
      return null;
    }

    setIsRegisteringPush(true);
    try {
      console.log('👤 UserContext: ========== STARTING PUSH TOKEN REGISTRATION ==========');
      console.log('👤 UserContext: User ID:', authUserId);
      
      const pushToken = await registerForPushNotificationsAsync();
      
      if (pushToken) {
        console.log('👤 UserContext: ✅ Push token obtained:', pushToken);
        
        try {
          await api.savePushToken(authUserId, pushToken);
          console.log('👤 UserContext: ✅ Push token saved to database successfully');
          
          // Refresh user data to update the push_token in state
          const freshUserData = await api.getUserByAuthId(authUserId);
          setUserState(freshUserData);
          console.log('👤 UserContext: ✅ User data refreshed, push_token now:', freshUserData.pushToken ? 'exists' : 'NULL');
          
          return pushToken;
        } catch (saveError: any) {
          console.log('👤 UserContext: ⚠️ Failed to save push token to database:', saveError?.message || saveError);
          throw new Error('שגיאה בשמירת טוקן התראות למסד הנתונים: ' + (saveError?.message || 'Unknown error'));
        }
      } else {
        console.log('👤 UserContext: ℹ️ No push token obtained (returned null)');
        console.log('👤 UserContext: ℹ️ This is expected in development/simulator or if permissions were denied');
        throw new Error('לא התקבל טוקן התראות. ודא שהאפליקציה רצה על מכשיר פיזי ושניתנו הרשאות.');
      }
    } catch (error: any) {
      console.log('👤 UserContext: ⚠️ Push notification setup failed:', error?.message || error);
      console.log('👤 UserContext: Full error:', JSON.stringify(error, null, 2));
      // Re-throw the error so the UI can display it
      throw error;
    } finally {
      setIsRegisteringPush(false);
      console.log('👤 UserContext: ========== PUSH TOKEN REGISTRATION COMPLETE ==========');
    }
  };

  // Expose registerPushNotifications so it can be called manually from UI
  const registerPushNotifications = useCallback(async (): Promise<string | null> => {
    if (!session?.user?.id) {
      console.log('👤 UserContext: Cannot register push notifications - no session');
      throw new Error('אין חיבור פעיל. אנא התחבר מחדש.');
    }
    console.log('👤 UserContext: Manual push notification registration triggered by user');
    return registerPushToken(session.user.id);
  }, [session?.user?.id, isRegisteringPush]);

  const loadUserProfile = useCallback(async (authUserId: string) => {
    try {
      console.log('UserContext: Loading user profile for auth user', authUserId);
      const userData = await api.getUserByAuthId(authUserId);
      console.log('UserContext: ✅ User profile loaded -', userData.fullName, 'hasContract:', userData.hasContract);
      console.log('UserContext: Push token status:', userData.pushToken ? 'exists' : 'NULL');
      setUserState(userData);

      // Trigger automatic registration if no push token
      if (!userData.pushToken && !hasAttemptedAutoRegistration.current && !isRegisteringPush) {
        console.log('UserContext: 🔔 User has no push token, scheduling automatic registration in 3 seconds...');
        hasAttemptedAutoRegistration.current = true;

        // Clear any existing timeout
        if (autoRegistrationTimeoutRef.current) {
          clearTimeout(autoRegistrationTimeoutRef.current);
        }

        // Schedule automatic registration
        autoRegistrationTimeoutRef.current = setTimeout(() => {
          console.log('UserContext: 🔔 Executing automatic push token registration...');
          registerPushToken(authUserId).catch(err => {
            console.log('UserContext: ⚠️ Automatic push token registration failed (non-critical):', err?.message || err);
            // Don't reset hasAttemptedAutoRegistration - user can manually retry from profile screen
          });
        }, 3000); // 3 second delay
      } else if (userData.pushToken) {
        console.log('UserContext: ✅ User already has push token, skipping automatic registration');
        hasAttemptedAutoRegistration.current = false; // Reset for next login
      }
    } catch (error) {
      console.error('UserContext: ❌ Error loading user profile:', error);
      setUserState(null);
    } finally {
      setIsLoading(false);
    }
  }, [isRegisteringPush]);

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
        // Reset auto-registration flag on new login
        hasAttemptedAutoRegistration.current = false;
      }
      
      setSession(session);
      
      if (session) {
        loadUserProfile(session.user.id);
      } else {
        console.log('UserContext: Session cleared, logging out user');
        setUserState(null);
        setIsLoading(false);
        hasAttemptedAutoRegistration.current = false;
        
        // Clear any pending auto-registration timeout
        if (autoRegistrationTimeoutRef.current) {
          clearTimeout(autoRegistrationTimeoutRef.current);
          autoRegistrationTimeoutRef.current = null;
        }
      }
    });

    return () => {
      console.log('UserContext: Cleaning up auth subscription');
      subscription.unsubscribe();
      
      // Clear timeout on unmount
      if (autoRegistrationTimeoutRef.current) {
        clearTimeout(autoRegistrationTimeoutRef.current);
        autoRegistrationTimeoutRef.current = null;
      }
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
      console.log('UserContext: Push token status:', freshUserData.pushToken ? 'exists' : 'NULL');
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
