"use client";
import { useWebSocket } from "@/providers/WebSocketProvider";

interface Props {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: Props) {
  const { status, lastUpdate, data } = useWebSocket();

  return (
    <header className="header">
      <div>
        <div className="header-title">{title}</div>
        {subtitle && <div className="header-meta">{subtitle}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* ERP Context pill */}
        {data?.erp_context?.active_event && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", background: "rgba(59,130,246,0.1)", borderRadius: "var(--radius-full)", border: "1px solid rgba(59,130,246,0.2)" }}>
            <span style={{ fontSize: 10, color: "var(--blue)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {data.erp_context.active_event.event_type}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
              {data.erp_context.active_event.title.slice(0, 30)}{data.erp_context.active_event.title.length > 30 ? "…" : ""}
            </span>
          </div>
        )}

        {/* Demand level */}
        {data?.erp_context?.overall_demand_level && (
          <span className={`badge ${
            data.erp_context.overall_demand_level === "peak" ? "badge-critical" :
            data.erp_context.overall_demand_level === "high" ? "badge-degraded" :
            data.erp_context.overall_demand_level === "moderate" ? "badge-info" : "badge-teal"
          }`}>
            {data.erp_context.overall_demand_level}
          </span>
        )}

        {/* WS status */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
          <div className={`pulse-dot ${status === "connected" ? "" : status === "reconnecting" ? "amber" : "red"}`} style={{ width: 6, height: 6 }} />
          <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {lastUpdate ? lastUpdate.toLocaleTimeString() : "---"}
          </span>
        </div>

        {/* TIPS pipeline summary */}
        {data?.tips_pipeline && (
          <div style={{ display: "flex", gap: 8, fontSize: 11 }}>
            <span style={{ color: "var(--blue)" }}>{data.tips_pipeline.staged}↓staged</span>
            <span style={{ color: "var(--amber)" }}>{data.tips_pipeline.armed}⚡armed</span>
            <span style={{ color: "var(--green)" }}>{data.tips_pipeline.active}✓active</span>
          </div>
        )}
      </div>
    </header>
  );
}
