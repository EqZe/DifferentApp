
import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { api, type User } from '@/utils/api';

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

  const loadUserProfile = useCallback(async (authUserId: string) => {
    try {
      const userData = await api.getUserByAuthId(authUserId);
      setUserState(userData);
    } catch (error) {
      setUserState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setIsLoading(false);
        return;
      }

      if (session) {
        setSession(session);
        loadUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    }).catch(() => {
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);

      if (session) {
        loadUserProfile(session.user.id);
      } else {
        setUserState(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const setUser = useCallback((userData: User | null) => {
    setUserState(userData);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!session?.user?.id) {
      return;
    }

    try {
      const freshUserData = await api.getUserByAuthId(session.user.id);
      setUserState(freshUserData);
    } catch (error) {
      // silently fail — caller can handle if needed
    }
  }, [session?.user?.id]);

  const contextValue = useMemo<UserContextType>(() => ({
    user,
    session,
    setUser,
    refreshUser,
    isLoading,
  }), [user, session, setUser, refreshUser, isLoading]);

  return (
    <UserContext.Provider value={contextValue}>
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
