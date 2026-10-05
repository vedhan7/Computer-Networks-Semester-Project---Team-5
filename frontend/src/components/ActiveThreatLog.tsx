"use client";

import { useSDNStore } from "@/store/useSDNStore";

export default function ActiveThreatLog() {
  const { threatLogs } = useSDNStore();

  return (
    <div className="bg-surface border border-surface-border p-6 rounded-xl flex flex-col h-full">
      <h3 className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-6">
        Active Threat Log
      </h3>
      
      <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-surface-border/50 text-gray-500 text-[10px] uppercase tracking-wider">
              <th className="pb-3 font-medium">Time</th>
              <th className="pb-3 font-medium text-right">U_obs</th>
              <th className="pb-3 font-medium text-right">U_pred</th>
              <th className="pb-3 font-medium text-right">Dev (D)</th>
              <th className="pb-3 font-medium text-right">W_ac</th>
              <th className="pb-3 font-medium text-right">CNHS</th>
            </tr>
          </thead>
          <tbody className="text-sm font-mono text-gray-300">
            {threatLogs.map((log) => (
              <tr 
                key={log.id} 
                className={`border-b border-surface-border/30 hover:bg-obsidian/50 transition-colors ${
                  log.cnhs < 80 ? "text-anomaly-critical bg-anomaly-critical/5" : ""
                }`}
              >
                <td className="py-3 text-gray-500">{log.timestamp}</td>
                <td className="py-3 text-right">{log.u_obs}</td>
                <td className="py-3 text-right text-gray-500">{log.u_pred}</td>
                <td className="py-3 text-right">{log.deviation}</td>
                <td className="py-3 text-right">{log.w_ac}</td>
                <td className="py-3 text-right font-bold">{log.cnhs.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
