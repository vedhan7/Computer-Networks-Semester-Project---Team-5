import { describe, it, expect } from 'vitest';
import { initializeTipsPipeline, evaluateTipsPipeline, TipsJob } from '../tips';
import { ClassEvent } from '../timetable';

describe('TIPS Pipeline Engine', () => {
  const mockEvent: ClassEvent = {
    id: 'EVT-1',
    building: 'Alpha',
    room: 'Alpha-101',
    course: 'CS101',
    startTime: 100000,
    durationMinutes: 60,
    eventType: 'LECTURE',
    w_ac: 3,
    roster: [],
    expectedHeadcount: 50,
    expectedBandwidth: 100,
  };

  it('initializes correct transition times (T-30, T-5)', () => {
    const jobs = initializeTipsPipeline([mockEvent]);
    expect(jobs.length).toBe(1);
    
    const job = jobs[0];
    expect(job.stagedTime).toBe(100000 - 30 * 60 * 1000);
    expect(job.armedTime).toBe(100000 - 5 * 60 * 1000);
    expect(job.activeTime).toBe(100000);
    expect(job.expiredTime).toBe(100000 + 60 * 60 * 1000);
    expect(job.currentState).toBe('PENDING');
  });

  it('transitions properly through STAGED -> ARMED -> ACTIVE -> EXPIRED based on time', () => {
    let jobs = initializeTipsPipeline([mockEvent]);
    const job = jobs[0];

    // T-35
    jobs = evaluateTipsPipeline(jobs, job.stagedTime - 5 * 60 * 1000);
    expect(jobs[0].currentState).toBe('PENDING');

    // T-30
    jobs = evaluateTipsPipeline(jobs, job.stagedTime);
    expect(jobs[0].currentState).toBe('STAGED');
    expect(jobs[0].stateHistory.length).toBe(1);

    // T-5
    jobs = evaluateTipsPipeline(jobs, job.armedTime);
    expect(jobs[0].currentState).toBe('ARMED');

    // T
    jobs = evaluateTipsPipeline(jobs, job.activeTime);
    expect(jobs[0].currentState).toBe('ACTIVE');

    // T+Duration
    jobs = evaluateTipsPipeline(jobs, job.expiredTime);
    expect(jobs[0].currentState).toBe('EXPIRED');
  });
});
