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
  activeTab: string;
  cnhsScore: number;
  threatLogs: ThreatLog[];
  jaccardScore: number;
  bandwidthCapacity: number;
  allocations: ClassAllocation[];
  tipsJobs: TIPSJob[];
  setActiveTab: (tab: string) => void;
  setCnhsScore: (score: number) => void;
  updateFromTelemetry: (data: any[]) => void;
}

export const useSDNStore = create<SDNState>((set) => ({
  activeTab: 'dashboard',
  cnhsScore: 100,
  threatLogs: [],
  jaccardScore: 0,
  bandwidthCapacity: 1000,
  allocations: [],
  tipsJobs: [],
  setActiveTab: (tab) => set({ activeTab: tab }),
  setCnhsScore: (score) => set({ cnhsScore: score }),
  updateFromTelemetry: (data) => {
    if (!data || data.length === 0) return;
    
    // Find the minimum CNHS score among all rooms to represent global health
    const minCnhs = Math.min(...data.map(d => d.cnhsScore || 100));
    
    // Build threat logs (using current data as logs for visualizer)
    const logs = data.map(d => ({
      id: d.id,
      u_obs: d.currentBandwidth,
      u_pred: d.allocatedBandwidth > 0 ? d.allocatedBandwidth : d.currentBandwidth, // mock prediction
      deviation: Math.abs(d.currentBandwidth - (d.allocatedBandwidth > 0 ? d.allocatedBandwidth : d.currentBandwidth)),
      w_ac: 5, // mock priority
      cnhs: d.cnhsScore || 100,
      timestamp: new Date().toLocaleTimeString()
    }));

    // Get max Jaccard score
    const maxJaccard = Math.max(...data.map(d => d.matchScore || 0));

    // Build allocations
    const allocs = data.map((d, i) => ({
      classId: d.id,
      priorityRank: 1,
      studentCount: (d.connectedMacAddresses || []).length,
      allocatedMbps: d.allocatedBandwidth || 0
    }));

    set({
      cnhsScore: minCnhs,
      threatLogs: logs,
      jaccardScore: maxJaccard,
      allocations: allocs
    });
  }
}));
