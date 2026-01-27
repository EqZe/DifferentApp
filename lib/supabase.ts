
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = 'https://pgrcmurwamszgjsdbgtq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncmNtdXJ3YW1zemdqc2RiZ3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTAxMTgsImV4cCI6MjA4NDA2NjExOH0.w0__VSxi7gxMcgd6q5ILlnCahGObfsC08qCiOpj4Vqg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Database types
export interface User {
  id: string;
  full_name: string;
  city: string;
  phone_number: string;
  has_signed_agreement: boolean;
  travel_date: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  button_text: string | null;
  button_link: string | null;
  is_pre_agreement: boolean;
  order_index: number;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  is_completed: boolean;
  reminder_sent: boolean;
  created_at: string;
}
