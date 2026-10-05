// ──────────────────────────────────────────────────────────────────────
// Module 3 — Spatial Triangulation (Jaccard-style Match Score)
//
// PURE COMPUTATION — deterministic, stateless, no side-effects.
//
// Formula:
//   S_match = |Set_Connected ∩ Set_Roster| / |Set_Roster|
//
// Business rule:
//   S_match ≥ 0.60  →  authorize automated policy migration.
// ──────────────────────────────────────────────────────────────────────

import type { JaccardInput, JaccardResult } from '../types';
import config from '../config';

/**
 * Compute the intersection cardinality of two string sets.
 * Uses a native Set for O(n) lookup instead of nested loops.
 */
export function intersectionSize(a: string[], b: string[]): number {
  const setA = new Set(a.map((s) => s.trim().toUpperCase()));
  let count = 0;
  for (const item of b) {
    if (setA.has(item.trim().toUpperCase())) {
      count++;
    }
  }
  return count;
}

/**
 * Compute the modified Jaccard match score.
 * Division by |Roster| (not union) — per spec.
 */
export function computeMatchScore(connected: string[], roster: string[]): number {
  if (roster.length === 0) return 0;
  const overlap = intersectionSize(connected, roster);
  return overlap / roster.length;
}

/**
 * Public entry point — score → authorize.
 */
export function evaluateJaccard(input: JaccardInput): JaccardResult {
  const { connectedMacAddresses, officialRosterIds } = input;

  const overlap = intersectionSize(connectedMacAddresses, officialRosterIds);
  const rosterSize = officialRosterIds.length;
  const matchScore = rosterSize > 0 ? overlap / rosterSize : 0;

  return {
    intersectionSize: overlap,
    rosterSize,
    matchScore: parseFloat(matchScore.toFixed(6)),
    migrationAuthorized: matchScore >= config.jaccardThreshold,
    timestamp: new Date().toISOString(),
  };
}
