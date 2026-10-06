"use client";

interface StatusBadgeProps {
  severity: "low" | "medium" | "high" | "critical" | "healthy" | "info";
  label?: string;
}

export default function StatusBadge({ severity, label }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    low: "bg-info/10 text-info border-info/20",
    medium: "bg-warning/10 text-warning border-warning/20",
    high: "bg-warning/15 text-warning border-warning/25",
    critical: "bg-danger/10 text-danger border-danger/20",
    healthy: "bg-success/10 text-success border-success/20",
    info: "bg-surface-secondary text-text-secondary border-border",
  };

  const displayLabel = label || severity.charAt(0).toUpperCase() + severity.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-2xs font-medium border uppercase tracking-wider ${styles[severity]}`}
    >
      <span className={`w-1 h-1 rounded-full ${
        severity === "critical" ? "bg-danger" :
        severity === "high" ? "bg-warning" :
        severity === "medium" ? "bg-warning" :
        severity === "low" ? "bg-info" :
        severity === "healthy" ? "bg-success" :
        "bg-text-muted"
      }`} />
      {displayLabel}
    </span>
  );
}
