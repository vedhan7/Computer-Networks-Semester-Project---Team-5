// ──────────────────────────────────────────────────────────────────────
// Route registration — maps HTTP verbs → validators → RBAC → controllers.
// ──────────────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Middleware
import { authorize, generateToken } from '../middleware/auth.middleware';
import { validate } from '../middleware/validator.middleware';

// Validators
import {
  cnhsSchema,
  bandwidthSchema,
  jaccardSchema,
  tipsSchema,
} from '../validators/schemas';

// Controllers
import { cnhsController } from '../controllers/cnhs.controller';
import { bandwidthController } from '../controllers/bandwidth.controller';
import { jaccardController } from '../controllers/jaccard.controller';
import { tipsController } from '../controllers/tips.controller';

// Worker (for status endpoint)
import { getPendingJobs, getExecutionLog } from '../../workers/tips.worker';

import config from '../../config';
import type { Role } from '../../types';

const router = Router();

// ─── Health check (unauthenticated) ──────────────────────────────────
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: config.apiVersion,
  });
});

// ─── Token generation (development only) ─────────────────────────────
router.post('/auth/token', (req: Request, res: Response) => {
  if (config.nodeEnv === 'production') {
    res.status(404).json({ success: false, error: 'Not available in production.' });
    return;
  }

  const { sub, role } = req.body as { sub?: string; role?: Role };
  if (!sub || !role || !['admin', 'operator', 'viewer'].includes(role)) {
    res.status(422).json({
      success: false,
      error: 'Provide { sub: string, role: "admin"|"operator"|"viewer" }.',
    });
    return;
  }

  const token = generateToken(sub, role);
  res.status(200).json({ success: true, data: { token } });
});

// ─── Module 1: CNHS ─────────────────────────────────────────────────
router.post(
  '/v1/triage/cnhs',
  authorize('admin', 'operator'),
  validate(cnhsSchema),
  cnhsController,
);

// ─── Module 2: Bandwidth ────────────────────────────────────────────
router.post(
  '/v1/bandwidth/allocate',
  authorize('admin', 'operator'),
  validate(bandwidthSchema),
  bandwidthController,
);

// ─── Module 3: Jaccard ──────────────────────────────────────────────
router.post(
  '/v1/spatial/jaccard',
  authorize('admin', 'operator'),
  validate(jaccardSchema),
  jaccardController,
);

// ─── Module 4: TIPS — Ingest Schedule ───────────────────────────────
router.post(
  '/v1/tips/schedule',
  authorize('admin'),
  validate(tipsSchema),
  tipsController,
);

// ─── Module 4: TIPS — Worker Status (viewer-accessible) ─────────────
router.get(
  '/v1/tips/status',
  authorize('admin', 'operator', 'viewer'),
  (_req: Request, res: Response) => {
    const requestId = uuidv4();
    res.status(200).json({
      success: true,
      data: {
        pendingJobs: getPendingJobs().length,
        recentExecutions: getExecutionLog().slice(-50),
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        version: config.apiVersion,
      },
    });
  },
);

// ─── Quarantine webhook receiver (internal) ─────────────────────────
router.post('/v1/quarantine/ingest', (req: Request, res: Response) => {
  // In production, this would write to an incident management system.
  const requestId = uuidv4();
  res.status(202).json({
    success: true,
    data: { message: 'Quarantine event accepted.', payload: req.body },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      version: config.apiVersion,
    },
  });
});

export default router;
