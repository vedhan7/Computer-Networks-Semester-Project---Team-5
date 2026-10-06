"use client";

import { useEngineStore } from "@/store/engineStore";
import { APCR_CONFIG } from "@/lib/engine/config";
import { useMemo } from "react";

export default function TimetableGantt() {
  const { events, currentTime } = useEngineStore();

  // Gantt chart configuration
  const startHour = 7;
  const endHour = 19; // 07:00 to 19:00 (12 hours span)
  const totalMs = (endHour - startHour) * 3600 * 1000;
  
  // Calculate relative X position percentage based on time
  const getXPercent = (timeMs: number) => {
    const d = new Date(timeMs);
    const msSinceStart = (d.getHours() - startHour) * 3600 * 1000 + d.getMinutes() * 60 * 1000 + d.getSeconds() * 1000;
    return Math.max(0, Math.min(100, (msSinceStart / totalMs) * 100));
  };

  // Group events by room
  const rooms = useMemo(() => {
    const grouped = new Map<string, typeof events>();
    events.forEach(e => {
      if (!grouped.has(e.room)) grouped.set(e.room, []);
      grouped.get(e.room)!.push(e);
    });
    return Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [events]);

  const currentX = getXPercent(currentTime);

  return (
    <div className="bg-surface border border-border rounded-md p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-medium text-text-secondary">Daily Academic Timetable</h3>
      </div>

      <div className="relative">
        {/* Timeline Header */}
        <div className="flex border-b border-border/50 pb-2 mb-4 relative ml-24">
          {Array.from({ length: endHour - startHour + 1 }).map((_, i) => (
            <div 
              key={i} 
              className="absolute text-2xs text-text-muted transform -translate-x-1/2"
              style={{ left: `${(i / (endHour - startHour)) * 100}%` }}
            >
              {(startHour + i).toString().padStart(2, '0')}:00
            </div>
          ))}
          <div className="h-4 w-full" />
        </div>

        {/* Rooms & Events */}
        <div className="space-y-4 relative pb-8">
          
          {/* NOW Marker */}
          <div 
            className="absolute top-0 bottom-0 w-px bg-accent z-20 pointer-events-none"
            style={{ left: `calc(6rem + ${currentX}%)` }}
          >
            <div className="absolute -top-1 -translate-x-1/2 -translate-y-full bg-accent text-bg text-2xs px-1.5 py-0.5 rounded font-mono font-bold whitespace-nowrap">
              NOW
            </div>
          </div>

          {rooms.map(([roomName, roomEvents]) => (
            <div key={roomName} className="flex items-center group">
              <div className="w-24 shrink-0 text-xs font-mono text-text-secondary font-medium">
                {roomName}
              </div>
              
              <div className="flex-1 relative h-10 bg-surface-secondary/30 rounded-md border border-border/30">
                {/* Background Grid Lines */}
                {Array.from({ length: endHour - startHour + 1 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute top-0 bottom-0 w-px bg-border/20"
                    style={{ left: `${(i / (endHour - startHour)) * 100}%` }}
                  />
                ))}

                {roomEvents.map(event => {
                  const left = getXPercent(event.startTime);
                  const width = (event.durationMinutes * 60 * 1000 / totalMs) * 100;
                  const config = APCR_CONFIG[event.eventType];
                  
                  return (
                    <div
                      key={event.id}
                      className="absolute top-1 bottom-1 rounded border overflow-hidden transition-all hover:ring-2 ring-accent/50 z-10"
                      style={{ 
                        left: `${left}%`, 
                        width: `${width}%`,
                        backgroundColor: `var(--color-surface)`,
                        borderColor: `var(--color-border)`
                      }}
                      title={`${event.course} (${config.label})\n${event.expectedHeadcount} students, W=${config.w_ac}`}
                    >
                      <div className="w-full h-full flex flex-col justify-center px-2 border-l-4" style={{ borderLeftColor: `var(--color-accent)` }}>
                        <span className="text-2xs font-semibold text-text-secondary truncate">{event.course}</span>
                        <span className="text-[10px] text-text-faint truncate">{config.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
