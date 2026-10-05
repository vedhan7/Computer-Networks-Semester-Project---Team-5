// ──────────────────────────────────────────────────────────────────────
// TIPS Background Worker — In-memory job queue with cron-driven tick.
//
// Architecture decision: uses an in-memory priority queue rather than
// Redis.  This keeps the system serverless-compatible (stateless per
// invocation on Vercel, persistent when run as a long-lived process).
//
// In a Redis-backed deployment, swap the `jobQueue` Map for a sorted
// set (ZADD by scheduledAt timestamp).
// ──────────────────────────────────────────────────────────────────────

import cron from 'node-cron';
import logger from '../config/logger';
import config from '../config';
import type { TipsJob, TipsState } from '../types';

// ─── In-memory job store keyed by jobId ───
const jobQueue = new Map<string, TipsJob>();

// ─── State-transition log (audit trail) ───
const executionLog: Array<{ jobId: string; classId: string; state: TipsState; executedAt: string }> = [];

/**
 * Enqueue an array of jobs into the in-memory store.
 * Idempotent: duplicate jobIds are silently overwritten.
 */
export function enqueueJobs(jobs: TipsJob[]): void {
  for (const job of jobs) {
    jobQueue.set(job.jobId, job);
  }
  logger.info(`TIPS Worker: enqueued ${jobs.length} jobs (total in queue: ${jobQueue.size})`);
}

/**
 * Retrieve all pending jobs (read-only snapshot).
 */
export function getPendingJobs(): TipsJob[] {
  return Array.from(jobQueue.values()).filter((j) => !j.executedAt);
}

/**
 * Retrieve the execution audit log.
 */
export function getExecutionLog(): typeof executionLog {
  return [...executionLog];
}

/**
 * Execute a single job — marks it executed and removes from queue.
 */
function executeJob(job: TipsJob): void {
  const now = new Date().toISOString();
  job.executedAt = now;

  executionLog.push({
    jobId: job.jobId,
    classId: job.classId,
    state: job.state,
    executedAt: now,
  });

  logger.info(`TIPS Worker: executed job`, {
    jobId: job.jobId,
    classId: job.classId,
    state: job.state,
  });

  jobQueue.delete(job.jobId);
}

/**
 * Tick — called by the cron scheduler.
 * Scans the queue and executes any jobs whose scheduledAt ≤ now.
 */
function tick(): void {
  const now = new Date();
  let executed = 0;

  for (const job of jobQueue.values()) {
    if (job.executedAt) continue;
    const scheduledTime = new Date(job.scheduledAt);
    if (scheduledTime <= now) {
      executeJob(job);
      executed++;
    }
  }

  if (executed > 0) {
    logger.info(`TIPS Worker tick: executed ${executed} due jobs (remaining: ${jobQueue.size})`);
  }
}

/**
 * Start the background cron scheduler.
 * Returns the cron task handle for graceful shutdown.
 */
export function startTipsWorker(): cron.ScheduledTask {
  logger.info(`TIPS Worker starting — cron: "${config.tipsCron}"`);

  const task = cron.schedule(config.tipsCron, () => {
    try {
      tick();
    } catch (err) {
      logger.error('TIPS Worker tick failed', { err });
    }
  });

  return task;
}

/**
 * Force-drain all pending jobs (useful in tests or graceful shutdown).
 */
export function drainQueue(): void {
  const now = new Date().toISOString();
  for (const job of jobQueue.values()) {
    if (!job.executedAt) {
      job.executedAt = now;
      executionLog.push({
        jobId: job.jobId,
        classId: job.classId,
        state: job.state,
        executedAt: now,
      });
    }
  }
  jobQueue.clear();
  logger.info('TIPS Worker: queue drained');
}
