
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = 'https://pgrcmurwamszgjsdbgtq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncmNtdXJ3YW1zemdqc2RiZ3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTAxMTgsImV4cCI6MjA4NDA2NjExOH0.w0__VSxi7gxMcgd6q5ILlnCahGObfsC08qCiOpj4Vqg';

// Custom storage adapter for React Native
// Uses SecureStore on native platforms (iOS/Android) and AsyncStorage on web
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      if (Platform.OS === 'web') {
        // Use AsyncStorage for web
        const value = await AsyncStorage.getItem(key);
        console.log('Storage: Retrieved from AsyncStorage (web)', key, value ? 'found' : 'not found');
        return value;
      } else {
        // Use SecureStore for native
        const value = await SecureStore.getItemAsync(key);
        console.log('Storage: Retrieved from SecureStore (native)', key, value ? 'found' : 'not found');
        return value;
      }
    } catch (error) {
      console.error('Storage: Error getting item', key, error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (Platform.OS === 'web') {
        // Use AsyncStorage for web
        await AsyncStorage.setItem(key, value);
        console.log('Storage: Saved to AsyncStorage (web)', key);
      } else {
        // Use SecureStore for native
        await SecureStore.setItemAsync(key, value);
        console.log('Storage: Saved to SecureStore (native)', key);
      }
    } catch (error) {
      console.error('Storage: Error setting item', key, error);
    }
  },
  removeItem: async (key: string) => {
    try {
      if (Platform.OS === 'web') {
        // Use AsyncStorage for web
        await AsyncStorage.removeItem(key);
        console.log('Storage: Removed from AsyncStorage (web)', key);
      } else {
        // Use SecureStore for native
        await SecureStore.deleteItemAsync(key);
        console.log('Storage: Removed from SecureStore (native)', key);
      }
    } catch (error) {
      console.error('Storage: Error removing item', key, error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface User {
  auth_user_id: string;
  full_name: string;
  city: string;
  phone_number: string | null;
  email: string | null;
  has_contract: boolean;
  travel_date: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon_name: string;
  description: string | null;
  cover_image: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  cover_image: string | null;
  is_published: boolean;
  visibility: 'public' | 'contract_only';
  category: string; // Legacy field
  category_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostBlock {
  id: string;
  post_id: string;
  type: 'text' | 'image' | 'gallery' | 'html' | 'map';
  data: any; // JSONB data specific to block type
  order: number;
  created_at: string;
}

export interface Task {
  id: string;
  auth_user_id: string;
  task_metadata_id: string | null;
  status: 'YET' | 'PENDING' | 'DONE';
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskMetadata {
  id: string;
  title: string;
  description: string;
  due_date_offset_days: number;
  requires_pending: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
