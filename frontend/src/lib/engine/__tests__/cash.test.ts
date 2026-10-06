import { describe, it, expect } from 'vitest';
import { resolveCashConflict } from '../cash';
import { TipsJob } from '../tips';

describe('CASH Engine', () => {
  it('allocates capacity based on W_ac priority (APCR)', () => {
    const jobs: TipsJob[] = [
      { eventId: '1', course: 'A', w_ac: 2, expectedBandwidth: 100, currentState: 'ACTIVE' } as TipsJob,
      { eventId: '2', course: 'B', w_ac: 5, expectedBandwidth: 200, currentState: 'ACTIVE' } as TipsJob,
      { eventId: '3', course: 'C', w_ac: 3, expectedBandwidth: 150, currentState: 'ACTIVE' } as TipsJob,
    ];

    // Total required: 450. Available: 300
    // Expected order: B (W_ac=5, takes 200), C (W_ac=3, takes 100 max? wait, APCR in our code is all-or-nothing for simplicity)
    // Actually, in the implementation, if remaining >= expected, it allocates.
    // B gets 200. Remaining: 100.
    // C needs 150. Drops C.
    // A needs 100. Gets 100. Remaining: 0.
    
    const decisions = resolveCashConflict(jobs, 300);
    
    expect(decisions.find(d => d.course === 'B')?.status).toBe('RE_ROUTED');
    expect(decisions.find(d => d.course === 'C')?.status).toBe('DROPPED');
    expect(decisions.find(d => d.course === 'A')?.status).toBe('RE_ROUTED');
  });
});
