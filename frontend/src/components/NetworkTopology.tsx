"use client";

import { useSDNStore } from "@/store/useSDNStore";
import { Network, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";

export default function NetworkTopology() {
  const { jaccardScore, threatLogs } = useSDNStore();
  const isAuthorized = jaccardScore >= 0.60;
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Derive room data from threat logs
  const rooms = threatLogs.length > 0
    ? threatLogs.map((log) => ({
        id: log.id,
        cnhs: log.cnhs,
        bandwidth: log.u_obs,
        status: log.cnhs < 80 ? "critical" as const : log.cnhs < 90 ? "warning" as const : "online" as const,
      }))
    : [
        { id: "ROOM_A", cnhs: 100, bandwidth: 0, status: "online" as const },
        { id: "ROOM_B", cnhs: 100, bandwidth: 0, status: "online" as const },
        { id: "ROOM_C", cnhs: 100, bandwidth: 0, status: "online" as const },
      ];

  const statusDotColor = {
    online: "bg-success",
    warning: "bg-warning",
    critical: "bg-danger",
  };

  return (
    <div className="bg-surface border border-border rounded-md p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-medium text-text-secondary">Network Topology</h3>
        <div className="flex items-center gap-3 text-2xs text-text-faint">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-success" /> Online
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-warning" /> Warning
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-danger" /> Critical
          </span>
        </div>
      </div>

      {/* Topology diagram */}
      <div className="flex flex-col items-center gap-0">
        {/* Controller */}
        <div className="flex flex-col items-center">
          <div className="px-4 py-2 rounded-md border border-accent/25 bg-accent/5 flex items-center gap-2">
            <Network className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-medium text-accent">SDN Controller</span>
          </div>
          <div className="w-px h-5 bg-border" />
        </div>

        {/* Core switch */}
        <div className="flex flex-col items-center">
          <div className="px-3 py-1.5 rounded border border-border bg-surface-secondary flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            <span className="text-xs font-medium text-text-secondary">Core Switch</span>
          </div>
          <div className="w-px h-5 bg-border" />
        </div>

        {/* Rooms */}
        <div className="flex items-start gap-4 w-full justify-center">
          {rooms.map((room, i) => (
            <div key={room.id} className="flex flex-col items-center gap-0">
              {/* Connector line */}
              <div className="flex items-center">
                {i > 0 && <div className="h-px w-4 bg-border" />}
                <div className="w-px h-5 bg-border" />
                {i < rooms.length - 1 && <div className="h-px w-4 bg-border" />}
              </div>

              {/* Room node */}
              <div className={`w-full min-w-[120px] max-w-[160px] p-3 rounded-md border transition-colors ${
                room.status === "critical"
                  ? "border-danger/30 bg-danger/[0.04]"
                  : room.status === "warning"
                  ? "border-warning/30 bg-warning/[0.04]"
                  : "border-border bg-surface-secondary"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor[room.status]}`} />
                  <span className="text-xs font-medium text-text-secondary font-mono">{room.id}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-2xs">
                    <span className="text-text-faint">Health</span>
                    <span className={`tabular-nums font-medium ${
                      room.status === "critical" ? "text-danger" :
                      room.status === "warning" ? "text-warning" : "text-text-secondary"
                    }`}>
                      {room.cnhs.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between text-2xs">
                    <span className="text-text-faint">Traffic</span>
                    <span className="text-text-secondary tabular-nums">
                      {room.bandwidth.toFixed(0)} <span className="text-text-faint">Mbps</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Migration indicator */}
        {isAuthorized && mounted && (
          <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded border border-info/20 bg-info/5 text-xs">
            <ArrowRight className="w-3 h-3 text-info" />
            <span className="text-info">
              Migration active — Match score: <span className="font-mono font-medium">{jaccardScore.toFixed(2)}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
