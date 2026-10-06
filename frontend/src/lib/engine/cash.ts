import { TipsJob } from "./tips";
import { TopologyLink } from "./topology";

export interface CashDecision {
  jobId: string;
  course: string;
  w_ac: number;
  expectedBandwidth: number;
  status: 'RE_ROUTED' | 'DROPPED';
  reason: string;
}

export function resolveCashConflict(
  activeJobs: TipsJob[], 
  availableCapacityMbps: number
): CashDecision[] {
  // Sort jobs by W_ac descending (highest priority first)
  // APCR (Academic Priority-Based Congestion Resolution) algorithm
  
  // Since W_ac isn't directly on TipsJob (it's derived from eventType via APCR_CONFIG),
  // we'll need to pass the config or resolve it here.
  // For simplicity, we assume we map it or pass it. We'll pass jobs with W_ac injected.
  
  const sortedJobs = [...activeJobs].sort((a, b) => b.w_ac - a.w_ac);
  
  let remainingCapacity = availableCapacityMbps;
  const decisions: CashDecision[] = [];

  for (const job of sortedJobs) {
    if (remainingCapacity >= job.expectedBandwidth) {
      remainingCapacity -= job.expectedBandwidth;
      decisions.push({
        jobId: job.eventId,
        course: job.course,
        w_ac: job.w_ac,
        expectedBandwidth: job.expectedBandwidth,
        status: 'RE_ROUTED',
        reason: `Allocated ${job.expectedBandwidth}Mbps. Remaining capacity: ${remainingCapacity}Mbps.`
      });
    } else {
      decisions.push({
        jobId: job.eventId,
        course: job.course,
        w_ac: job.w_ac,
        expectedBandwidth: job.expectedBandwidth,
        status: 'DROPPED',
        reason: `Insufficient capacity (${remainingCapacity}Mbps left). Lower priority (W_ac = ${job.w_ac}) dropped.`
      });
    }
  }

  return decisions;
}
