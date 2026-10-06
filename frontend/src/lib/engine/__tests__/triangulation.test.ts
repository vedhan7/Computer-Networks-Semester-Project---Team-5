import { describe, it, expect } from 'vitest';
import { triangulateClient } from '../triangulation';

describe('Spatial Triangulation Engine', () => {
  it('calculates position leaning towards strongest signal', () => {
    // Ap1 is very close (strong signal), Ap2/3 are far
    const result = triangulateClient(
      '00:11:22:33:44:55',
      { id: 'AP1', rssi: -40, x: 0, y: 0 },
      { id: 'AP2', rssi: -80, x: 100, y: 0 },
      { id: 'AP3', rssi: -80, x: 50, y: 100 }
    );
    
    // Should be close to 0,0
    expect(result.estimatedX).toBeLessThan(20);
    expect(result.estimatedY).toBeLessThan(20);
  });

  it('calculates center position for equal signals', () => {
    const result = triangulateClient(
      '00:11:22:33:44:55',
      { id: 'AP1', rssi: -60, x: 0, y: 0 },
      { id: 'AP2', rssi: -60, x: 100, y: 0 },
      { id: 'AP3', rssi: -60, x: 50, y: 100 }
    );
    
    // Centroid of (0,0), (100,0), (50,100) is (50, 33.33)
    expect(result.estimatedX).toBeCloseTo(50, 1);
    expect(result.estimatedY).toBeCloseTo(33.33, 1);
  });
});
