import { createApplication } from "@specific-dev/framework";
import * as schema from './db/schema.js';
import * as usersRoutes from './routes/users.js';
import * as postsRoutes from './routes/posts.js';
import * as tasksRoutes from './routes/tasks.js';

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Register routes
usersRoutes.register(app, app.fastify);
postsRoutes.register(app, app.fastify);
tasksRoutes.register(app, app.fastify);

await app.run();
app.logger.info('Application running');
