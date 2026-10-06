import { create } from 'zustand';
import { ClassEvent, generateTimetable } from '../lib/engine/timetable';
import { SimulatedClock } from '../lib/engine/clock';
import { setSeed, getSeed } from '../lib/engine/prng';
import { TipsJob, initializeTipsPipeline, evaluateTipsPipeline } from '../lib/engine/tips';
import { NetworkTopologyState, initializeTopology } from '../lib/engine/topology';

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

  // Topology
  topology: NetworkTopologyState;
  
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

  initialize: (seed = 123456789) => {
    setSeed(seed);
    const events = generateTimetable(baseTime);
    const tipsJobs = initializeTipsPipeline(events);
    const topology = initializeTopology();
    get().clock.reset();
    set({ seed, events, tipsJobs, topology, currentTime: get().clock.getTime(), isPlaying: false, timeSpeed: 1 });
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
    const { clock, tipsJobs } = get();
    if (clock.isRunning()) {
      const newTime = clock.tick();
      const updatedTips = evaluateTipsPipeline(tipsJobs, newTime);
      set({ currentTime: newTime, tipsJobs: updatedTips });
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
        // Just an alert for now, will implement Triangulation later
        break;
    }
    
    set({ topology: newTopology });
  }
}));
