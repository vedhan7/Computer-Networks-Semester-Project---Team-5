"use client";

import { useEngineStore } from "@/store/engineStore";
import { Play, Pause, FastForward, SkipForward, Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface TopBarProps {
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  const { isPlaying, togglePlay, timeSpeed, setSpeed, jumpToNextEvent, currentTime, tick, initialize } = useEngineStore();

  // Tick the clock every 100ms for smooth UI updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        tick();
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, tick]);

  // Initialize engine on first load
  useEffect(() => {
    initialize();
  }, [initialize]);

  const formatTime = (timeMs: number) => {
    const d = new Date(timeMs);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-6 shrink-0">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-muted">ACORN</span>
        <span className="text-text-faint">/</span>
        <span className="text-text-primary font-medium">{title}</span>
      </div>

      {/* Right: clock controls */}
      <div className="flex items-center gap-4">
        
        {/* Clock Display */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-secondary border border-border font-mono text-sm text-text-secondary">
          <Clock className="w-3.5 h-3.5 text-accent" />
          {formatTime(currentTime)}
        </div>

        <div className="w-px h-5 bg-border" />

        {/* Speed Controls */}
        <div className="flex items-center bg-surface-secondary border border-border rounded-md overflow-hidden">
          {[1, 60, 600].map(speed => (
            <button
              key={speed}
              onClick={() => setSpeed(speed)}
              className={`px-3 py-1.5 text-xs font-medium border-r border-border last:border-r-0 transition-colors ${
                timeSpeed === speed ? "bg-accent/10 text-accent" : "text-text-muted hover:text-text-secondary hover:bg-surface-elevated"
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>

        {/* Play/Pause & Jump */}
        <div className="flex items-center gap-1">
          <button 
            onClick={togglePlay}
            className="p-2 rounded-md text-text-muted hover:text-text-secondary hover:bg-surface-secondary transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <button 
            onClick={jumpToNextEvent}
            className="p-2 rounded-md text-text-muted hover:text-accent hover:bg-accent/10 transition-colors flex items-center gap-1"
            title="Jump to Next Event (T-31m)"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
