"use client";

import { useEngineStore } from "@/store/engineStore";
import { CheckCircle2, Clock, Zap, XCircle, Timer } from "lucide-react";
import { TipsState } from "@/lib/engine/tips";

export default function TIPSPipeline() {
  const { tipsJobs, currentTime } = useEngineStore();

  const stateConfig: Record<TipsState, {
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    borderColor: string;
    label: string;
  }> = {
    PENDING: {
      icon: <Timer className="w-3.5 h-3.5" />,
      color: "text-text-faint",
      bgColor: "bg-surface-secondary",
      borderColor: "border-border",
      label: "Pending",
    },
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

  // Only show jobs that are currently active or soon to be
  const visibleJobs = tipsJobs
    .filter(job => job.currentState !== 'EXPIRED' && job.stagedTime - currentTime < 3600 * 1000)
    .sort((a, b) => a.startTime - b.startTime);

  const formatCountdown = (targetTime: number) => {
    const diff = targetTime - currentTime;
    if (diff < 0) return "NOW";
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (visibleJobs.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-md p-5">
        <h3 className="text-sm font-medium text-text-secondary mb-4">TIPS Pipeline</h3>
        <div className="flex items-center justify-center h-24 text-text-muted text-sm">
          No transitions scheduled in the next hour.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface border border-border rounded-md p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-medium text-text-secondary">TIPS Pipeline</h3>
        <span className="text-2xs text-text-faint">
          {visibleJobs.length} transition{visibleJobs.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-4">
        {visibleJobs.map((job) => {
          const config = stateConfig[job.currentState];
          
          let nextTransitionLabel = "";
          let nextTransitionTime = 0;

          if (job.currentState === 'PENDING') {
            nextTransitionLabel = "Staging in";
            nextTransitionTime = job.stagedTime;
          } else if (job.currentState === 'STAGED') {
            nextTransitionLabel = "Arming in";
            nextTransitionTime = job.armedTime;
          } else if (job.currentState === 'ARMED') {
            nextTransitionLabel = "Activating in";
            nextTransitionTime = job.activeTime;
          } else if (job.currentState === 'ACTIVE') {
            nextTransitionLabel = "Expiring in";
            nextTransitionTime = job.expiredTime;
          }

          return (
            <div key={job.eventId} className="flex items-center justify-between p-3 rounded-md border border-border bg-surface-secondary/50">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${config.borderColor} ${config.bgColor} ${config.color}`}>
                  {config.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-text-secondary font-mono">{job.course}</span>
                  <span className="text-2xs text-text-muted">{job.room}</span>
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-1">
                <span className={`text-xs font-semibold uppercase tracking-wider ${config.color}`}>
                  {config.label}
                </span>
                {nextTransitionTime > 0 && (
                  <span className="text-2xs text-text-faint font-mono tabular-nums">
                    {nextTransitionLabel} {formatCountdown(nextTransitionTime)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
