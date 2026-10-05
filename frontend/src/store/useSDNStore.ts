import { create } from 'zustand';

interface ThreatLog {
  id: string;
  u_obs: number;
  u_pred: number;
  deviation: number;
  w_ac: number;
  cnhs: number;
  timestamp: string;
}

interface ClassAllocation {
  classId: string;
  priorityRank: number;
  studentCount: number;
  allocatedMbps: number;
}

interface TIPSJob {
  id: string;
  classId: string;
  state: 'STAGED' | 'ARMED' | 'ACTIVE' | 'EXPIRED';
  time: string;
}

interface SDNState {
  cnhsScore: number;
  threatLogs: ThreatLog[];
  jaccardScore: number;
  bandwidthCapacity: number;
  allocations: ClassAllocation[];
  tipsJobs: TIPSJob[];
  setCnhsScore: (score: number) => void;
}

export const useSDNStore = create<SDNState>((set) => ({
  cnhsScore: 73.5, // Initial CNHS score < 80 for critical demo
  threatLogs: [
    { id: '1', u_obs: 45, u_pred: 100, deviation: 55, w_ac: 3, cnhs: 73.5, timestamp: '14:02:45' },
    { id: '2', u_obs: 95, u_pred: 100, deviation: 5, w_ac: 1, cnhs: 98.8, timestamp: '14:01:12' },
    { id: '3', u_obs: 120, u_pred: 50, deviation: 70, w_ac: 4, cnhs: 60.8, timestamp: '13:58:30' },
  ],
  jaccardScore: 0.65, // > 0.60 to trigger migration animation
  bandwidthCapacity: 1000,
  allocations: [
    { classId: 'CS101', priorityRank: 1, studentCount: 30, allocatedMbps: 400 },
    { classId: 'CS202', priorityRank: 1, studentCount: 45, allocatedMbps: 600 },
  ],
  tipsJobs: [
    { id: 'job-1', classId: 'CS101', state: 'STAGED', time: '-30m' },
    { id: 'job-2', classId: 'MATH201', state: 'ARMED', time: '-5m' },
    { id: 'job-3', classId: 'PHY301', state: 'ACTIVE', time: '0m' },
    { id: 'job-4', classId: 'ENG102', state: 'EXPIRED', time: '+120m' },
  ],
  setCnhsScore: (score) => set({ cnhsScore: score }),
}));
