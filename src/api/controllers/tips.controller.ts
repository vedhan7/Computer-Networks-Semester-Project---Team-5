// ──────────────────────────────────────────────────────────────────────
// Controller — TIPS (Temporal Intent Pre-Staging)
// Accepts a class schedule and returns derived lifecycle timestamps.
// Also triggers the background worker to enqueue jobs.
// ──────────────────────────────────────────────────────────────────────

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { deriveSchedule, buildJobSet } from '../../core';
import { enqueueJobs } from '../../workers/tips.worker';
import config from '../../config';
import logger from '../../config/logger';
import type { ScheduledClass, ApiResponse, TipsScheduleResult, TipsJob } from '../../types';

interface TipsPayload {
  schedule: TipsScheduleResult[];
  enqueuedJobs: number;
}

export function tipsController(req: Request, res: Response): void {
  const requestId = uuidv4();
  try {
    const { classes } = req.body as { classes: ScheduledClass[] };

    // Pure computation: derive timestamps
    const schedule = deriveSchedule(classes);

    // Side-effect: enqueue jobs into the in-memory worker
    const allJobs: TipsJob[] = schedule.flatMap(buildJobSet);
    enqueueJobs(allJobs);

    const response: ApiResponse<TipsPayload> = {
      success: true,
      data: {
        schedule,
        enqueuedJobs: allJobs.length,
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        version: config.apiVersion,
      },
    };

    logger.info('TIPS schedule ingested', {
      requestId,
      classCount: classes.length,
      jobsEnqueued: allJobs.length,
    });
    res.status(200).json(response);
  } catch (err) {
    logger.error('TIPS controller error', { requestId, err });
    res.status(500).json({
      success: false,
      error: 'Internal computation error.',
      meta: { requestId, timestamp: new Date().toISOString(), version: config.apiVersion },
    });
  }
}
