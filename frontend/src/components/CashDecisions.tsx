"use client";

import { useEngineStore } from "@/store/engineStore";
import { resolveCashConflict } from "@/lib/engine/cash";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function CashDecisions() {
  const { topology, tipsJobs } = useEngineStore();

  // Find if there is a link failure in the core->building links
  const coreFailures = topology.links.filter(l => l.source === 'CORE' && l.isFailed);

  if (coreFailures.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-md p-5 flex flex-col items-center justify-center text-text-muted h-full min-h-[300px]">
        <AlertCircle className="w-8 h-8 mb-4 opacity-50" />
        <p className="text-sm font-medium">CASH Standby</p>
        <p className="text-xs text-text-faint mt-1">No core link failures detected.</p>
      </div>
    );
  }

  // If a core link is failed, CASH activates. Let's assume the fallback link capacity is 30% of the original.
  const failedLink = coreFailures[0];
  const fallbackCapacity = failedLink.capacityMbps * 0.3; // E.g. 3000 Mbps

  // Get active jobs in the affected building
  // `target` of the failed link is the building switch, e.g., 'SW-ALPHA'.
  // Jobs are located in rooms like 'Alpha-101'.
  const bldgPrefix = failedLink.target.split('-')[1]; // 'ALPHA'
  
  const affectedJobs = tipsJobs.filter(j => 
    j.currentState === 'ACTIVE' && 
    j.room.toUpperCase().startsWith(bldgPrefix)
  );

  const decisions = resolveCashConflict(affectedJobs, fallbackCapacity);

  return (
    <div className="bg-surface border border-border rounded-md p-5 flex flex-col h-full min-h-[300px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-danger flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> CASH Active (Link Failure)
          </h3>
          <p className="text-[10px] text-text-faint mt-1">Routing via fallback path ({fallbackCapacity} Mbps max)</p>
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto pr-2">
        {decisions.map(d => (
          <div key={d.jobId} className={`p-3 rounded-md border ${
            d.status === 'RE_ROUTED' 
              ? 'bg-warning/10 border-warning/30' 
              : 'bg-danger/10 border-danger/30'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-primary">{d.course} (W_ac: {d.w_ac})</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${
                d.status === 'RE_ROUTED' ? 'text-warning bg-warning/20' : 'text-danger bg-danger/20'
              }`}>
                {d.status === 'RE_ROUTED' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {d.status}
              </span>
            </div>
            
            <p className="text-[10px] text-text-muted font-mono leading-relaxed">
              {d.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
