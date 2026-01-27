
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
  id: string; // This is auth_user_id
  fullName: string;
  city: string;
  phoneNumber: string | null;
  email: string | null;
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
  userId: string; // This is auth_user_id
  title: string;
  description: string | null;
  dueDate: string | null;
  isCompleted: boolean;
  reminderSent: boolean;
  createdAt: string;
}

export const api = {
  // Auth endpoints
  signUp: async (email: string, password: string, fullName: string, city: string, phoneNumber?: string): Promise<UserFrontend> => {
    console.log('API: Signing up user', { email, fullName, city });
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      console.error('API: Sign up failed', authError);
      throw new Error(authError.message || 'Sign up failed');
    }

    if (!authData.user) {
      throw new Error('No user returned from sign up');
    }

    console.log('API: Sign up successful, creating user profile in database');
    
    // Create the user profile in the users table
    const { data: userData, error: insertError } = await supabase
      .from('users')
      .insert({
        auth_user_id: authData.user.id,
        full_name: fullName,
        city,
        phone_number: phoneNumber || null,
        email: email,
        has_contract: false,
        travel_date: null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('API: Failed to create user profile', insertError);
      throw new Error(insertError.message || 'Failed to create user profile');
    }

    console.log('API: User profile created successfully', userData);
    
    const camelData = toCamelCase(userData);
    return {
      ...camelData,
      id: camelData.authUserId,
    };
  },

  signIn: async (email: string, password: string): Promise<UserFrontend> => {
    console.log('API: Signing in user', email);
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.error('API: Sign in failed', authError);
      throw new Error(authError.message || 'Sign in failed');
    }

    if (!authData.user) {
      throw new Error('No user returned from sign in');
    }

    console.log('API: Sign in successful, fetching user profile');
    const userData = await api.getUserByAuthId(authData.user.id);
    return userData;
  },

  signOut: async (): Promise<void> => {
    console.log('API: Signing out user');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('API: Sign out failed', error);
      throw new Error(error.message || 'Sign out failed');
    }
    console.log('API: Sign out successful');
  },

  // User endpoints
  getUserByAuthId: async (authUserId: string): Promise<UserFrontend> => {
    console.log('API: Getting user by auth ID', authUserId);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();

    if (error) {
      console.error('API: Get user failed', error);
      throw new Error(error.message || 'Failed to get user');
    }

    console.log('API: User retrieved', data);
    const camelData = toCamelCase(data);
    // Map auth_user_id to id for frontend compatibility
    return {
      ...camelData,
      id: camelData.authUserId,
    };
  },

  updateUser: async (
    authUserId: string,
    updates: { hasContract?: boolean; travelDate?: string | null; fullName?: string; city?: string; phoneNumber?: string }
  ): Promise<UserFrontend> => {
    console.log('API: Updating user', { authUserId, updates });
    
    const updateData: any = {};
    if (updates.hasContract !== undefined) {
      updateData.has_contract = updates.hasContract;
    }
    if (updates.travelDate !== undefined) {
      updateData.travel_date = updates.travelDate;
    }
    if (updates.fullName !== undefined) {
      updateData.full_name = updates.fullName;
    }
    if (updates.city !== undefined) {
      updateData.city = updates.city;
    }
    if (updates.phoneNumber !== undefined) {
      updateData.phone_number = updates.phoneNumber;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('auth_user_id', authUserId)
      .select()
      .single();

    if (error) {
      console.error('API: Update user failed', error);
      throw new Error(error.message || 'Failed to update user');
    }

    console.log('API: User updated', data);
    const camelData = toCamelCase(data);
    return {
      ...camelData,
      id: camelData.authUserId,
    };
  },

  // Posts endpoints
  getPosts: async (): Promise<PostFrontend[]> => {
    console.log('API: Getting ALL published posts (public and contract_only)');
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('API: Get posts failed', error);
      throw new Error(error.message || 'Failed to get posts');
    }

    console.log('API: Posts retrieved', data?.length || 0, 'posts (public + contract_only)');
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
  getTasks: async (authUserId: string): Promise<TaskFrontend[]> => {
    console.log('API: Getting tasks for user', authUserId);
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('auth_user_id', authUserId);

    if (error) {
      console.error('API: Get tasks failed', error);
      throw new Error(error.message || 'Failed to get tasks');
    }

    console.log('API: Tasks retrieved', data?.length || 0);
    return data?.map((task) => {
      const camelTask = toCamelCase(task);
      return {
        ...camelTask,
        userId: camelTask.authUserId,
      };
    }) || [];
  },

  createTask: async (
    authUserId: string,
    task: { title: string; description?: string | null; dueDate: string }
  ): Promise<TaskFrontend> => {
    console.log('API: Creating task', { authUserId, task });
    
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        auth_user_id: authUserId,
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
    const camelTask = toCamelCase(data);
    return {
      ...camelTask,
      userId: camelTask.authUserId,
    };
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
    const camelTask = toCamelCase(data);
    return {
      ...camelTask,
      userId: camelTask.authUserId,
    };
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
    const camelTask = toCamelCase(data);
    return {
      ...camelTask,
      userId: camelTask.authUserId,
    };
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
