/**
 * NeuralBrief Express server entry point.
 * Initialises Firebase Admin, mounts middleware and routes,
 * and handles graceful shutdown for Cloud Run.
 */

import path from 'path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { initializeApp, cert } from 'firebase-admin';

import { logger, requestLogger } from './utils/logger';
import { AppError, errorResponse, successResponse } from './types';
import digestRouter from './routes/digest';
import topicsRouter from './routes/topics';
import cronRouter from './cron';

// ─── Firebase Admin Initialisation ───────────────────────────────────────────

const privateKey = process.env['FIREBASE_PRIVATE_KEY'];
const clientEmail = process.env['FIREBASE_CLIENT_EMAIL'];

if (privateKey && clientEmail) {
  initializeApp({
    credential: cert({
      projectId: process.env['FIREBASE_PROJECT_ID'],
      clientEmail: clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });
} else {
  initializeApp({
    projectId: process.env['FIREBASE_PROJECT_ID'],
  });
}

// ─── App Setup ────────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env['PORT'] ?? 3001;
const IS_PRODUCTION = process.env['NODE_ENV'] === 'production';

const __dirname = path.resolve();

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(helmet());
app.use(cors({ origin: process.env['ALLOWED_ORIGIN'] }));
app.use(express.json());
app.use(requestLogger);

// ─── API Routes ───────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json(
    successResponse({
      timestamp: new Date().toISOString(),
      version: process.env['npm_package_version'] ?? 'unknown',
    }),
  );
});

app.use('/api/digest', digestRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/cron', cronRouter);

// ─── 404 for unknown API routes ───────────────────────────────────────────────

app.use('/api/*path', (_req, res) => {
  res.status(404).json(errorResponse('API route not found'));
});

// ─── Static Files (production only) ──────────────────────────────────────────

if (IS_PRODUCTION) {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));

  // SPA fallback — must come after all /api/* handlers
  app.get('*path', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof AppError) {
    logger.warn('Application error', { message: err.message, statusCode: err.statusCode });
    res.status(err.statusCode).json(errorResponse(err.message));
    return;
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  logger.error('Unhandled error', { error: message });
  res.status(500).json(errorResponse('Internal server error'));
});

// ─── Server Start ─────────────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  logger.info('NeuralBrief server started', { port: PORT, env: process.env['NODE_ENV'] ?? 'development' });
});

// ─── Graceful Shutdown (Cloud Run SIGTERM) ────────────────────────────────────

process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;