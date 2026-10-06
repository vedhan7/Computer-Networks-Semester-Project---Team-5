import { create } from 'zustand';
import { ClassEvent, generateTimetable } from '../lib/engine/timetable';
import { SimulatedClock } from '../lib/engine/clock';
import { setSeed, getSeed } from '../lib/engine/prng';
import { TipsJob, initializeTipsPipeline, evaluateTipsPipeline } from '../lib/engine/tips';

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
  
  // Actions
  initialize: (seed?: number) => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  jumpToNextEvent: () => void;
  tick: () => void;
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

  initialize: (seed = 123456789) => {
    setSeed(seed);
    const events = generateTimetable(baseTime);
    const tipsJobs = initializeTipsPipeline(events);
    get().clock.reset();
    set({ seed, events, tipsJobs, currentTime: get().clock.getTime(), isPlaying: false, timeSpeed: 1 });
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
  }
}));
