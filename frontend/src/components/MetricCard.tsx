"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: { value: string; direction: "up" | "down" | "neutral" };
  status?: "healthy" | "warning" | "critical" | "neutral";
  icon?: React.ReactNode;
}

export default function MetricCard({
  label,
  value,
  unit,
  trend,
  status = "neutral",
  icon,
}: MetricCardProps) {
  const statusColors = {
    healthy: "text-success",
    warning: "text-warning",
    critical: "text-danger",
    neutral: "text-text-primary",
  };

  const trendIcon = trend ? (
    trend.direction === "up" ? (
      <TrendingUp className="w-3 h-3" />
    ) : trend.direction === "down" ? (
      <TrendingDown className="w-3 h-3" />
    ) : (
      <Minus className="w-3 h-3" />
    )
  ) : null;

  const trendColor =
    trend?.direction === "up"
      ? "text-success"
      : trend?.direction === "down"
      ? "text-danger"
      : "text-text-muted";

  return (
    <div className="bg-surface border border-border rounded-md p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        {icon && <span className="text-text-faint">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span
          className={`text-2xl font-semibold tabular-nums ${statusColors[status]}`}
        >
          {value}
        </span>
        {unit && <span className="text-sm text-text-muted">{unit}</span>}
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
          {trendIcon}
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );
}
