import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema.js";
import type { App } from "../index.js";

export function register(app: App, fastify: FastifyInstance) {
  // Register a new user
  fastify.post('/api/users', {
    schema: {
      description: 'Register a new user',
      tags: ['users'],
      body: {
        type: 'object',
        required: ['fullName', 'city', 'phoneNumber'],
        properties: {
          fullName: { type: 'string' },
          city: { type: 'string' },
          phoneNumber: { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            fullName: { type: 'string' },
            city: { type: 'string' },
            phoneNumber: { type: 'string' },
            hasSignedAgreement: { type: 'boolean' },
            travelDate: { type: 'string', nullable: true },
            createdAt: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { fullName, city, phoneNumber } = request.body as {
      fullName: string;
      city: string;
      phoneNumber: string;
    };

    app.logger.info(
      { fullName, city, phoneNumber },
      'Registering new user'
    );

    try {
      const result = await app.db
        .insert(schema.users)
        .values({
          fullName,
          city,
          phoneNumber,
        })
        .returning();

      const user = result[0];
      app.logger.info({ userId: user.id }, 'User registered successfully');
      reply.code(201);
      return user;
    } catch (error) {
      app.logger.error(
        { err: error, phoneNumber },
        'Failed to register user'
      );
      throw error;
    }
  });

  // Retrieve user by phone number
  fastify.get('/api/users/phone/:phoneNumber', {
    schema: {
      description: 'Get user by phone number',
      tags: ['users'],
      params: {
        type: 'object',
        required: ['phoneNumber'],
        properties: {
          phoneNumber: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            fullName: { type: 'string' },
            city: { type: 'string' },
            phoneNumber: { type: 'string' },
            hasSignedAgreement: { type: 'boolean' },
            travelDate: { type: 'string', nullable: true },
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
    const { phoneNumber } = request.params as { phoneNumber: string };

    app.logger.info({ phoneNumber }, 'Fetching user by phone number');

    try {
      const user = await app.db.query.users.findFirst({
        where: eq(schema.users.phoneNumber, phoneNumber),
      });

      if (!user) {
        app.logger.info({ phoneNumber }, 'User not found');
        reply.code(404);
        return { message: 'User not found' };
      }

      app.logger.info({ userId: user.id }, 'User retrieved successfully');
      return user;
    } catch (error) {
      app.logger.error(
        { err: error, phoneNumber },
        'Failed to retrieve user'
      );
      throw error;
    }
  });

  // Get user by ID
  fastify.get('/api/users/:id', {
    schema: {
      description: 'Get user by ID',
      tags: ['users'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            fullName: { type: 'string' },
            city: { type: 'string' },
            phoneNumber: { type: 'string' },
            hasSignedAgreement: { type: 'boolean' },
            travelDate: { type: 'string', nullable: true },
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
    const { id } = request.params as { id: string };

    app.logger.info({ id }, 'Fetching user by ID');

    try {
      const user = await app.db.query.users.findFirst({
        where: eq(schema.users.id, id),
      });

      if (!user) {
        app.logger.info({ id }, 'User not found');
        reply.code(404);
        return { message: 'User not found' };
      }

      app.logger.info({ userId: user.id }, 'User retrieved successfully');
      return user;
    } catch (error) {
      app.logger.error({ err: error, id }, 'Failed to retrieve user');
      throw error;
    }
  });

  // Update user agreement status and travel date
  fastify.patch('/api/users/:id', {
    schema: {
      description: 'Update user agreement status and travel date',
      tags: ['users'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
      },
      body: {
        type: 'object',
        properties: {
          hasSignedAgreement: { type: 'boolean' },
          travelDate: { type: 'string', nullable: true },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            fullName: { type: 'string' },
            city: { type: 'string' },
            phoneNumber: { type: 'string' },
            hasSignedAgreement: { type: 'boolean' },
            travelDate: { type: 'string', nullable: true },
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
    const { id } = request.params as { id: string };
    const { hasSignedAgreement, travelDate } = request.body as {
      hasSignedAgreement?: boolean;
      travelDate?: string | null;
    };

    app.logger.info(
      { id, hasSignedAgreement, travelDate },
      'Updating user agreement status and travel date'
    );

    try {
      const updateData: Record<string, any> = {};
      if (hasSignedAgreement !== undefined) {
        updateData.hasSignedAgreement = hasSignedAgreement;
      }
      if (travelDate !== undefined) {
        updateData.travelDate = travelDate ? travelDate : null;
      }

      if (Object.keys(updateData).length === 0) {
        const user = await app.db.query.users.findFirst({
          where: eq(schema.users.id, id),
        });
        if (!user) {
          reply.code(404);
          return { message: 'User not found' };
        }
        return user;
      }

      const result = await app.db
        .update(schema.users)
        .set(updateData)
        .where(eq(schema.users.id, id))
        .returning();

      if (result.length === 0) {
        app.logger.info({ id }, 'User not found');
        reply.code(404);
        return { message: 'User not found' };
      }

      const user = result[0];
      app.logger.info({ userId: user.id }, 'User updated successfully');
      return user;
    } catch (error) {
      app.logger.error(
        { err: error, id, hasSignedAgreement, travelDate },
        'Failed to update user'
      );
      throw error;
    }
  });
}
