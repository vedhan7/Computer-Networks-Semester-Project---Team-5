import { describe, it, expect, beforeEach } from 'vitest';
import { generateTimetable } from '../timetable';
import { setSeed } from '../prng';
import { APCR_CONFIG } from '../config';

describe('Timetable Generator', () => {
  const baseTime = new Date('2026-10-06T00:00:00Z').getTime();

  beforeEach(() => {
    setSeed(999);
  });

  it('generates a deterministic timetable for exactly 9 rooms (3 buildings x 3 rooms)', () => {
    const events = generateTimetable(baseTime);
    expect(events.length).toBe(27); // 9 rooms * 3 events each
    
    // Check determinism
    setSeed(999);
    const events2 = generateTimetable(baseTime);
    expect(events).toEqual(events2);
  });

  it('assigns correct w_ac based on eventType', () => {
    const events = generateTimetable(baseTime);
    events.forEach(e => {
      expect(e.w_ac).toBe(APCR_CONFIG[e.eventType].w_ac);
    });
  });

  it('generates correct roster lengths based on expectedHeadcount', () => {
    const events = generateTimetable(baseTime);
    events.forEach(e => {
      expect(e.roster.length).toBe(e.expectedHeadcount);
      // Valid MAC format basic check
      expect(e.roster[0]).toMatch(/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/);
    });
  });
});
