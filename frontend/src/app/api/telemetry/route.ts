import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  calculateDeviation, 
  calculateCNHS, 
  calculateBandwidthAllocation, 
  calculateSpatialTriangulation, 
  calculateTIPSPipeline 
} from '../../../../lib/acorn-engine';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const classes = await prisma.classSession.findMany({
      include: { roster: true }
    });

    const latestTelemetry = await prisma.networkTelemetry.findMany({
      orderBy: { timestamp: 'desc' },
      take: 3
    });

    // Run ACORN Engine Math
    const results = classes.map(cls => {
      const telemetry = latestTelemetry.find(t => t.roomId === cls.room);
      const uObs = telemetry?.currentBandwidth || 0;
      const uPred = cls.expectedBandwidth;

      const deviation = calculateDeviation(uObs, uPred);
      const cnhs = calculateCNHS(deviation, cls.priority);
      
      const connectedMacs = (telemetry?.connectedMacAddresses as string[]) || [];
      const rosterMacs = cls.roster.map(r => r.macAddress);
      const jaccard = calculateSpatialTriangulation(connectedMacs, rosterMacs);

      const tips = calculateTIPSPipeline(cls.startTime, cls.duration);

      return {
        classId: cls.id,
        room: cls.room,
        priority: cls.priority,
        uObs,
        uPred,
        deviation,
        cnhs,
        jaccard,
        tips,
        studentsInRoom: connectedMacs.length
      };
    });

    const totalStudents = results.reduce((sum, r) => sum + r.studentsInRoom, 0);
    const BOTTLENECK_CAPACITY = 1000;

    const finalResults = results.map(r => ({
      ...r,
      allocatedBandwidth: calculateBandwidthAllocation(
        BOTTLENECK_CAPACITY,
        r.studentsInRoom,
        totalStudents
      )
    }));

    return NextResponse.json({ success: true, data: finalResults });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch telemetry' }, { status: 500 });
  }
}
