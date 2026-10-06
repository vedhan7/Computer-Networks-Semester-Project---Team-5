import { create } from 'zustand';
import { ClassEvent, generateTimetable } from '../lib/engine/timetable';
import { APCR_CONFIG } from '../lib/engine/config';
import { SimulatedClock } from '../lib/engine/clock';
import { setSeed, getSeed } from '../lib/engine/prng';
import { TipsJob, initializeTipsPipeline, evaluateTipsPipeline } from '../lib/engine/tips';
import { NetworkTopologyState, initializeTopology } from '../lib/engine/topology';
import { CnhsCalculation, calculateCNHS } from '../lib/engine/cnhs';
import { TriangulationResult, triangulateClient } from '../lib/engine/triangulation';

interface EngineState {
  // Config
  seed: number;
  useFirestore: boolean;
  
  // Time
  clock: SimulatedClock;
  currentTime: number;
  timeSpeed: number;
  isPlaying: boolean;

  // Timetable & TIPS
  events: ClassEvent[];
  tipsJobs: TipsJob[];

  // Topology & Spatial
  topology: NetworkTopologyState;
  activeTriangulation: TriangulationResult | null;
  
  // CNHS
  cnhsHistory: CnhsCalculation[];
  
  // Actions
  initialize: (seed?: number) => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  jumpToNextEvent: () => void;
  tick: () => void;
  injectScenario: (type: 'DDOS' | 'EXAM_SURGE' | 'ROOM_MOVE' | 'LINK_FAILURE' | 'ROGUE_MAC') => void;
}

const baseTime = new Date().setHours(0, 0, 0, 0); // Midnight today
const defaultClock = new SimulatedClock(baseTime + 7 * 3600 * 1000); // Start at 07:00

