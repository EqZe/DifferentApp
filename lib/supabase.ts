
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgrcmurwamszgjsdbgtq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncmNtdXJ3YW1zemdqc2RiZ3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0OTAxMTgsImV4cCI6MjA4NDA2NjExOH0.w0__VSxi7gxMcgd6q5ILlnCahGObfsC08qCiOpj4Vqg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Disable email confirmation for immediate access
    flowType: 'pkce',
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

export interface Post {
  id: string;
  title: string;
  cover_image: string | null;
  is_published: boolean;
  visibility: 'public' | 'contract_only';
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
  title: string;
  description: string | null;
  due_date: string | null;
  is_completed: boolean;
  reminder_sent: boolean;
  created_at: string;
}
