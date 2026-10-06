"use client";

import { useEffect, useRef } from "react";
import { useEngineStore } from "@/store/engineStore";

export default function EngineInitializer() {
  const initialize = useEngineStore((state) => state.initialize);
  const isPlaying = useEngineStore((state) => state.isPlaying);
  const tick = useEngineStore((state) => state.tick);
  
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      // Initialize with a default seed when the app loads
      initialize(123456789);
      initialized.current = true;
    }
  }, [initialize]);

  useEffect(() => {
    if (!isPlaying) return;

    // Run the engine tick every second when playing
    const interval = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, tick]);

  return null; // This is a logic-only component, it doesn't render anything
}
