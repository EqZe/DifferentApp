
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
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
  blocks?: PostBlockFrontend[];
}

export interface Category {
  id: string;
  name: string;
  iconName: string;
  description: string | null;
  coverImage: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryWithPosts extends Category {
  postCount: number;
  hasContractOnlyPosts: boolean;
}

export interface TaskFrontend {
  id: string;
  userId: string; // This is auth_user_id
  title: string;
  description: string | null;
  dueDate: string | null;
  status: 'YET' | 'PENDING' | 'DONE'; // Task status
  requiresPending: boolean; // Whether task requires PENDING status before DONE
  createdAt: string;
  updatedAt: string;
}

export const api = {
  // Auth endpoints
  signUp: async (email: string, password: string, fullName: string, city: string, phoneNumber?: string): Promise<UserFrontend> => {
    console.log('API: Signing up user', { email, fullName, city });
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Skip email confirmation - user can sign in immediately
          emailRedirectTo: undefined,
        },
      });

      if (authError) {
        console.error('API: Sign up auth error', authError);
        
        // Handle specific error cases
        if (authError.message.includes('rate limit')) {
          throw new Error('יותר מדי ניסיונות הרשמה. אנא נסה שוב בעוד מספר דקות.');
        }
        if (authError.message.includes('already registered')) {
          throw new Error('המייל כבר רשום במערכת. נסה להתחבר במקום.');
        }
        
        throw new Error(authError.message || 'שגיאה בהרשמה');
      }

      if (!authData.user) {
        throw new Error('לא התקבל משתמש מהשרת');
      }

      console.log('API: Sign up successful, creating/updating user profile in database');
      
      // Use upsert to handle cases where the user profile already exists (e.g., from a database trigger)
      // This prevents duplicate key errors
      const { data: userData, error: upsertError } = await supabase
        .from('users')
        .upsert({
          auth_user_id: authData.user.id,
          full_name: fullName,
          city,
          phone_number: phoneNumber || null,
          email: email,
          has_contract: false,
          travel_date: null,
        }, {
          onConflict: 'auth_user_id',
          ignoreDuplicates: false, // Update existing row if it exists
        })
        .select()
        .single();

      if (upsertError) {
        console.error('API: Failed to create/update user profile', upsertError);
        
        // If profile creation fails, try to clean up the auth user
        await supabase.auth.signOut();
        
        throw new Error(upsertError.message || 'שגיאה ביצירת פרופיל משתמש');
      }

      console.log('API: User profile created/updated successfully', userData);
      
      const camelData = toCamelCase(userData);
      return {
        ...camelData,
        id: camelData.authUserId,
      };
    } catch (error: any) {
      console.error('API: Sign up failed with error:', error);
      throw error;
    }
  },

  signIn: async (email: string, password: string): Promise<UserFrontend> => {
    console.log('API: Signing in user', email);
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error('API: Sign in failed', authError);
        
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('אימייל או סיסמה שגויים');
        }
        if (authError.message.includes('Email not confirmed')) {
          throw new Error('יש לאמת את כתובת המייל לפני התחברות');
        }
        
        throw new Error(authError.message || 'שגיאה בהתחברות');
      }

      if (!authData.user) {
        throw new Error('לא התקבל משתמש מהשרת');
      }

      console.log('API: Sign in successful, fetching user profile');
      const userData = await api.getUserByAuthId(authData.user.id);
      return userData;
    } catch (error: any) {
      console.error('API: Sign in failed with error:', error);
      throw error;
    }
  },

  signOut: async (): Promise<void> => {
    console.log('API: Signing out user');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('API: Sign out failed', error);
      throw new Error(error.message || 'שגיאה בהתנתקות');
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
      throw new Error(error.message || 'שגיאה בטעינת פרטי משתמש');
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
      throw new Error(error.message || 'שגיאה בעדכון פרטי משתמש');
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
      throw new Error(error.message || 'שגיאה בטעינת פוסטים');
    }

    console.log('API: Posts retrieved', data?.length || 0, 'posts (public + contract_only)');
    return data?.map(toCamelCase) || [];
  },

  getCategories: async (): Promise<CategoryWithPosts[]> => {
    console.log('API: Getting categories with post counts from new structure');
    
    // Fetch all active categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (categoriesError) {
      console.error('API: Get categories failed', categoriesError);
      throw new Error(categoriesError.message || 'שגיאה בטעינת קטגוריות');
    }

    console.log('API: Categories retrieved from database:', categoriesData?.length || 0);

    // Fetch all published posts to count posts per category
    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('category_id, cover_image, visibility')
      .eq('is_published', true);

    if (postsError) {
      console.error('API: Get posts for category counts failed', postsError);
      throw new Error(postsError.message || 'שגיאה בטעינת פוסטים');
    }

    console.log('API: Posts retrieved for counting:', postsData?.length || 0);

    // Create a map of category_id -> post stats
    const postStatsMap = new Map<string, { count: number; coverImage: string | null; hasContractOnly: boolean }>();
    
    postsData?.forEach((post) => {
      if (!post.category_id) return;
      
      const existing = postStatsMap.get(post.category_id);
      
      if (existing) {
        existing.count += 1;
        // Use first cover image found
        if (!existing.coverImage && post.cover_image) {
          existing.coverImage = post.cover_image;
        }
        // Check if any post is contract_only
        if (post.visibility === 'contract_only') {
          existing.hasContractOnly = true;
        }
      } else {
        postStatsMap.set(post.category_id, {
          count: 1,
          coverImage: post.cover_image,
          hasContractOnly: post.visibility === 'contract_only',
        });
      }
    });

    // Combine categories with post stats
    const categoriesWithPosts: CategoryWithPosts[] = categoriesData?.map((category) => {
      const camelCategory = toCamelCase(category);
      const stats = postStatsMap.get(category.id) || { count: 0, coverImage: null, hasContractOnly: false };
      
      return {
        id: camelCategory.id,
        name: camelCategory.name,
        iconName: camelCategory.iconName,
        description: camelCategory.description,
        coverImage: stats.coverImage || camelCategory.coverImage, // Use post cover image if available, otherwise category cover
        displayOrder: camelCategory.displayOrder,
        isActive: camelCategory.isActive,
        createdAt: camelCategory.createdAt,
        updatedAt: camelCategory.updatedAt,
        postCount: stats.count,
        hasContractOnlyPosts: stats.hasContractOnly,
      };
    }) || [];

    console.log('API: Categories with post counts:', categoriesWithPosts.map(c => `${c.name}: ${c.postCount} posts, icon: ${c.iconName}`));
    return categoriesWithPosts;
  },

  getCategoryById: async (categoryId: string): Promise<Category | null> => {
    console.log('API: Getting category by ID', categoryId);
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('API: Category not found', categoryId);
        return null;
      }
      console.error('API: Get category failed', error);
      throw new Error(error.message || 'שגיאה בטעינת קטגוריה');
    }

    console.log('API: Category retrieved', data);
    return toCamelCase(data);
  },

  getCategoryByName: async (categoryName: string): Promise<Category | null> => {
    console.log('API: Getting category by name', categoryName);
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('name', categoryName)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('API: Category not found', categoryName);
        return null;
      }
      console.error('API: Get category failed', error);
      throw new Error(error.message || 'שגיאה בטעינת קטגוריה');
    }

    console.log('API: Category retrieved', data);
    return toCamelCase(data);
  },

  getPostsByCategory: async (categoryId: string): Promise<PostFrontend[]> => {
    console.log('API: Getting posts for category ID', categoryId);
    
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('is_published', true)
      .eq('category_id', categoryId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('API: Get posts by category failed', error);
      throw new Error(error.message || 'שגיאה בטעינת פוסטים');
    }

    console.log('API: Posts retrieved for category', data?.length || 0, 'posts');
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
      throw new Error(error.message || 'שגיאה בטעינת פוסט');
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
      throw new Error(error.message || 'שגיאה בטעינת תוכן פוסט');
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
    
    // Query user_tasks with joined tasks_metadata to get title and description
    const { data, error } = await supabase
      .from('user_tasks')
      .select(`
        id,
        auth_user_id,
        due_date,
        status,
        created_at,
        updated_at,
        tasks_metadata (
          title,
          description,
          requires_pending
        )
      `)
      .eq('auth_user_id', authUserId)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('API: Get tasks failed', error);
      throw new Error(error.message || 'שגיאה בטעינת משימות');
    }

    console.log('API: Tasks retrieved', data?.length || 0);
    
    // Transform the data to match TaskFrontend interface
    return data?.map((task: any) => {
      const metadata = task.tasks_metadata;
      return {
        id: task.id,
        userId: task.auth_user_id,
        title: metadata?.title || 'משימה ללא כותרת',
        description: metadata?.description || null,
        dueDate: task.due_date,
        status: task.status,
        requiresPending: metadata?.requires_pending || false,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      };
    }) || [];
  },

  createTask: async (
    authUserId: string,
    task: { title: string; description?: string | null; dueDate: string }
  ): Promise<TaskFrontend> => {
    console.log('API: Creating custom task (not from template)', { authUserId, task });
    
    // Note: This creates a custom task without a template
    // For template-based tasks, they are auto-created when travel_date is set
    const { data, error } = await supabase
      .from('user_tasks')
      .insert({
        auth_user_id: authUserId,
        task_metadata_id: null, // Custom task without template
        due_date: task.dueDate,
        status: 'YET',
      })
      .select()
      .single();

    if (error) {
      console.error('API: Create task failed', error);
      throw new Error(error.message || 'שגיאה ביצירת משימה');
    }

    console.log('API: Custom task created', data);
    return {
      id: data.id,
      userId: data.auth_user_id,
      title: task.title,
      description: task.description || null,
      dueDate: data.due_date,
      status: data.status,
      requiresPending: false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  completeTask: async (taskId: string, requiresPending: boolean): Promise<TaskFrontend> => {
    console.log('API: Updating task status', { taskId, requiresPending });
    
    // First, get the current task to check its status
    const { data: currentTask, error: fetchError } = await supabase
      .from('user_tasks')
      .select(`
        id,
        auth_user_id,
        status,
        due_date,
        created_at,
        updated_at,
        tasks_metadata (
          title,
          description,
          requires_pending
        )
      `)
      .eq('id', taskId)
      .single();

    if (fetchError) {
      console.error('API: Fetch task failed', fetchError);
      throw new Error(fetchError.message || 'שגיאה בטעינת משימה');
    }

    // Determine next status based on current status and requirements
    let newStatus: 'YET' | 'PENDING' | 'DONE';
    const currentStatus = currentTask.status;
    
    if (requiresPending) {
      // Task requires PENDING before DONE
      if (currentStatus === 'YET') {
        newStatus = 'PENDING';
      } else if (currentStatus === 'PENDING') {
        newStatus = 'DONE';
      } else {
        newStatus = 'DONE'; // Already done
      }
    } else {
      // Task can go directly to DONE
      newStatus = 'DONE';
    }

    console.log('API: Transitioning task from', currentStatus, 'to', newStatus);

    const { data, error } = await supabase
      .from('user_tasks')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .select(`
        id,
        auth_user_id,
        due_date,
        status,
        created_at,
        updated_at,
        tasks_metadata (
          title,
          description,
          requires_pending
        )
      `)
      .single();

    if (error) {
      console.error('API: Update task status failed', error);
      throw new Error(error.message || 'שגיאה בעדכון סטטוס משימה');
    }

    console.log('API: Task status updated', data);
    const metadata = data.tasks_metadata;
    return {
      id: data.id,
      userId: data.auth_user_id,
      title: metadata?.title || 'משימה ללא כותרת',
      description: metadata?.description || null,
      dueDate: data.due_date,
      status: data.status,
      requiresPending: metadata?.requires_pending || false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  // Note: Reminder functionality removed as user_tasks doesn't have reminder_sent field
  // Reminders should be handled by a separate notification system

  deleteTask: async (taskId: string): Promise<void> => {
    console.log('API: Deleting task', taskId);
    
    const { error } = await supabase
      .from('user_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('API: Delete task failed', error);
      throw new Error(error.message || 'שגיאה במחיקת משימה');
    }

    console.log('API: Task deleted');
  },
};

// Export types for use in components
export type { 
  UserFrontend as User, 
  PostFrontend as Post, 
  PostBlockFrontend as PostBlock,
  TaskFrontend as Task,
  Category,
  CategoryWithPosts 
};
