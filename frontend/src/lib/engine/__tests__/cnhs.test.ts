import { describe, it, expect } from 'vitest';
import { calculateCNHS } from '../cnhs';

describe('CNHS Engine', () => {
  it('calculates 100 for zero deviation', () => {
    const res = calculateCNHS(100, 100, 3, 1000, 'R1');
    expect(res.cnhsScore).toBe(100);
    expect(res.penalty).toBe(0);
    expect(res.isOverUse).toBe(false);
  });

  it('calculates expected score for positive deviation (over-use)', () => {
    // Expected: 100, Actual: 540 (Deviation: 440)
    // W_ac = 3
    // Formula: 100 - (0.8 * 440 * log10(4)) 
    // log10(4) is approx 0.60206
    // Penalty = 0.8 * 440 * 0.60206 = 211.9
    // Score = max(0, 100 - 211.9) = 0
    const res = calculateCNHS(100, 540, 3, 1000, 'R1');
    expect(res.deviation).toBe(440);
    expect(res.isOverUse).toBe(true);
    expect(res.penalty).toBeCloseTo(211.92, 1);
    expect(res.cnhsScore).toBe(0);
  });

  it('calculates expected score for negative deviation (under-use)', () => {
    // Expected: 100, Actual: 0 (Deviation: -100)
    // W_ac = 2
    // Formula: 100 - (0.8 * 100 * log10(3))
    // log10(3) is approx 0.477
    // Penalty = 0.8 * 100 * 0.477 = 38.17
    // Score = 100 - 38.17 = 61.83
    const res = calculateCNHS(100, 0, 2, 1000, 'R1');
    expect(res.deviation).toBe(-100);
    expect(res.isOverUse).toBe(false);
    expect(res.penalty).toBeCloseTo(38.17, 1);
    expect(res.cnhsScore).toBeCloseTo(61.83, 1);
  });

  it('verifies that higher deviation results in lower score', () => {
    const resSmall = calculateCNHS(100, 290, 3, 1000, 'R1'); // D=190
    const resLarge = calculateCNHS(100, 540, 3, 1000, 'R1'); // D=440
    
    // According to the prompt's issue, D=440 shouldn't score higher than D=190
    expect(resLarge.cnhsScore).toBeLessThan(resSmall.cnhsScore);
  });
});
