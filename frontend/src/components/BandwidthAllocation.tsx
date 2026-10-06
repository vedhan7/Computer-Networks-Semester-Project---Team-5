"use client";

import { useSDNStore } from "@/store/useSDNStore";

export default function BandwidthAllocation() {
  const { allocations, bandwidthCapacity } = useSDNStore();

  if (allocations.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-md p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-4">Bandwidth Allocation</h3>
        <div className="flex items-center justify-center h-32 text-text-muted text-sm">
          Waiting for allocation data...
        </div>
      </div>
    );
  }

  const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedMbps, 0);
  const utilizationPct = bandwidthCapacity > 0 ? (totalAllocated / bandwidthCapacity) * 100 : 0;

  return (
    <div className="bg-surface border border-border rounded-md p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-secondary">Bandwidth Allocation</h3>
        <span className="text-2xs text-text-faint">
          Capacity: <span className="text-text-muted tabular-nums">{bandwidthCapacity}</span> Mbps
        </span>
      </div>

      {/* Global utilization */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-text-muted">Total utilization</span>
          <span className="tabular-nums font-medium text-text-secondary">
            {totalAllocated.toFixed(0)} / {bandwidthCapacity} Mbps
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-surface-secondary overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              utilizationPct > 90 ? "bg-danger" : utilizationPct > 75 ? "bg-warning" : "bg-accent"
            }`}
            style={{ width: `${Math.min(100, utilizationPct)}%` }}
          />
        </div>
      </div>

      {/* Per-room bars */}
      <div className="space-y-3.5">
        {allocations.map((alloc) => {
          const pct = bandwidthCapacity > 0 ? (alloc.allocatedMbps / bandwidthCapacity) * 100 : 0;
          const isHigh = pct > 80;
          return (
            <div key={alloc.classId}>
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-text-secondary">{alloc.classId}</span>
                  <span className="text-text-faint text-2xs">
                    {alloc.studentCount} device{alloc.studentCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <span className={`tabular-nums font-medium ${isHigh ? "text-warning" : "text-text-secondary"}`}>
                  {alloc.allocatedMbps.toFixed(0)} Mbps
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-surface-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isHigh ? "bg-warning" : "bg-accent/70"
                  }`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
