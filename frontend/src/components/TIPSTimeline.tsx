"use client";

import { useSDNStore } from "@/store/useSDNStore";
import { Clock } from "lucide-react";

export default function TIPSTimeline() {
  const { tipsJobs } = useSDNStore();

  const getStateStyles = (state: string) => {
    switch (state) {
      case "STAGED":
        return "border-kinetic-purple/30 bg-transparent text-gray-400";
      case "ARMED":
        return "border-kinetic-purple bg-kinetic-purple/20 text-kinetic-purple";
      case "ACTIVE":
        return "border-quantum-teal bg-quantum-teal/20 text-quantum-teal shadow-[0_0_15px_rgba(45,212,191,0.2)]";
      case "EXPIRED":
        return "border-surface-border bg-obsidian text-gray-600";
      default:
        return "border-surface-border bg-obsidian";
    }
  };

  return (
    <div className="bg-surface border border-surface-border p-6 rounded-xl col-span-full">
      <div className="flex items-center gap-3 mb-8">
        <Clock className="w-4 h-4 text-gray-500" />
        <h3 className="text-gray-400 text-xs uppercase tracking-widest font-semibold">
          TIPS Pipeline
        </h3>
      </div>

      <div className="relative flex items-center justify-between w-full pb-4">
        {/* Connecting Line */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-surface-border -z-10 -translate-y-1/2" />

        {tipsJobs.map((job) => (
          <div key={job.id} className="flex flex-col items-center">
            {/* Timeline Node */}
            <div className={`w-24 py-2 border rounded-md flex flex-col items-center justify-center transition-all ${getStateStyles(job.state)}`}>
              <span className="text-[10px] uppercase tracking-wider font-bold mb-1">{job.state}</span>
              <span className="text-xs font-mono">{job.classId}</span>
            </div>
            {/* Timestamp label */}
            <span className="text-gray-500 text-xs font-mono mt-3">{job.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
