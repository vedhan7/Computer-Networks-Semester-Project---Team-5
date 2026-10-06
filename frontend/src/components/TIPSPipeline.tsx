"use client";

import { useSDNStore } from "@/store/useSDNStore";
import { CheckCircle2, Clock, Zap, XCircle } from "lucide-react";

export default function TIPSPipeline() {
  const { tipsJobs } = useSDNStore();

  const stateConfig: Record<string, {
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
    label: string;
  }> = {
    STAGED: {
      icon: <Clock className="w-3.5 h-3.5" />,
      color: "text-text-muted",
      bgColor: "bg-surface-secondary",
      borderColor: "border-border",
      label: "Staged",
    },
    ARMED: {
      icon: <Zap className="w-3.5 h-3.5" />,
      color: "text-warning",
      bgColor: "bg-warning/5",
      borderColor: "border-warning/20",
      label: "Armed",
    },
    ACTIVE: {
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      color: "text-accent",
      bgColor: "bg-accent/5",
      borderColor: "border-accent/20",
      label: "Active",
    },
    EXPIRED: {
      icon: <XCircle className="w-3.5 h-3.5" />,
      color: "text-text-faint",
      bgColor: "bg-surface-secondary/50",
      borderColor: "border-border/50",
      label: "Expired",
    },
  };

  if (tipsJobs.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-md p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-4">TIPS Pipeline</h3>
        <div className="flex items-center justify-center h-24 text-text-muted text-sm">
          No scheduled transitions.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-md p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-medium text-text-secondary">TIPS Pipeline</h3>
        <span className="text-2xs text-text-faint">
          {tipsJobs.length} transition{tipsJobs.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute top-5 left-5 right-5 h-px bg-border" />

        <div className="flex justify-between relative">
          {tipsJobs.map((job) => {
            const config = stateConfig[job.state] || stateConfig.STAGED;
            return (
              <div key={job.id} className="flex flex-col items-center gap-2 relative z-10">
                {/* Node */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${config.borderColor} ${config.bgColor} ${config.color}`}>
                  {config.icon}
                </div>

                {/* Label */}
                <div className="flex flex-col items-center gap-0.5">
                  <span className={`text-2xs font-medium uppercase tracking-wider ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="text-2xs text-text-faint font-mono">{job.classId}</span>
                  <span className="text-2xs text-text-faint font-mono">{job.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
