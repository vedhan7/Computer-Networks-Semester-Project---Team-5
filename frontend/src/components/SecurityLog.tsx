"use client";

import { useEngineStore } from "@/store/engineStore";
import { ShieldAlert, ArrowDown, ArrowUp } from "lucide-react";
import { useMemo } from "react";

export default function SecurityLog() {
  const { cnhsHistory } = useEngineStore();

  // Get only records where penalty > 0, sorted newest first
  const penalties = useMemo(() => {
    return cnhsHistory
      .filter(record => record.penalty > 0)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50); // Keep last 50 for UI performance
  }, [cnhsHistory]);

  return (
    <div className="bg-surface border border-border rounded-md p-5 flex flex-col h-full min-h-[300px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-warning" /> Security & Policy Log
        </h3>
        <span className="text-2xs text-text-faint">{penalties.length} events logged</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-2">
        {penalties.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-text-muted text-center p-4 border border-border border-dashed rounded-md">
            No deviations recorded. Network operating within nominal parameters.
          </div>
        ) : (
          penalties.map((record, i) => (
            <div key={`${record.timestamp}-${record.roomId}-${i}`} className="bg-surface-secondary border border-border rounded p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-primary">{record.roomId}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                    record.isOverUse ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                  }`}>
                    {record.isOverUse ? 'OVER-USE' : 'UNDER-USE'}
                  </span>
                </div>
                <span className="text-2xs text-text-faint font-mono">
                  {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              
              <div className="grid grid-cols-4 gap-2 text-xs font-mono mb-2 bg-bg p-2 rounded border border-border/50">
                <div>
                  <div className="text-[9px] text-text-faint uppercase mb-0.5">Exp</div>
                  <div className="text-text-muted">{record.expectedBandwidth}M</div>
                </div>
                <div>
                  <div className="text-[9px] text-text-faint uppercase mb-0.5">Act</div>
                  <div className={`flex items-center ${record.isOverUse ? 'text-danger' : 'text-warning'}`}>
                    {record.isOverUse ? <ArrowUp className="w-3 h-3 mr-0.5" /> : <ArrowDown className="w-3 h-3 mr-0.5" />}
                    {record.actualBandwidth}M
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-text-faint uppercase mb-0.5">D</div>
                  <div className="text-text-secondary">{Math.abs(record.deviation)}M</div>
                </div>
                <div>
                  <div className="text-[9px] text-text-faint uppercase mb-0.5">W_ac</div>
                  <div className="text-text-secondary">{record.w_ac}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                <span className="text-text-faint font-mono text-[10px]">
                  P = 0.8 * {Math.abs(record.deviation)} * {Math.log10(record.w_ac + 1).toFixed(3)}
                </span>
                <span className="font-semibold text-danger">
                  -{record.penalty.toFixed(1)} pts
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
