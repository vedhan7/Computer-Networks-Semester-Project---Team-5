import { describe, it, expect, beforeEach } from 'vitest';
import { setSeed, nextRandom, nextInt } from '../prng';

describe('Mulberry32 PRNG', () => {
  it('produces identical sequences for identical seeds', () => {
    setSeed(123);
    const seq1 = [nextRandom(), nextRandom(), nextRandom()];
    
    setSeed(123);
    const seq2 = [nextRandom(), nextRandom(), nextRandom()];
    
    expect(seq1).toEqual(seq2);
  });

  it('produces different sequences for different seeds', () => {
    setSeed(123);
    const seq1 = [nextRandom(), nextRandom(), nextRandom()];
    
    setSeed(456);
    const seq2 = [nextRandom(), nextRandom(), nextRandom()];
    
    expect(seq1).not.toEqual(seq2);
  });

  it('nextInt generates numbers within bounds', () => {
    setSeed(123);
    for (let i = 0; i < 100; i++) {
      const val = nextInt(5, 15);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(15);
      expect(Number.isInteger(val)).toBe(true);
    }
  });
});
