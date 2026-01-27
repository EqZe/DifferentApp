
import { supabase } from '@/lib/supabase';
import type { User, Post, Task } from '@/lib/supabase';

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
  travelDate: string | null;
  createdAt: string;
}

export interface PostFrontend {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  isPreAgreement: boolean;
  orderIndex: number;
  createdAt: string;
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
  getPosts: async (hasSignedAgreement?: boolean): Promise<PostFrontend[]> => {
    console.log('API: Getting posts', { hasSignedAgreement });
    
    let query = supabase
      .from('posts')
      .select('*')
      .order('order_index', { ascending: true });

    // If hasSignedAgreement is false, only show pre-agreement posts
    // If hasSignedAgreement is true, show all posts
    if (hasSignedAgreement === false) {
      query = query.eq('is_pre_agreement', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('API: Get posts failed', error);
      throw new Error(error.message || 'Failed to get posts');
    }

    console.log('API: Posts retrieved', data?.length || 0);
    return data?.map(toCamelCase) || [];
  },

  createPost: async (post: {
    title: string;
    content: string;
    imageUrl?: string | null;
    videoUrl?: string | null;
    buttonText?: string | null;
    buttonLink?: string | null;
    isPreAgreement?: boolean;
    orderIndex?: number;
  }): Promise<PostFrontend> => {
    console.log('API: Creating post', post);
    
    const { data, error } = await supabase
      .from('posts')
      .insert({
        title: post.title,
        content: post.content,
        image_url: post.imageUrl || null,
        video_url: post.videoUrl || null,
        button_text: post.buttonText || null,
        button_link: post.buttonLink || null,
        is_pre_agreement: post.isPreAgreement ?? true,
        order_index: post.orderIndex ?? 0,
      })
      .select()
      .single();

    if (error) {
      console.error('API: Create post failed', error);
      throw new Error(error.message || 'Failed to create post');
    }

    console.log('API: Post created', data);
    return toCamelCase(data);
  },

  updatePost: async (postId: string, updates: Partial<PostFrontend>): Promise<PostFrontend> => {
    console.log('API: Updating post', { postId, updates });
    
    const updateData = toSnakeCase(updates);

    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      console.error('API: Update post failed', error);
      throw new Error(error.message || 'Failed to update post');
    }

    console.log('API: Post updated', data);
    return toCamelCase(data);
  },

  deletePost: async (postId: string): Promise<void> => {
    console.log('API: Deleting post', postId);
    
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error('API: Delete post failed', error);
      throw new Error(error.message || 'Failed to delete post');
    }

    console.log('API: Post deleted');
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
export type { UserFrontend as User, PostFrontend as Post, TaskFrontend as Task };