export const useEngineStore = create<EngineState>((set, get) => ({
  seed: 123456789,
  useFirestore: process.env.NEXT_PUBLIC_USE_FIRESTORE === 'true',
  
  clock: defaultClock,
  currentTime: defaultClock.getTime(),
  timeSpeed: 1,
  isPlaying: false,

  events: [],
  tipsJobs: [],
  topology: { nodes: [], links: [] },
  activeTriangulation: null,
  cnhsHistory: [],

  initialize: (seed = 123456789) => {
    setSeed(seed);
    const events = generateTimetable(baseTime);
    const tipsJobs = initializeTipsPipeline(events);
    const topology = initializeTopology();
    get().clock.reset();
    set({ seed, events, tipsJobs, topology, activeTriangulation: null, currentTime: get().clock.getTime(), isPlaying: false, timeSpeed: 1 });
  },

  togglePlay: () => {
    const { clock, isPlaying } = get();
    if (isPlaying) {
      clock.pause();
    } else {
      clock.play();
    }
    set({ isPlaying: clock.isRunning() });
  },

  setSpeed: (speed) => {
    const { clock } = get();
    clock.setSpeed(speed);
    set({ timeSpeed: speed });
  },

  jumpToNextEvent: () => {
    const { currentTime, events, clock } = get();
    // Find the next event that hasn't started yet
    const nextEvent = events.find(e => e.startTime > currentTime);
    if (nextEvent) {
      // Jump to T-31 minutes (TIPS Staged phase is T-30)
      const targetTime = nextEvent.startTime - (31 * 60 * 1000);
      clock.jumpTo(Math.max(currentTime, targetTime));
      set({ currentTime: clock.getTime() });
    }
  },

  tick: () => {
    const { clock, tipsJobs, topology, cnhsHistory } = get();
    if (clock.isRunning()) {
      const newTime = clock.tick();
      const updatedTips = evaluateTipsPipeline(tipsJobs, newTime);
      // Update baseline traffic for all links based on active jobs
      const newTopology = { ...topology, links: [...topology.links] };

      // Reset all non-failed links to 0 first (base load)
      newTopology.links.forEach((l, i) => {
        if (!l.isFailed && l.source !== 'CORE') { // Skip core links for now, handle room links
          newTopology.links[i].currentLoadMbps = 5; // Idle chatter 5Mbps
        }
      });

      const activeJobs = updatedTips.filter(j => j.currentState === 'ACTIVE');
      
      // Inject deterministic baseline traffic for active jobs
      for (const job of activeJobs) {
        const linkIndex = newTopology.links.findIndex(l => l.target === job.room);
        if (linkIndex !== -1 && !newTopology.links[linkIndex].isFailed) {
          // Add random jitter +/- 10%
          const jitter = (getSeed() % 20 - 10) / 100;
          const simulatedLoad = job.expectedBandwidth * (1 + jitter);
          newTopology.links[linkIndex].currentLoadMbps = simulatedLoad;
        }
      }

      // Calculate CNHS for active rooms
      const newCnhs: CnhsCalculation[] = [];
      
      for (const job of activeJobs) {
        // Find corresponding link load in the updated topology
        const link = newTopology.links.find(l => l.target === job.room);
        const actualLoad = link ? link.currentLoadMbps : 0;
        
        // Find W_ac
        const eventTypeKey = job.eventType as keyof typeof APCR_CONFIG;
        const w_ac = APCR_CONFIG[eventTypeKey] ? APCR_CONFIG[eventTypeKey].w_ac : 2; // simplified fallback
        
        newCnhs.push(calculateCNHS(job.expectedBandwidth, actualLoad, w_ac, newTime, job.room));
      }

      set({ 
        currentTime: newTime, 
        tipsJobs: updatedTips,
        topology: newTopology,
        cnhsHistory: [...cnhsHistory, ...newCnhs]
      });
    }
  },

  injectScenario: (type) => {
    const { topology, tipsJobs } = get();
    const newTopology = { ...topology, links: [...topology.links], nodes: [...topology.nodes] };
    
    switch(type) {
      case 'DDOS':
        // Find highest priority active event and target its room
        const activeEvents = tipsJobs.filter(j => j.currentState === 'ACTIVE');
        if (activeEvents.length > 0) {
          const target = activeEvents.reduce((prev, curr) => (curr.expectedBandwidth > prev.expectedBandwidth) ? curr : prev);
          const linkIndex = newTopology.links.findIndex(l => l.target === target.room);
          if (linkIndex !== -1) {
             newTopology.links[linkIndex] = { ...newTopology.links[linkIndex], currentLoadMbps: 850 };
          }
        }
        break;
      case 'LINK_FAILURE':
        // Break L-CORE-ALPHA
        const coreLinkIdx = newTopology.links.findIndex(l => l.id === 'L-CORE-ALPHA');
        if (coreLinkIdx !== -1) {
          newTopology.links[coreLinkIdx] = { ...newTopology.links[coreLinkIdx], isFailed: true, currentLoadMbps: 0 };
        }
        break;
      case 'ROGUE_MAC':
        // Quarantine a random active AP
        const aps = newTopology.nodes.filter(n => n.type === 'ROOM_AP');
        if (aps.length > 0) {
          const idx = Math.floor(Math.random() * aps.length); // Use JS random for user-triggered unpredictable ad-hoc event
          newTopology.nodes[idx] = { ...newTopology.nodes[idx], isQuarantined: true };
        }
        break;
      case 'EXAM_SURGE':
        // Max out all building links
        newTopology.links = newTopology.links.map(l => 
          l.source === 'CORE' ? { ...l, currentLoadMbps: l.capacityMbps * 0.95 } : l
        );
        break;
      case 'ROOM_MOVE':
        // Trigger spatial triangulation for a roaming MAC
        const ap1 = { id: 'Alpha-101', rssi: -45, x: 150, y: 150 };
        const ap2 = { id: 'Alpha-201', rssi: -65, x: 200, y: 100 };
        const ap3 = { id: 'Alpha-301', rssi: -85, x: 100, y: 100 };
        const result = triangulateClient('AA:BB:CC:DD:EE:FF', ap1, ap2, ap3);
        set({ activeTriangulation: result });
        break;
    }
    
    set({ topology: newTopology });
  }
}));
