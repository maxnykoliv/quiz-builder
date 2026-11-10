import cors from 'cors';
import express from 'express';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { quizzesRouter } from './routes/quizzes.routes';

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigins }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/quizzes', quizzesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
