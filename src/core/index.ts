// ──────────────────────────────────────────────────────────────────────
// Core barrel export — the ONLY import path the API layer should use.
// This is the firewall between computation and transport.
// ──────────────────────────────────────────────────────────────────────

export { evaluateCnhs, computeDeviation, computeCnhs } from './cnhs.service';
export {
  computeBandwidthAllocation,
  filterByHighestPriority,
  allocateBandwidth,
} from './bandwidth.service';
export { evaluateJaccard, intersectionSize, computeMatchScore } from './jaccard.service';
export {
  deriveLifecycle,
  deriveSchedule,
  resolveCurrentState,
  createJob,
  buildJobSet,
} from './tips.service';
