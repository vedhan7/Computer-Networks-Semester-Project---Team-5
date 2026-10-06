"use client";

import { useSDNStore } from "@/store/useSDNStore";
import StatusBadge from "./StatusBadge";

export default function ThreatTable() {
  const { threatLogs } = useSDNStore();

  const getSeverity = (cnhs: number) => {
    if (cnhs < 60) return "critical" as const;
    if (cnhs < 80) return "high" as const;
    if (cnhs < 90) return "medium" as const;
    return "low" as const;
  };

  if (threatLogs.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-md p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-4">Threat Events</h3>
        <div className="flex items-center justify-center h-40 text-text-muted text-sm">
          No active threats detected.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-md p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-secondary">Threat Events</h3>
        <span className="text-2xs text-text-faint tabular-nums">
          {threatLogs.length} event{threatLogs.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-auto -mx-5 px-5">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-border text-2xs font-medium text-text-faint uppercase tracking-wider">
              <th className="pb-2.5 pr-4">Time</th>
              <th className="pb-2.5 pr-4">Source</th>
              <th className="pb-2.5 pr-4 text-right">Observed</th>
              <th className="pb-2.5 pr-4 text-right">Predicted</th>
              <th className="pb-2.5 pr-4 text-right">Deviation</th>
              <th className="pb-2.5 pr-4 text-right">CNHS</th>
              <th className="pb-2.5 text-right">Severity</th>
            </tr>
          </thead>
          <tbody>
            {threatLogs.map((log) => {
              const severity = getSeverity(log.cnhs);
              const isCriticalRow = log.cnhs < 80;
              return (
                <tr
                  key={log.id}
                  className={`border-b border-border/50 transition-colors hover:bg-surface-secondary/50 ${
                    isCriticalRow ? "bg-danger/[0.03]" : ""
                  }`}
                >
                  <td className="py-2.5 pr-4 text-xs text-text-muted font-mono">
                    {log.timestamp}
                  </td>
                  <td className="py-2.5 pr-4 text-sm text-text-secondary font-mono">
                    {log.id}
                  </td>
                  <td className="py-2.5 pr-4 text-sm text-right tabular-nums text-text-primary">
                    {log.u_obs.toFixed(1)}
                    <span className="text-text-faint ml-1 text-xs">Mbps</span>
                  </td>
                  <td className="py-2.5 pr-4 text-sm text-right tabular-nums text-text-muted">
                    {log.u_pred.toFixed(1)}
                  </td>
                  <td className="py-2.5 pr-4 text-sm text-right tabular-nums text-text-secondary">
                    {log.deviation.toFixed(1)}
                  </td>
                  <td className={`py-2.5 pr-4 text-sm text-right tabular-nums font-medium ${
                    log.cnhs < 80 ? "text-danger" : log.cnhs < 90 ? "text-warning" : "text-text-primary"
                  }`}>
                    {log.cnhs.toFixed(1)}
                  </td>
                  <td className="py-2.5 text-right">
                    <StatusBadge severity={severity} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
