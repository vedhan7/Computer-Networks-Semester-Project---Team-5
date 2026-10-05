// ──────────────────────────────────────────────────────────────────────
// Application entry point — assembles middleware, routes, and worker.
// ──────────────────────────────────────────────────────────────────────

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import config from './config';
import logger from './config/logger';
import apiRoutes from './api/routes';
import { startTipsWorker } from './workers/tips.worker';

const app = express();

// ─── Security hardening ──────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: config.nodeEnv === 'production' ? false : '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// ─── Body parsing with size limit ────────────────────────────────────
app.use(express.json({ limit: '1mb' }));

// ─── Request logging ─────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`, {
    ip: req.ip,
    contentLength: req.headers['content-length'],
  });
  next();
});

// ─── Mount API routes under /api ─────────────────────────────────────
app.use('/api', apiRoutes);

// Also mount health at root for load-balancer probes
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: config.apiVersion,
  });
});

// ─── 404 catch-all ───────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found.',
  });
});

// ─── Global error handler ────────────────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    logger.error('Unhandled error', { message: err.message, stack: err.stack });
    res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  },
);

// ─── Boot ────────────────────────────────────────────────────────────
const server = app.listen(config.port, () => {
  logger.info(`SDN Backend Engine running`, {
    port: config.port,
    env: config.nodeEnv,
    version: config.apiVersion,
  });

  // Start the TIPS background scheduler
  const tipsTask = startTipsWorker();

  // Graceful shutdown
  const shutdown = () => {
    logger.info('Shutting down gracefully...');
    tipsTask.stop();
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
});

export default app;
