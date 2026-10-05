import { adminDb } from './firebase-admin';

export function calculateDeviation(uObs: number, uPred: number): number {
  return Math.abs(uObs - uPred);
}

export function calculateCNHS(deviation: number, wAc: number): number {
  const penalty = 0.8 * deviation * Math.log10(wAc + 1);
  return Math.max(0, 100 - penalty);
}

export function calculateBandwidthAllocation(
  capacity: number,
  studentsInRoom: number,
  totalStudents: number
): number {
  if (totalStudents === 0) return 0;
  return capacity * (studentsInRoom / totalStudents);
}

export function calculateSpatialTriangulation(
  connectedMacs: string[],
  rosterMacs: string[]
): { score: number; isMigrated: boolean } {
  if (rosterMacs.length === 0) return { score: 0, isMigrated: false };
  
  const connectedSet = new Set(connectedMacs);
  let overlap = 0;
  for (const mac of rosterMacs) {
    if (connectedSet.has(mac)) {
      overlap++;
    }
  }
  
  const score = overlap / rosterMacs.length;
  return { score, isMigrated: score >= 0.60 };
}

export function calculateTIPSPipeline(startTime: Date, durationMinutes: number) {
  const staged = new Date(startTime.getTime() - 30 * 60_000);
  const armed = new Date(startTime.getTime() - 5 * 60_000);
  const active = new Date(startTime.getTime());
  const expired = new Date(startTime.getTime() + durationMinutes * 60_000);
  
  return { staged, armed, active, expired };
}

/**
 * Runs the mathematical engine by pulling from ClassSessions and NetworkTelemetry collections,
 * performs calculations, and writes the results back to NetworkTelemetry.
 */
export async function runAcornEngine() {
  const classesSnapshot = await adminDb.collection('ClassSessions').get();
  const telemetrySnapshot = await adminDb.collection('NetworkTelemetry').get();

  const classDocs = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  
  let totalStudents = 0;
  const roomStudentCounts: Record<string, number> = {};

  // Map telemetry data for bandwidth calculation
  const telemetryData = telemetrySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
  for (const tel of telemetryData) {
    const count = (tel.connectedMacAddresses || []).length;
    roomStudentCounts[tel.id] = count;
    totalStudents += count;
  }

  const BOTTLENECK_CAPACITY = 1000;
  const batch = adminDb.batch();

  for (const cls of classDocs) {
    const roomId = cls.roomId;
    const telemetryRef = adminDb.collection('NetworkTelemetry').doc(roomId);
    const telemetryDoc = telemetryData.find(t => t.id === roomId);

    const uObs = telemetryDoc?.currentBandwidth || 0;
    const uPred = cls.expectedBandwidth || 0;
    const connectedMacs = telemetryDoc?.connectedMacAddresses || [];
    const rosterMacs = cls.rosterMacAddresses || [];
    
    // 1. Threat Triage
    const deviation = calculateDeviation(uObs, uPred);
    const cnhsScore = calculateCNHS(deviation, cls.priority);
    const quarantineStatus = cnhsScore < 80;

    // 2. Spatial Triangulation
    const { score: matchScore, isMigrated } = calculateSpatialTriangulation(connectedMacs, rosterMacs);

    // 3. Bandwidth Allocation
    const studentsInRoom = connectedMacs.length;
    const allocatedBandwidth = calculateBandwidthAllocation(BOTTLENECK_CAPACITY, studentsInRoom, totalStudents);

    // 4. TIPS Pipeline
    const tips = calculateTIPSPipeline(cls.startTime.toDate(), cls.duration);

    // Update Telemetry with processed math
    batch.update(telemetryRef, {
      cnhsScore,
      quarantineStatus,
      allocatedBandwidth,
      matchScore,
      isMigrated,
      tipsStaged: tips.staged,
      tipsArmed: tips.armed,
      tipsActive: tips.active,
      tipsExpired: tips.expired,
      lastUpdated: new Date()
    });
  }

  await batch.commit();
}
