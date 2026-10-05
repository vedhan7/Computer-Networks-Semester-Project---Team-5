// ──────────────────────────────────────────────────────────────────────
// SDN Backend Engine — Canonical Type Definitions
// Strict contracts between the isolated math core and the API surface.
// ──────────────────────────────────────────────────────────────────────

/* ───── Module 1: Context-Normalized Health Score (CNHS) ───── */

export interface CnhsInput {
  /** Observed bandwidth in Mbps */
  observedBandwidth: number;
  /** Predicted bandwidth in Mbps */
  predictedBandwidth: number;
  /** Academic priority weight (1 = low, 5 = critical) */
  academicPriority: 1 | 2 | 3 | 4 | 5;
}

export interface CnhsResult {
  deviation: number;
  cnhsScore: number;
  quarantineTriggered: boolean;
  timestamp: string;
}

/* ───── Module 2: Equitable Bandwidth Allocator ───── */

export interface CompetingClass {
  classId: string;
  priorityRank: number;
  studentCount: number;
}

export interface BandwidthInput {
  bottleneckCapacityMbps: number;
  classes: CompetingClass[];
}

export interface BandwidthAllocation {
  classId: string;
  allocatedMbps: number;
}

export interface BandwidthResult {
  filteredPriority: number;
  totalStudentsInPriority: number;
  allocations: BandwidthAllocation[];
  timestamp: string;
}

/* ───── Module 3: Spatial Triangulation (Jaccard Index) ───── */

export interface JaccardInput {
  connectedMacAddresses: string[];
  officialRosterIds: string[];
}

export interface JaccardResult {
  intersectionSize: number;
  rosterSize: number;
  matchScore: number;
  migrationAuthorized: boolean;
  timestamp: string;
}

/* ───── Module 4: Temporal Intent Pre-Staging (TIPS) ───── */

export type TipsState = 'STAGED' | 'ARMED' | 'ACTIVE' | 'EXPIRED';

export interface ScheduledClass {
  classId: string;
  className: string;
  /** ISO-8601 datetime of the class start */
  eventTime: string;
  /** Duration in minutes */
  durationMinutes: number;
}

export interface TipsJob {
  jobId: string;
  classId: string;
  state: TipsState;
  scheduledAt: string;
  executedAt?: string;
}

export interface TipsScheduleResult {
  classId: string;
  stagedAt: string;
  armedAt: string;
  activeAt: string;
  expiredAt: string;
}

/* ───── RBAC ───── */

export type Role = 'admin' | 'operator' | 'viewer';

export interface AuthPayload {
  sub: string;
  role: Role;
  iat: number;
}

/* ───── API envelope ───── */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}

/* ───── Webhook ───── */

export interface QuarantineWebhookPayload {
  cnhsScore: number;
  deviation: number;
  academicPriority: number;
  triggeredAt: string;
  sourceModule: 'CNHS';
}
