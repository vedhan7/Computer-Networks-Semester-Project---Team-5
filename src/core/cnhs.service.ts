// ──────────────────────────────────────────────────────────────────────
// Module 1 — Context-Normalized Health Score (CNHS)
//
// PURE COMPUTATION — no HTTP, no Express, no side-effects beyond the
// optional async webhook fire.  This isolation is load-bearing.
//
// Formulas:
//   D = |U_obs − U_pred|
//   CNHS = 100 − (0.8 · D × log₁₀(W_ac + 1))
//
// Business rule:
//   If CNHS < 80 → asynchronous quarantine webhook fires.
// ──────────────────────────────────────────────────────────────────────

import type { CnhsInput, CnhsResult, QuarantineWebhookPayload } from '../types';
import config from '../config';
import logger from '../config/logger';

/**
 * Calculate the absolute bandwidth deviation.
 */
export function computeDeviation(observed: number, predicted: number): number {
  return Math.abs(observed - predicted);
}

/**
 * Calculate the CNHS score given deviation and academic priority.
 *
 * @returns CNHS ∈ (-∞, 100].  Clamped to 0 on the low end.
 */
export function computeCnhs(deviation: number, academicPriority: number): number {
  const weightFactor = Math.log10(academicPriority + 1);
  const penalty = 0.8 * deviation * weightFactor;
  return Math.max(0, 100 - penalty);
}

/**
 * Fire-and-forget POST to the quarantine module.
 * Uses native `fetch` (Node 18+) — no axios dependency.
 */
async function fireQuarantineWebhook(payload: QuarantineWebhookPayload): Promise<void> {
  try {
    const response = await fetch(config.quarantineWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5_000),
    });
    logger.info('Quarantine webhook delivered', {
      status: response.status,
      classScore: payload.cnhsScore,
    });
  } catch (err) {
    // Non-fatal: log and move on.  The triage result is still valid.
    logger.error('Quarantine webhook failed — will retry on next cycle', { err });
  }
}

/**
 * Public entry point — orchestrates D → CNHS → conditional webhook.
 */
export async function evaluateCnhs(input: CnhsInput): Promise<CnhsResult> {
  const { observedBandwidth, predictedBandwidth, academicPriority } = input;

  const deviation = computeDeviation(observedBandwidth, predictedBandwidth);
  const cnhsScore = computeCnhs(deviation, academicPriority);
  const quarantineTriggered = cnhsScore < config.cnhsThreshold;
  const timestamp = new Date().toISOString();

  if (quarantineTriggered) {
    logger.warn('CNHS threshold breach — triggering quarantine', {
      cnhsScore,
      deviation,
      academicPriority,
    });

    // Intentionally not awaited at call-site — fire and forget.
    void fireQuarantineWebhook({
      cnhsScore,
      deviation,
      academicPriority,
      triggeredAt: timestamp,
      sourceModule: 'CNHS',
    });
  }

  return { deviation, cnhsScore, quarantineTriggered, timestamp };
}
