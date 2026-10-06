"use client";

import { useSDNStore } from "@/store/useSDNStore";
import StatusBadge from "./StatusBadge";

export default function HealthOverview() {
  const { cnhsScore, threatLogs } = useSDNStore();
  const isCritical = cnhsScore < 80;
  const isWarning = cnhsScore < 90 && cnhsScore >= 80;

  const status = isCritical ? "critical" : isWarning ? "warning" : "healthy";
  const statusLabel = isCritical ? "Quarantine Active" : isWarning ? "Degraded" : "Healthy";
  const statusBadge = isCritical ? "critical" as const : isWarning ? "medium" as const : "healthy" as const;

  // Mini bar segments for per-room health
  const rooms = threatLogs.map((log) => ({
    id: log.id,
    score: log.cnhs,
    status: log.cnhs < 80 ? "critical" as const : log.cnhs < 90 ? "warning" as const : "healthy" as const,
  }));

  return (
    <div className="bg-surface border border-border rounded-md p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-secondary">Network Health</h3>
        <StatusBadge severity={statusBadge} label={statusLabel} />
      </div>

      {/* Score */}
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-semibold tabular-nums ${
          isCritical ? "text-danger" : isWarning ? "text-warning" : "text-text-primary"
        }`}>
          {cnhsScore.toFixed(1)}
        </span>
        <span className="text-sm text-text-muted">/ 100</span>
      </div>

      {/* Health bar */}
      <div className="w-full h-1.5 rounded-full bg-surface-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            isCritical ? "bg-danger" : isWarning ? "bg-warning" : "bg-accent"
          }`}
          style={{ width: `${Math.max(0, Math.min(100, cnhsScore))}%` }}
        />
      </div>

      {/* Per-room breakdown */}
      {rooms.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <span className="text-2xs text-text-faint uppercase tracking-wider">Per-Room Status</span>
          <div className="space-y-1.5">
            {rooms.map((room) => (
              <div key={room.id} className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs text-text-muted">{room.id}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1 rounded-full bg-surface-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        room.status === "critical" ? "bg-danger" :
                        room.status === "warning" ? "bg-warning" : "bg-accent"
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, room.score))}%` }}
                    />
                  </div>
                  <span className={`text-xs tabular-nums font-medium ${
                    room.status === "critical" ? "text-danger" :
                    room.status === "warning" ? "text-warning" : "text-text-secondary"
                  }`}>
                    {room.score.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
