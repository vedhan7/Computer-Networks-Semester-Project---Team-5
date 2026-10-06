import { APCR_CONFIG, EventType } from './config';
import { nextInt } from './prng';

export interface ClassEvent {
  id: string;
  building: string;
  room: string;
  course: string;
  startTime: number; // Simulated time in ms (e.g. from 08:00 AM today)
  durationMinutes: number;
  eventType: EventType;
  w_ac: number;
  roster: string[]; // List of MAC addresses
  expectedHeadcount: number;
  expectedBandwidth: number;
}

function generateMac(): string {
  const hex = () => Math.floor(nextInt(0, 255)).toString(16).padStart(2, '0').toUpperCase();
  return `${hex()}:${hex()}:${hex()}:${hex()}:${hex()}:${hex()}`;
}

export function generateTimetable(baseTimeMs: number): ClassEvent[] {
  const events: ClassEvent[] = [];
  const buildings = ['Alpha', 'Beta', 'Gamma'];
  const roomsPerBuilding = 3;
  
  let eventIdCounter = 1;

  for (let b = 0; b < buildings.length; b++) {
    for (let r = 1; r <= roomsPerBuilding; r++) {
      const room = `${buildings[b]}-${r}01`;
      
      // Schedule 3 events per room
      for (let i = 0; i < 3; i++) {
        const startHour = 8 + i * 3; // 08:00, 11:00, 14:00
        const startTime = baseTimeMs + (startHour * 3600 * 1000);
        
        const eventTypes: EventType[] = ['LECTURE', 'LAB', 'EXAM'];
        const type = eventTypes[nextInt(0, 2)];
        
        const expectedHeadcount = nextInt(20, 100);
        const roster = Array.from({ length: expectedHeadcount }, () => generateMac());
        
        events.push({
          id: `EVT-${eventIdCounter++}`,
          building: buildings[b],
          room,
          course: `COURSE-${nextInt(100, 499)}`,
          startTime,
          durationMinutes: nextInt(45, 120),
          eventType: type,
          w_ac: APCR_CONFIG[type].w_ac,
          roster,
          expectedHeadcount,
          expectedBandwidth: expectedHeadcount * (type === 'LAB' ? 5 : 2), // Roughly 2-5 Mbps per student
        });
      }
    }
  }

  return events.sort((a, b) => a.startTime - b.startTime);
}
