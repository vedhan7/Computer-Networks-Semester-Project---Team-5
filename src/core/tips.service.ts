// ──────────────────────────────────────────────────────────────────────
// Module 4 — Temporal Intent Pre-Staging (TIPS)
//
// PURE COMPUTATION for timestamp derivation.
// The scheduling side-effects live in the worker layer, NOT here.
//
// Formulas:
//   T_Staged  = T_event − 30 min
//   T_Armed   = T_event − 5 min
//   T_Active  = T_event
//   T_Expired = T_event + T_dur
// ──────────────────────────────────────────────────────────────────────

import type { ScheduledClass, TipsScheduleResult, TipsJob, TipsState } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Offset a Date by a number of minutes.
 */
function offsetMinutes(base: Date, minutes: number): Date {
  return new Date(base.getTime() + minutes * 60_000);
}

/**
 * Derive the four lifecycle timestamps for a single scheduled class.
 */
export function deriveLifecycle(event: ScheduledClass): TipsScheduleResult {
  const eventTime = new Date(event.eventTime);

  return {
    classId: event.classId,
    stagedAt: offsetMinutes(eventTime, -30).toISOString(),
    armedAt: offsetMinutes(eventTime, -5).toISOString(),
    activeAt: eventTime.toISOString(),
    expiredAt: offsetMinutes(eventTime, event.durationMinutes).toISOString(),
  };
}

/**
 * Derive lifecycle timestamps for an entire day's schedule.
 */
export function deriveSchedule(classes: ScheduledClass[]): TipsScheduleResult[] {
  return classes.map(deriveLifecycle);
}

/**
 * Determine which state a class should be in RIGHT NOW.
 */
export function resolveCurrentState(
  lifecycle: TipsScheduleResult,
  now: Date = new Date(),
): TipsState | null {
  const staged = new Date(lifecycle.stagedAt);
  const armed = new Date(lifecycle.armedAt);
  const active = new Date(lifecycle.activeAt);
  const expired = new Date(lifecycle.expiredAt);

  if (now >= expired) return 'EXPIRED';
  if (now >= active) return 'ACTIVE';
  if (now >= armed) return 'ARMED';
  if (now >= staged) return 'STAGED';
  return null; // Not yet in any lifecycle phase
}

/**
 * Build a concrete job record for enqueuing.
 */
export function createJob(
  classId: string,
  state: TipsState,
  scheduledAt: string,
): TipsJob {
  return {
    jobId: uuidv4(),
    classId,
    state,
    scheduledAt,
  };
}

/**
 * Given a class's lifecycle, produce the four jobs that need scheduling.
 */
export function buildJobSet(lifecycle: TipsScheduleResult): TipsJob[] {
  return [
    createJob(lifecycle.classId, 'STAGED', lifecycle.stagedAt),
    createJob(lifecycle.classId, 'ARMED', lifecycle.armedAt),
    createJob(lifecycle.classId, 'ACTIVE', lifecycle.activeAt),
    createJob(lifecycle.classId, 'EXPIRED', lifecycle.expiredAt),
  ];
}
