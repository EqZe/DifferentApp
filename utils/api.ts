
import { supabase } from '@/lib/supabase';
import type { User, Post, PostBlock, Task } from '@/lib/supabase';

// Helper function to convert snake_case to camelCase for frontend compatibility
function toCamelCase<T extends Record<string, any>>(obj: T): any {
  if (!obj) return obj;
  
  const camelCaseObj: any = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    camelCaseObj[camelKey] = obj[key];
  }
  return camelCaseObj;
}

// Helper function to convert camelCase to snake_case for database
function toSnakeCase<T extends Record<string, any>>(obj: T): any {
  if (!obj) return obj;
  
  const snakeCaseObj: any = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    snakeCaseObj[snakeKey] = obj[key];
  }
  return snakeCaseObj;
}

// Frontend-compatible interfaces (camelCase)
export interface UserFrontend {
  id: string;
  fullName: string;
  city: string;
  phoneNumber: string;
  hasSignedAgreement: boolean;
  hasContract: boolean;
  travelDate: string | null;
  createdAt: string;
}

export interface PostBlockFrontend {
  id: string;
  postId: string;
  type: 'text' | 'image' | 'gallery' | 'html' | 'map';
  data: any;
  order: number;
  createdAt: string;
}

export interface PostFrontend {
  id: string;
  title: string;
  coverImage: string | null;
  isPublished: boolean;
  visibility: 'public' | 'contract_only';
  createdAt: string;
  updatedAt: string;
  blocks?: PostBlockFrontend[];
}

export interface TaskFrontend {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  isCompleted: boolean;
  reminderSent: boolean;
  createdAt: string;
}

export const api = {
  // User endpoints
  register: async (fullName: string, city: string, phoneNumber: string): Promise<UserFrontend> => {
    console.log('API: Registering user', { fullName, city, phoneNumber });
    
    const { data, error } = await supabase
      .from('users')
      .insert({
        full_name: fullName,
        city,
        phone_number: phoneNumber,
      })
      .select()
      .single();

    if (error) {
      console.error('API: Registration failed', error);
      throw new Error(error.message || 'Registration failed');
    }

    console.log('API: Registration successful', data);
    return toCamelCase(data);
  },

  getUserByPhone: async (phoneNumber: string): Promise<UserFrontend | null> => {
    console.log('API: Getting user by phone', phoneNumber);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        console.log('API: User not found with phone', phoneNumber);
        return null;
      }
      console.error('API: Get user failed', error);
      throw new Error(error.message || 'Failed to get user');
    }

    console.log('API: User retrieved', data);
    return toCamelCase(data);
  },

  getUserById: async (userId: string): Promise<UserFrontend> => {
    console.log('API: Getting user by ID', userId);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('API: Get user failed', error);
      throw new Error(error.message || 'Failed to get user');
    }

    console.log('API: User retrieved', data);
    return toCamelCase(data);
  },

  updateUser: async (
    userId: string,
    updates: { hasSignedAgreement?: boolean; travelDate?: string | null }
  ): Promise<UserFrontend> => {
    console.log('API: Updating user', { userId, updates });
    
    const updateData: any = {};
    if (updates.hasSignedAgreement !== undefined) {
      updateData.has_signed_agreement = updates.hasSignedAgreement;
    }
    if (updates.travelDate !== undefined) {
      updateData.travel_date = updates.travelDate;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('API: Update user failed', error);
      throw new Error(error.message || 'Failed to update user');
    }

    console.log('API: User updated', data);
    return toCamelCase(data);
  },

  // Posts endpoints
  getPosts: async (hasContract?: boolean): Promise<PostFrontend[]> => {
    console.log('API: Getting posts', { hasContract });
    
    // Fetch all published posts
    // RLS policies will automatically filter based on user's contract status
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('API: Get posts failed', error);
      throw new Error(error.message || 'Failed to get posts');
    }

    console.log('API: Posts retrieved', data?.length || 0);
    return data?.map(toCamelCase) || [];
  },

  getPostById: async (postId: string): Promise<PostFrontend | null> => {
    console.log('API: Getting post by ID', postId);
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .eq('is_published', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('API: Post not found', postId);
        return null;
      }
      console.error('API: Get post failed', error);
      throw new Error(error.message || 'Failed to get post');
    }

    console.log('API: Post retrieved', data);
    return toCamelCase(data);
  },

  getPostBlocks: async (postId: string): Promise<PostBlockFrontend[]> => {
    console.log('API: Getting post blocks', postId);
    
    const { data, error } = await supabase
      .from('post_blocks')
      .select('*')
      .eq('post_id', postId)
      .order('order', { ascending: true });

    if (error) {
      console.error('API: Get post blocks failed', error);
      throw new Error(error.message || 'Failed to get post blocks');
    }

    console.log('API: Post blocks retrieved', data?.length || 0);
    return data?.map(toCamelCase) || [];
  },

  getPostWithBlocks: async (postId: string): Promise<PostFrontend | null> => {
    console.log('API: Getting post with blocks', postId);
    
    const post = await api.getPostById(postId);
    if (!post) {
      return null;
    }

    const blocks = await api.getPostBlocks(postId);
    return {
      ...post,
      blocks,
    };
  },

  // Tasks endpoints
  getTasks: async (userId: string): Promise<TaskFrontend[]> => {
    console.log('API: Getting tasks for user', userId);
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('API: Get tasks failed', error);
      throw new Error(error.message || 'Failed to get tasks');
    }

    console.log('API: Tasks retrieved', data?.length || 0);
    return data?.map(toCamelCase) || [];
  },

  createTask: async (
    userId: string,
    task: { title: string; description?: string | null; dueDate: string }
  ): Promise<TaskFrontend> => {
    console.log('API: Creating task', { userId, task });
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: userId,
        title: task.title,
        description: task.description || null,
        due_date: task.dueDate,
      })
      .select()
      .single();

    if (error) {
      console.error('API: Create task failed', error);
      throw new Error(error.message || 'Failed to create task');
    }

    console.log('API: Task created', data);
    return toCamelCase(data);
  },

  completeTask: async (taskId: string): Promise<TaskFrontend> => {
    console.log('API: Completing task', taskId);
    
    const { data, error } = await supabase
      .from('tasks')
      .update({ is_completed: true })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('API: Complete task failed', error);
      throw new Error(error.message || 'Failed to complete task');
    }

    console.log('API: Task completed', data);
    return toCamelCase(data);
  },

  updateTaskReminder: async (taskId: string, reminderSent: boolean): Promise<TaskFrontend> => {
    console.log('API: Updating task reminder', { taskId, reminderSent });
    
    const { data, error } = await supabase
      .from('tasks')
      .update({ reminder_sent: reminderSent })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error('API: Update task reminder failed', error);
      throw new Error(error.message || 'Failed to update task reminder');
    }

    console.log('API: Task reminder updated', data);
    return toCamelCase(data);
  },

  deleteTask: async (taskId: string): Promise<void> => {
    console.log('API: Deleting task', taskId);
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('API: Delete task failed', error);
      throw new Error(error.message || 'Failed to delete task');
    }

    console.log('API: Task deleted');
  },
};

// Export types for use in components
export type { 
  UserFrontend as User, 
  PostFrontend as Post, 
  PostBlockFrontend as PostBlock,
  TaskFrontend as Task 
};
