export interface CnhsCalculation {
  timestamp: number;
  roomId: string;
  expectedBandwidth: number;
  actualBandwidth: number;
  deviation: number;
  w_ac: number;
  penalty: number;
  cnhsScore: number;
  isOverUse: boolean;
}

export function calculateCNHS(
  expectedBandwidth: number, 
  actualBandwidth: number, 
  w_ac: number, 
  timestamp: number, 
  roomId: string
): CnhsCalculation {
  const deviation = actualBandwidth - expectedBandwidth;
  const isOverUse = deviation > 0;
  
  // Formula: CNHS = 100 - (0.8 * D * log10(W_ac + 1))
  // The prompt states: D is deviation. "Keep the sign of deviation separate (positive = over-use/quarantine, negative = under-use/outage)."
  // For the penalty, we use the absolute deviation so the score drops regardless of over/under use.
  
  const absD = Math.abs(deviation);
  
  let penalty = 0;
  if (absD > 0) {
    penalty = 0.8 * absD * Math.log10(w_ac + 1);
  }

  // Ensure CNHS doesn't drop below 0
  const cnhsScore = Math.max(0, 100 - penalty);

  return {
    timestamp,
    roomId,
    expectedBandwidth,
    actualBandwidth,
    deviation, // Keeping original sign
    w_ac,
    penalty,
    cnhsScore,
    isOverUse
  };
}
