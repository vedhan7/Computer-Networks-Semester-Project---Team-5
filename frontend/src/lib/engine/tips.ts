import { ClassEvent } from './timetable';

export type TipsState = 'STAGED' | 'ARMED' | 'ACTIVE' | 'EXPIRED' | 'PENDING';

export interface TipsJob {
  eventId: string;
  room: string;
  course: string;
  startTime: number;
  durationMinutes: number;
  expectedBandwidth: number;
  
  currentState: TipsState;
  stateHistory: { state: TipsState; timestamp: number }[];
  
  // Timestamps for state transitions
  stagedTime: number; // T-30
  armedTime: number;  // T-5
  activeTime: number; // T
  expiredTime: number; // T + duration
}

export function initializeTipsPipeline(events: ClassEvent[]): TipsJob[] {
  return events.map(e => {
    const stagedTime = e.startTime - 30 * 60 * 1000;
    const armedTime = e.startTime - 5 * 60 * 1000;
    const activeTime = e.startTime;
    const expiredTime = e.startTime + e.durationMinutes * 60 * 1000;

    return {
      eventId: e.id,
      room: e.room,
      course: e.course,
      startTime: e.startTime,
      durationMinutes: e.durationMinutes,
      expectedBandwidth: e.expectedBandwidth,
      
      currentState: 'PENDING',
      stateHistory: [],
      
      stagedTime,
      armedTime,
      activeTime,
      expiredTime
    };
  });
}

export function evaluateTipsPipeline(jobs: TipsJob[], currentTime: number): TipsJob[] {
  return jobs.map(job => {
    let newState: TipsState = job.currentState;
    
    if (currentTime >= job.expiredTime) {
      newState = 'EXPIRED';
    } else if (currentTime >= job.activeTime) {
      newState = 'ACTIVE';
    } else if (currentTime >= job.armedTime) {
      newState = 'ARMED';
    } else if (currentTime >= job.stagedTime) {
      newState = 'STAGED';
    }

    if (newState !== job.currentState) {
      return {
        ...job,
        currentState: newState,
        stateHistory: [...job.stateHistory, { state: newState, timestamp: currentTime }]
      };
    }
    
    return job;
  });
}
