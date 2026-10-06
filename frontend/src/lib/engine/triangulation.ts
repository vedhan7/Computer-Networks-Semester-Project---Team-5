export interface TriangulationResult {
  mac: string;
  ap1: { id: string; rssi: number; x: number; y: number };
  ap2: { id: string; rssi: number; x: number; y: number };
  ap3: { id: string; rssi: number; x: number; y: number };
  estimatedX: number;
  estimatedY: number;
  confidence: number;
}

export function triangulateClient(
  mac: string,
  ap1: { id: string; rssi: number; x: number; y: number },
  ap2: { id: string; rssi: number; x: number; y: number },
  ap3: { id: string; rssi: number; x: number; y: number }
): TriangulationResult {
  // Free space path loss simplified distance estimation
  // d = 10 ^ ((TxPower - RSSI) / (10 * n))
  // Assuming TxPower = -30dBm, n = 2.0
  const estimateDistance = (rssi: number) => Math.pow(10, (-30 - rssi) / 20);

  const d1 = estimateDistance(ap1.rssi);
  const d2 = estimateDistance(ap2.rssi);
  const d3 = estimateDistance(ap3.rssi);

  // Weighted centroid (simple approximation of trilateration for the UI)
  const w1 = 1 / Math.max(d1, 0.1);
  const w2 = 1 / Math.max(d2, 0.1);
  const w3 = 1 / Math.max(d3, 0.1);
  
  const sumW = w1 + w2 + w3;

  const estimatedX = (ap1.x * w1 + ap2.x * w2 + ap3.x * w3) / sumW;
  const estimatedY = (ap1.y * w1 + ap2.y * w2 + ap3.y * w3) / sumW;

  // Confidence based on signal strength (stronger signal = higher confidence)
  const avgRssi = (ap1.rssi + ap2.rssi + ap3.rssi) / 3;
  // Map -90 (low) to -40 (high) to 0-100%
  const confidence = Math.max(0, Math.min(100, ((avgRssi + 90) / 50) * 100));

  return {
    mac,
    ap1,
    ap2,
    ap3,
    estimatedX,
    estimatedY,
    confidence
  };
}
