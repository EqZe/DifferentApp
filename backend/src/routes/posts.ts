import type { FastifyInstance } from "fastify";
import { eq, asc } from "drizzle-orm";
import * as schema from "../db/schema.js";
import type { App } from "../index.js";

export function register(app: App, fastify: FastifyInstance) {
  // Get posts filtered by agreement stage, sorted by order
  fastify.get('/api/posts', {
    schema: {
      description: 'Get posts filtered by agreement stage',
      tags: ['posts'],
      querystring: {
        type: 'object',
        properties: {
          hasSignedAgreement: { type: 'boolean' },
        },
      },
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              content: { type: 'string' },
              imageUrl: { type: 'string', nullable: true },
              videoUrl: { type: 'string', nullable: true },
              buttonText: { type: 'string', nullable: true },
              buttonLink: { type: 'string', nullable: true },
              isPreAgreement: { type: 'boolean' },
              orderIndex: { type: 'number' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
  }, async (request) => {
    const { hasSignedAgreement } = request.query as {
      hasSignedAgreement?: string;
    };

    app.logger.info(
      { hasSignedAgreement },
      'Fetching posts by agreement stage'
    );

    try {
      // Filter posts based on agreement stage
      // If hasSignedAgreement is true, show all posts (isPreAgreement can be true or false)
      // If hasSignedAgreement is false, show only pre-agreement posts (isPreAgreement must be true)
      const isAgreed = hasSignedAgreement === 'true';

      const posts = isAgreed
        ? await app.db
            .select()
            .from(schema.posts)
            .orderBy(asc(schema.posts.orderIndex))
        : await app.db
            .select()
            .from(schema.posts)
            .where(eq(schema.posts.isPreAgreement, true))
            .orderBy(asc(schema.posts.orderIndex));

      app.logger.info({ count: posts.length }, 'Posts retrieved successfully');
      return posts;
    } catch (error) {
      app.logger.error(
        { err: error, hasSignedAgreement },
        'Failed to retrieve posts'
      );
      throw error;
    }
  });

  // Create a post (admin only)
  fastify.post('/api/posts', {
    schema: {
      description: 'Create a new post',
      tags: ['posts'],
      body: {
        type: 'object',
        required: ['title', 'content'],
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          imageUrl: { type: 'string', nullable: true },
          videoUrl: { type: 'string', nullable: true },
          buttonText: { type: 'string', nullable: true },
          buttonLink: { type: 'string', nullable: true },
          isPreAgreement: { type: 'boolean' },
          orderIndex: { type: 'number' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string' },
            imageUrl: { type: 'string', nullable: true },
            videoUrl: { type: 'string', nullable: true },
            buttonText: { type: 'string', nullable: true },
            buttonLink: { type: 'string', nullable: true },
            isPreAgreement: { type: 'boolean' },
            orderIndex: { type: 'number' },
            createdAt: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const {
      title,
      content,
      imageUrl,
      videoUrl,
      buttonText,
      buttonLink,
      isPreAgreement,
      orderIndex,
    } = request.body as {
      title: string;
      content: string;
      imageUrl?: string;
      videoUrl?: string;
      buttonText?: string;
      buttonLink?: string;
      isPreAgreement?: boolean;
      orderIndex?: number;
    };

    app.logger.info({ title, isPreAgreement }, 'Creating new post');

    try {
      const result = await app.db
        .insert(schema.posts)
        .values({
          title,
          content,
          imageUrl: imageUrl || null,
          videoUrl: videoUrl || null,
          buttonText: buttonText || null,
          buttonLink: buttonLink || null,
          isPreAgreement: isPreAgreement ?? true,
          orderIndex: orderIndex ?? 0,
        })
        .returning();

      const post = result[0];
      app.logger.info({ postId: post.id }, 'Post created successfully');
      reply.code(201);
      return post;
    } catch (error) {
      app.logger.error({ err: error, title }, 'Failed to create post');
      throw error;
    }
  });

  // Update a post
  fastify.patch('/api/posts/:id', {
    schema: {
      description: 'Update a post',
      tags: ['posts'],
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
          title: { type: 'string' },
          content: { type: 'string' },
          imageUrl: { type: 'string', nullable: true },
          videoUrl: { type: 'string', nullable: true },
          buttonText: { type: 'string', nullable: true },
          buttonLink: { type: 'string', nullable: true },
          isPreAgreement: { type: 'boolean' },
          orderIndex: { type: 'number' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string' },
            imageUrl: { type: 'string', nullable: true },
            videoUrl: { type: 'string', nullable: true },
            buttonText: { type: 'string', nullable: true },
            buttonLink: { type: 'string', nullable: true },
            isPreAgreement: { type: 'boolean' },
            orderIndex: { type: 'number' },
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
    const {
      title,
      content,
      imageUrl,
      videoUrl,
      buttonText,
      buttonLink,
      isPreAgreement,
      orderIndex,
    } = request.body as {
      title?: string;
      content?: string;
      imageUrl?: string | null;
      videoUrl?: string | null;
      buttonText?: string | null;
      buttonLink?: string | null;
      isPreAgreement?: boolean;
      orderIndex?: number;
    };

    app.logger.info({ id }, 'Updating post');

    try {
      const updateData: Record<string, any> = {};
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (videoUrl !== undefined) updateData.videoUrl = videoUrl;
      if (buttonText !== undefined) updateData.buttonText = buttonText;
      if (buttonLink !== undefined) updateData.buttonLink = buttonLink;
      if (isPreAgreement !== undefined) updateData.isPreAgreement = isPreAgreement;
      if (orderIndex !== undefined) updateData.orderIndex = orderIndex;

      if (Object.keys(updateData).length === 0) {
        const post = await app.db.query.posts.findFirst({
          where: eq(schema.posts.id, id),
        });
        if (!post) {
          reply.code(404);
          return { message: 'Post not found' };
        }
        return post;
      }

      const result = await app.db
        .update(schema.posts)
        .set(updateData)
        .where(eq(schema.posts.id, id))
        .returning();

      if (result.length === 0) {
        app.logger.info({ id }, 'Post not found');
        reply.code(404);
        return { message: 'Post not found' };
      }

      const post = result[0];
      app.logger.info({ postId: post.id }, 'Post updated successfully');
      return post;
    } catch (error) {
      app.logger.error({ err: error, id }, 'Failed to update post');
      throw error;
    }
  });

  // Delete a post
  fastify.delete('/api/posts/:id', {
    schema: {
      description: 'Delete a post',
      tags: ['posts'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
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
    const { id } = request.params as { id: string };

    app.logger.info({ id }, 'Deleting post');

    try {
      const result = await app.db
        .delete(schema.posts)
        .where(eq(schema.posts.id, id))
        .returning();

      if (result.length === 0) {
        app.logger.info({ id }, 'Post not found');
        reply.code(404);
        return { message: 'Post not found' };
      }

      app.logger.info({ postId: id }, 'Post deleted successfully');
      reply.code(204);
    } catch (error) {
      app.logger.error({ err: error, id }, 'Failed to delete post');
      throw error;
    }
  });
}
