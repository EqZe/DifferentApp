
import Constants from 'expo-constants';

const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || 'https://8fazvn3hy8nmzjsg6kz2u68p6xpbp6gk.app.specular.dev';

export interface User {
  id: string;
  fullName: string;
  city: string;
  phoneNumber: string;
  hasSignedAgreement: boolean;
  travelDate: string | null;
  createdAt: string;
}

export interface Post {
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

export interface Task {
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
  // User endpoints (matching OpenAPI spec)
  register: async (fullName: string, city: string, phoneNumber: string): Promise<User> => {
    console.log('API: Registering user', { fullName, city, phoneNumber });
    const response = await fetch(`${BACKEND_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fullName, city, phoneNumber }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('API: Registration failed', error);
      throw new Error('Registration failed');
    }

    const data = await response.json();
    console.log('API: Registration successful', data);
    return data;
  },

  getUserByPhone: async (phoneNumber: string): Promise<User> => {
    console.log('API: Getting user by phone', phoneNumber);
    const response = await fetch(`${BACKEND_URL}/api/users/phone/${phoneNumber}`);

    if (!response.ok) {
      const error = await response.text();
      console.error('API: Get user failed', error);
      throw new Error('Failed to get user');
    }

    const data = await response.json();
    console.log('API: User retrieved', data);
    return data;
  },

  getUserById: async (userId: string): Promise<User> => {
    console.log('API: Getting user by ID', userId);
    const response = await fetch(`${BACKEND_URL}/api/users/${userId}`);

    if (!response.ok) {
      const error = await response.text();
      console.error('API: Get user failed', error);
      throw new Error('Failed to get user');
    }

    const data = await response.json();
    console.log('API: User retrieved', data);
    return data;
  },

  updateUser: async (
    userId: string,
    updates: { hasSignedAgreement?: boolean; travelDate?: string | null }
  ): Promise<User> => {
    console.log('API: Updating user', { userId, updates });
    const response = await fetch(`${BACKEND_URL}/api/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('API: Update user failed', error);
      throw new Error('Failed to update user');
    }

    const data = await response.json();
    console.log('API: User updated', data);
    return data;
  },

  // Posts endpoints
  getPosts: async (hasSignedAgreement?: boolean): Promise<Post[]> => {
    console.log('API: Getting posts', { hasSignedAgreement });
    const url = hasSignedAgreement !== undefined 
      ? `${BACKEND_URL}/api/posts?hasSignedAgreement=${hasSignedAgreement}`
      : `${BACKEND_URL}/api/posts`;
    
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.text();
      console.error('API: Get posts failed', error);
      throw new Error('Failed to get posts');
    }

    const data = await response.json();
    console.log('API: Posts retrieved', data.length);
    return data;
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
  }): Promise<Post> => {
    console.log('API: Creating post', post);
    const response = await fetch(`${BACKEND_URL}/api/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(post),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('API: Create post failed', error);
      throw new Error('Failed to create post');
    }

    const data = await response.json();
    console.log('API: Post created', data);
    return data;
  },

  updatePost: async (postId: string, updates: Partial<Post>): Promise<Post> => {
    console.log('API: Updating post', { postId, updates });
    const response = await fetch(`${BACKEND_URL}/api/posts/${postId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('API: Update post failed', error);
      throw new Error('Failed to update post');
    }

    const data = await response.json();
    console.log('API: Post updated', data);
    return data;
  },

  deletePost: async (postId: string): Promise<void> => {
    console.log('API: Deleting post', postId);
    const response = await fetch(`${BACKEND_URL}/api/posts/${postId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('API: Delete post failed', error);
      throw new Error('Failed to delete post');
    }

    console.log('API: Post deleted');
  },

  // Tasks endpoints
  getTasks: async (userId: string): Promise<Task[]> => {
    console.log('API: Getting tasks for user', userId);
    const response = await fetch(`${BACKEND_URL}/api/users/${userId}/tasks`);

    if (!response.ok) {
      const error = await response.text();
      console.error('API: Get tasks failed', error);
      throw new Error('Failed to get tasks');
    }

    const data = await response.json();
    console.log('API: Tasks retrieved', data.length);
    return data;
  },

  createTask: async (
    userId: string,
    task: { title: string; description?: string | null; dueDate: string }
  ): Promise<Task> => {
    console.log('API: Creating task', { userId, task });
    const response = await fetch(`${BACKEND_URL}/api/users/${userId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('API: Create task failed', error);
      throw new Error('Failed to create task');
    }

    const data = await response.json();
    console.log('API: Task created', data);
    return data;
  },

  completeTask: async (taskId: string): Promise<Task> => {
    console.log('API: Completing task', taskId);
    const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}/complete`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('API: Complete task failed', error);
      throw new Error('Failed to complete task');
    }

    const data = await response.json();
    console.log('API: Task completed', data);
    return data;
  },

  updateTaskReminder: async (taskId: string, reminderSent: boolean): Promise<Task> => {
    console.log('API: Updating task reminder', { taskId, reminderSent });
    const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}/reminder`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reminderSent }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('API: Update task reminder failed', error);
      throw new Error('Failed to update task reminder');
    }

    const data = await response.json();
    console.log('API: Task reminder updated', data);
    return data;
  },

  deleteTask: async (taskId: string): Promise<void> => {
    console.log('API: Deleting task', taskId);
    const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('API: Delete task failed', error);
      throw new Error('Failed to delete task');
    }

    console.log('API: Task deleted');
  },
};

// Export BACKEND_URL for direct use in components
export { BACKEND_URL };
