"use client";
import DashboardShell from "@/components/layout/DashboardShell";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { useApiClient } from "@/providers/AuthProvider";
import { useState, useEffect } from "react";

interface APCREntry {
  id: string; intent_a_id: string; intent_b_id: string;
  resolution_action: string; academic_justification: string;
  bandwidth_reassignment: string; timestamp: string;
}

const resolutionColor: Record<string, string> = {
  preemption: "var(--red)", graceful_degradation: "var(--amber)",
  proportional: "var(--blue)", no_conflict: "var(--green)",
};
const resolutionIcon: Record<string, string> = {
  preemption: "🏆", graceful_degradation: "📉", proportional: "⚖️", no_conflict: "✓",
};

export default function ConflictsPage() {
  const { data: wsData } = useWebSocket();
  const api = useApiClient();
  const [log, setLog] = useState<APCREntry[]>([]);

  useEffect(() => {
    api("/api/healing/apcr-log?limit=50").then(setLog).catch(() => {});
  }, [api]);

  // Pull latest from WS
  useEffect(() => {
    if (wsData?.apcr_recent?.length) {
      setLog(prev => {
        const ids = new Set(prev.map((e) => e.id));
        const incoming = (wsData.apcr_recent as APCREntry[]).filter(e => !ids.has(e.id));
        return [...incoming, ...prev].slice(0, 100);
      });
    }
  }, [wsData?.apcr_recent]);

  const resolutionStats = log.reduce((acc, e) => {
    acc[e.resolution_action] = (acc[e.resolution_action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const TAXONOMY = [
    { label: "Online Exam", priority: 100, color: "var(--red)" },
    { label: "Accreditation Event", priority: 95, color: "var(--red)" },
    { label: "Lab Session", priority: 70, color: "var(--blue)" },
    { label: "Lecture", priority: 60, color: "var(--cyan)" },
    { label: "Admin / ERP", priority: 55, color: "var(--teal)" },
    { label: "Research", priority: 45, color: "var(--purple)" },
    { label: "Campus Event", priority: 40, color: "var(--purple)" },
    { label: "Student General", priority: 30, color: "var(--text-secondary)" },
    { label: "Staff General", priority: 20, color: "var(--text-muted)" },
    { label: "Free Period", priority: 10, color: "var(--text-muted)" },
    { label: "Maintenance", priority: 5, color: "var(--text-muted)" },
  ];

  return (
    <DashboardShell title="APCR Conflict Resolution" subtitle="Academic Priority Taxonomy · intent conflict log · resolution audit">
      <div className="grid-2" style={{ marginBottom: 20, gap: 20 }}>
        {/* Academic Priority Taxonomy */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14 }}>Academic Priority Taxonomy</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 14 }}>
            When intents compete for the same network segment, APCR resolves conflicts using this institutional hierarchy.
          </div>
          {TAXONOMY.map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "7px 0",
              borderBottom: i < TAXONOMY.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: item.color, width: 36, textAlign: "right" }}>
                {item.priority}
              </div>
              <div className="progress-track" style={{ flex: 1, height: 4 }}>
                <div className="progress-fill" style={{ width: `${item.priority}%`, background: item.color, opacity: 0.6 }} />
              </div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", width: 160 }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14 }}>Resolution Statistics</div>
          {Object.keys(resolutionStats).length === 0 ? (
            <div className="empty-state" style={{ padding: "20px 0" }}>
              <div style={{ fontSize: 24 }}>⚖️</div>
              <p>No conflicts resolved yet.</p>
              <p style={{ fontSize: 11, marginTop: 4 }}>APCR activates when two intents compete for the same segment.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {Object.entries(resolutionStats).map(([action, count]) => (
                <div key={action} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>{resolutionIcon[action] || "❓"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: resolutionColor[action] }}>
                        {action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-secondary)" }}>{count}</span>
                    </div>
                    <div className="progress-track" style={{ height: 4 }}>
                      <div className="progress-fill" style={{
                        width: `${(count / Math.max(...Object.values(resolutionStats))) * 100}%`,
                        background: resolutionColor[action],
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* How APCR works */}
          <div style={{ marginTop: 24 }}>
            <div className="section-title">How APCR Works</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {[
                { icon: "🏆", label: "Preemption", desc: "Higher-priority intent wins, lower is throttled" },
                { icon: "📉", label: "Graceful Degradation", desc: "Lower-priority intent is reduced to fit remaining capacity" },
                { icon: "⚖️", label: "Proportional", desc: "Equal-priority intents share bandwidth proportionally" },
              ].map(({ icon, label, desc }) => (
                <div key={label} className="card-elevated" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* APCR Log */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>APCR Resolution Log</div>
          <button className="btn btn-ghost btn-sm" onClick={() => api("/api/healing/apcr-log?limit=50").then(setLog)}>↻ Refresh</button>
        </div>
        {log.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⚖️</div>
            <p>No conflicts detected yet.</p>
            <p style={{ fontSize: 11, marginTop: 4 }}>Try creating two intents that target the same segment.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Resolution</th><th>Intent A</th><th>Intent B</th><th>Justification</th><th>Time</th>
                </tr>
              </thead>
              <tbody>
                {log.map(entry => (
                  <tr key={entry.id}>
                    <td>
                      <span style={{ color: resolutionColor[entry.resolution_action], fontWeight: 600, fontSize: 12 }}>
                        {resolutionIcon[entry.resolution_action]} {entry.resolution_action?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
                      {entry.intent_a_id?.slice(0, 12) ?? "—"}…
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
                      {entry.intent_b_id?.slice(0, 12) ?? "—"}…
                    </td>
                    <td style={{ fontSize: 12, maxWidth: 300, color: "var(--text-secondary)" }}>
                      {entry.academic_justification}
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-muted)" }}>
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
