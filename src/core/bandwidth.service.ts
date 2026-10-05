// ──────────────────────────────────────────────────────────────────────
// Module 2 — Equitable Bandwidth Allocator
//
// PURE COMPUTATION — deterministic, stateless, no side-effects.
//
// Formula:
//   BW_i = C_bottleneck × (N_i / Σ N_k)
//
// Business rule:
//   Filter competing classes to only those sharing the HIGHEST
//   priority rank, then distribute proportionally by student count.
// ──────────────────────────────────────────────────────────────────────

import type {
  BandwidthInput,
  BandwidthResult,
  CompetingClass,
  BandwidthAllocation,
} from '../types';

/**
 * Identify the highest-priority rank (lowest numeric value) in the set,
 * then return only the classes at that rank.
 */
export function filterByHighestPriority(classes: CompetingClass[]): CompetingClass[] {
  const minRank = Math.min(...classes.map((c) => c.priorityRank));
  return classes.filter((c) => c.priorityRank === minRank);
}

/**
 * Distribute bandwidth proportionally across a filtered class set.
 *
 * @param capacity  Total bottleneck capacity in Mbps.
 * @param classes   Pre-filtered classes (all same priority).
 * @returns Per-class allocation objects rounded to 4 decimal places.
 */
export function allocateBandwidth(
  capacity: number,
  classes: CompetingClass[],
): BandwidthAllocation[] {
  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0);

  if (totalStudents === 0) {
    return classes.map((c) => ({ classId: c.classId, allocatedMbps: 0 }));
  }

  return classes.map((c) => ({
    classId: c.classId,
    allocatedMbps: parseFloat(
      (capacity * (c.studentCount / totalStudents)).toFixed(4),
    ),
  }));
}

/**
 * Public entry point — filter → allocate → envelope.
 */
export function computeBandwidthAllocation(input: BandwidthInput): BandwidthResult {
  const { bottleneckCapacityMbps, classes } = input;

  const filtered = filterByHighestPriority(classes);
  const totalStudentsInPriority = filtered.reduce(
    (sum, c) => sum + c.studentCount,
    0,
  );
  const allocations = allocateBandwidth(bottleneckCapacityMbps, filtered);

  return {
    filteredPriority: filtered[0]?.priorityRank ?? 0,
    totalStudentsInPriority,
    allocations,
    timestamp: new Date().toISOString(),
  };
}
