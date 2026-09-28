import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { requireAuth } from './middleware/auth.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import authRoutes from './modules/auth/auth.routes';
import { meHandler } from './modules/auth/auth.controller';
import profileRoutes from './modules/profile/profile.routes';
import tasksRoutes from './modules/tasks/tasks.routes';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',') }));
  app.use(express.json());

  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

  app.use('/api/auth', authRoutes);
  app.get('/api/me', requireAuth, meHandler);
  app.use('/api/profile', profileRoutes);
  app.use('/api/tasks', tasksRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
