import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema.js";
import type { App } from "../index.js";

export function register(app: App, fastify: FastifyInstance) {
  // Get tasks for a user
  fastify.get('/api/users/:userId/tasks', {
    schema: {
      description: 'Get tasks for a user',
      tags: ['tasks'],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              userId: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string', nullable: true },
              dueDate: { type: 'string' },
              isCompleted: { type: 'boolean' },
              reminderSent: { type: 'boolean' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
  }, async (request) => {
    const { userId } = request.params as { userId: string };

    app.logger.info({ userId }, 'Fetching tasks for user');

    try {
      const tasks = await app.db.query.tasks.findMany({
        where: eq(schema.tasks.userId, userId),
      });

      app.logger.info({ userId, count: tasks.length }, 'Tasks retrieved successfully');
      return tasks;
    } catch (error) {
      app.logger.error({ err: error, userId }, 'Failed to retrieve tasks');
      throw error;
    }
  });

  // Create a task for a user
  fastify.post('/api/users/:userId/tasks', {
    schema: {
      description: 'Create a new task for a user',
      tags: ['tasks'],
      params: {
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['title', 'dueDate'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          dueDate: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            dueDate: { type: 'string' },
            isCompleted: { type: 'boolean' },
            reminderSent: { type: 'boolean' },
            createdAt: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { userId } = request.params as { userId: string };
    const { title, description, dueDate } = request.body as {
      title: string;
      description?: string;
      dueDate: string;
    };

    app.logger.info(
      { userId, title, dueDate },
      'Creating new task'
    );

    try {
      const result = await app.db
        .insert(schema.tasks)
        .values({
          userId,
          title,
          description: description || null,
          dueDate,
        })
        .returning();

      const task = result[0];
      app.logger.info({ taskId: task.id, userId }, 'Task created successfully');
      reply.code(201);
      return task;
    } catch (error) {
      app.logger.error(
        { err: error, userId, title },
        'Failed to create task'
      );
      throw error;
    }
  });

  // Mark task as completed
  fastify.patch('/api/tasks/:taskId/complete', {
    schema: {
      description: 'Mark task as completed',
      tags: ['tasks'],
      params: {
        type: 'object',
        required: ['taskId'],
        properties: {
          taskId: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            dueDate: { type: 'string' },
            isCompleted: { type: 'boolean' },
            reminderSent: { type: 'boolean' },
            createdAt: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { taskId } = request.params as { taskId: string };

    app.logger.info({ taskId }, 'Marking task as completed');

    try {
      const result = await app.db
        .update(schema.tasks)
        .set({ isCompleted: true })
        .where(eq(schema.tasks.id, taskId))
        .returning();

      if (result.length === 0) {
        app.logger.info({ taskId }, 'Task not found');
        reply.code(404);
        return { message: 'Task not found' };
      }

      const task = result[0];
      app.logger.info({ taskId: task.id }, 'Task marked as completed');
      return task;
    } catch (error) {
      app.logger.error({ err: error, taskId }, 'Failed to mark task as completed');
      throw error;
    }
  });

  // Update task reminder status
  fastify.patch('/api/tasks/:taskId/reminder', {
    schema: {
      description: 'Update task reminder status',
      tags: ['tasks'],
      params: {
        type: 'object',
        required: ['taskId'],
        properties: {
          taskId: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        required: ['reminderSent'],
        properties: {
          reminderSent: { type: 'boolean' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            dueDate: { type: 'string' },
            isCompleted: { type: 'boolean' },
            reminderSent: { type: 'boolean' },
            createdAt: { type: 'string' },
          },
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { taskId } = request.params as { taskId: string };
    const { reminderSent } = request.body as { reminderSent: boolean };

    app.logger.info({ taskId, reminderSent }, 'Updating task reminder status');

    try {
      const result = await app.db
        .update(schema.tasks)
        .set({ reminderSent })
        .where(eq(schema.tasks.id, taskId))
        .returning();

      if (result.length === 0) {
        app.logger.info({ taskId }, 'Task not found');
        reply.code(404);
        return { message: 'Task not found' };
      }

      const task = result[0];
      app.logger.info({ taskId: task.id }, 'Task reminder status updated');
      return task;
    } catch (error) {
      app.logger.error(
        { err: error, taskId, reminderSent },
        'Failed to update task reminder status'
      );
      throw error;
    }
  });

  // Delete a task
  fastify.delete('/api/tasks/:taskId', {
    schema: {
      description: 'Delete a task',
      tags: ['tasks'],
      params: {
        type: 'object',
        required: ['taskId'],
        properties: {
          taskId: { type: 'string' },
        },
      },
      response: {
        204: { type: 'null' },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { taskId } = request.params as { taskId: string };

    app.logger.info({ taskId }, 'Deleting task');

    try {
      const result = await app.db
        .delete(schema.tasks)
        .where(eq(schema.tasks.id, taskId))
        .returning();

      if (result.length === 0) {
        app.logger.info({ taskId }, 'Task not found');
        reply.code(404);
        return { message: 'Task not found' };
      }

      app.logger.info({ taskId }, 'Task deleted successfully');
      reply.code(204);
    } catch (error) {
      app.logger.error({ err: error, taskId }, 'Failed to delete task');
      throw error;
    }
  });
}
