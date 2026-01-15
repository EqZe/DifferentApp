
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

interface User {
  id: string;
  fullName: string;
  city: string;
  phoneNumber: string;
  hasSignedAgreement: boolean;
  travelDate: string | null;
  createdAt: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      console.log('Loading user from storage...');
      let userJson: string | null = null;
      
      // Use localStorage for web, SecureStore for native
      if (Platform.OS === 'web') {
        userJson = localStorage.getItem('user');
      } else {
        userJson = await SecureStore.getItemAsync('user');
      }
      
      if (userJson) {
        const userData = JSON.parse(userJson);
        console.log('User loaded:', userData.fullName);
        setUserState(userData);
      } else {
        console.log('No user found in storage');
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setUser = async (userData: User | null) => {
    try {
      if (userData) {
        console.log('Saving user to storage:', userData.fullName);
        
        // Use localStorage for web, SecureStore for native
        if (Platform.OS === 'web') {
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          await SecureStore.setItemAsync('user', JSON.stringify(userData));
        }
        
        setUserState(userData);
      } else {
        console.log('Clearing user from storage');
        
        // Use localStorage for web, SecureStore for native
        if (Platform.OS === 'web') {
          localStorage.removeItem('user');
        } else {
          await SecureStore.deleteItemAsync('user');
        }
        
        setUserState(null);
      }
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, isLoading }}>
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
