export const APCR_CONFIG = {
  EMERGENCY: { rank: 1, w_ac: 5, label: "Emergency/Security" },
  EXAM: { rank: 2, w_ac: 5, label: "Exam" },
  LAB: { rank: 3, w_ac: 4, label: "Interactive Lab" },
  LECTURE: { rank: 4, w_ac: 3, label: "Lecture" },
  FREE: { rank: 5, w_ac: 1, label: "Free Period" },
} as const;

export type EventType = keyof typeof APCR_CONFIG;

export const ENGINE_CONFIG = {
  BOTTLENECK_CAPACITY_MBPS: 1000,
  CNHS_ALPHA: 0.8,
  CNHS_THRESHOLD: 80,
  TRIANGULATION_THRESHOLD: 0.60,
  TRIANGULATION_METRIC: 'CONTAINMENT' as 'CONTAINMENT' | 'JACCARD', // Which metric decides
  UNDERUSE_POLICY: 'ALERT_ONLY', // 'ALERT_ONLY' or 'QUARANTINE'
  REACTIVE_COMPUTE_TIME_MS: 4200, // 4.2 s
  BACKUP_SWITCH_TIME_MS: 50, // 50 ms
  RECOMPUTE_TIME_MS: 4000, // 4 s
};
