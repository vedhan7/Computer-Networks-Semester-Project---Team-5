import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SimulatedClock } from '../clock';

describe('SimulatedClock', () => {
  let clock: SimulatedClock;

  beforeEach(() => {
    vi.useFakeTimers();
    clock = new SimulatedClock(1000); // start at 1000ms
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts paused and returns initial time', () => {
    expect(clock.getTime()).toBe(1000);
    expect(clock.isRunning()).toBe(false);
  });

  it('ticks forward when playing at 1x speed', () => {
    clock.play();
    vi.advanceTimersByTime(500); // 500ms real time
    
    expect(clock.tick()).toBe(1500);
    expect(clock.getTime()).toBe(1500);
  });

  it('ticks forward respecting speed multiplier', () => {
    clock.setSpeed(60); // 60x speed
    clock.play();
    vi.advanceTimersByTime(1000); // 1 second real time
    
    // 1s * 60 = 60000ms. 1000 + 60000 = 61000
    expect(clock.tick()).toBe(61000);
  });

  it('stops advancing when paused', () => {
    clock.play();
    vi.advanceTimersByTime(1000);
    expect(clock.tick()).toBe(2000);
    
    clock.pause();
    vi.advanceTimersByTime(5000);
    expect(clock.tick()).toBe(2000); // shouldn't change
  });

  it('can jump to a specific time', () => {
    clock.play();
    clock.jumpTo(9999);
    expect(clock.getTime()).toBe(9999);
    
    vi.advanceTimersByTime(1000);
    expect(clock.tick()).toBe(10999); // continues from jump
  });
});
