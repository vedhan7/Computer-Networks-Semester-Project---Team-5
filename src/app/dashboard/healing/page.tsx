"use client";
import DashboardShell from "@/components/layout/DashboardShell";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { useApiClient } from "@/providers/AuthProvider";
import { useState, useEffect } from "react";

interface HealingEntry {
  id: string; fault_type: string; severity: string; segment_id: string;
  activity_context: string; strategy_name: string; aggression: number;
  steps: string[]; description?: string;
  success: boolean; timestamp: string; resolved_at: string | null;
}

const aggressionColor = (a: number) =>
  a >= 5 ? "var(--red)" : a >= 3 ? "var(--amber)" : "var(--green)";

const faultTypeIcon: Record<string, string> = {
  link_saturation: "📈", high_packet_loss: "📉", link_down: "🔴",
  unauthorized_traffic: "🚫", latency_spike: "⏱", default: "⚠️",
};

const SEGMENTS_LABELS: Record<string, string> = {
  campus_root: "Campus Uplink", block_a: "Block A", lab_a1: "Prog Lab A1",
  lab_a2: "Electronics A2", halls_a: "Lecture Halls", block_b: "Block B",
  lab_b1: "Network Lab B1", exam_hall: "Exam Hall", hostel: "Hostel",
  admin_block: "Admin Block", library: "Library",
};

export default function HealingPage() {
  const { data: wsData } = useWebSocket();
  const api = useApiClient();
  const [log, setLog] = useState<HealingEntry[]>([]);
  const [simulateSeg, setSimulateSeg] = useState("lab_a1");
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<string | null>(null);

  const fetchLog = () => api("/api/healing/log?limit=50").then(setLog).catch(() => {});
  useEffect(() => { fetchLog(); }, []);

  // Merge WS recent healing into log
  useEffect(() => {
    if (wsData?.new_healing_events?.length) {
      setLog(prev => {
        const existing = new Set(prev.map(e => e.id));
        const incoming = (wsData.new_healing_events as HealingEntry[]).filter(e => !existing.has(e.id));
        return [...incoming, ...prev].slice(0, 100);
      });
    }
  }, [wsData?.new_healing_events]);

  const handleSimulate = async () => {
    setSimulating(true); setSimResult(null);
    try {
      await api("/api/healing/simulate", {
        method: "POST",
        body: JSON.stringify({ segment_id: simulateSeg, fault_type: "link_saturation" }),
      });
      setSimResult(`Fault injected on ${simulateSeg}. CASH will respond within 5 seconds.`);
      setTimeout(fetchLog, 6000);
    } catch { setSimResult("Simulation failed."); } finally { setSimulating(false); }
  };

  const activeFaults = (wsData?.active_faults as HealingEntry[]) ?? [];

  return (
    <DashboardShell title="CASH Self-Healing" subtitle="Context-Aware Self-Healing — 25-cell Context-Healing Matrix">
      {/* Active faults banner */}
      {activeFaults.length > 0 && (
        <div className="card" style={{ marginBottom: 20, background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.25)" }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--red)", marginBottom: 12 }}>
            🚨 Active Faults ({activeFaults.length}) — CASH Healing In Progress
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {activeFaults.map((fault, i) => (
              <div key={i} className="card-elevated" style={{ borderColor: "rgba(239,68,68,0.3)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--red)" }}>
                    {faultTypeIcon[fault.fault_type] || faultTypeIcon.default} {fault.fault_type?.replace(/_/g, " ")}
                  </span>
                  <span className={`badge badge-${fault.severity === "critical" ? "critical" : "degraded"}`}>{fault.severity}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  {SEGMENTS_LABELS[fault.segment_id] || fault.segment_id}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                  Context: {fault.activity_context}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid-2" style={{ marginBottom: 20, gap: 20 }}>
        {/* CASH Matrix visualization */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>CASH Context-Healing Matrix</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 12 }}>
            25 pre-computed strategies: fault_type × activity_type
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 10 }}>
              <thead>
                <tr>
                  <th style={{ padding: "4px 6px", color: "var(--text-muted)", textAlign: "left" }}>Fault ↓ / Context →</th>
                  {["EXAM", "LAB", "LECTURE", "EVENT", "FREE"].map(c => (
                    <th key={c} style={{ padding: "4px 6px", color: "var(--text-muted)", textAlign: "center", fontSize: 9 }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { fault: "Link Saturation", strategies: [5, 3, 2, 2, 1] },
                  { fault: "Packet Loss", strategies: [5, 3, 2, 2, 1] },
                  { fault: "Link Down", strategies: [5, 4, 3, 3, 2] },
                  { fault: "Unauth Traffic", strategies: [5, 3, 1, 1, 1] },
                  { fault: "Latency Spike", strategies: [4, 2, 1, 1, 1] },
                ].map(({ fault, strategies }) => (
                  <tr key={fault}>
                    <td style={{ padding: "4px 6px", color: "var(--text-secondary)", fontWeight: 500 }}>{fault}</td>
                    {strategies.map((agg, i) => (
                      <td key={i} style={{
                        padding: "4px 6px", textAlign: "center",
                        background: agg === 5 ? "rgba(239,68,68,0.15)" : agg >= 3 ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.08)",
                        border: "1px solid rgba(255,255,255,0.04)",
                      }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: aggressionColor(agg) }}>{agg}</div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 8, display: "flex", gap: 12, fontSize: 10, color: "var(--text-muted)" }}>
              <span style={{ color: "var(--red)" }}>■ 5 = Emergency</span>
              <span style={{ color: "var(--amber)" }}>■ 3-4 = Warning</span>
              <span style={{ color: "var(--green)" }}>■ 1-2 = Soft</span>
            </div>
          </div>
        </div>

        {/* Simulate fault */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14 }}>Fault Simulation (Demo)</div>
          <div style={{ marginBottom: 14 }}>
            <label className="label">Target Segment</label>
            <select className="input" id="simulate-segment" value={simulateSeg}
              onChange={e => setSimulateSeg(e.target.value)}
              style={{ cursor: "pointer" }}>
              {Object.entries(SEGMENTS_LABELS).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
          <div className="alert alert-warning" style={{ marginBottom: 14 }}>
            <span>⚡</span>
            <span>Injects a link saturation fault. CASH will detect and apply a context-indexed strategy within ~5 seconds.</span>
          </div>
          <button className="btn btn-danger w-full" onClick={handleSimulate} disabled={simulating}>
            {simulating ? <><div className="spinner" />Injecting fault…</> : "🔥 Inject Fault"}
          </button>
          {simResult && (
            <div className="alert alert-info fade-in" style={{ marginTop: 10 }}>
              <span>ℹ</span>{simResult}
            </div>
          )}

          {/* Stats */}
          <div style={{ marginTop: 20 }}>
            <div className="section-title">Healing Statistics</div>
            <div className="grid-2" style={{ gap: 8 }}>
              {[
                { label: "Total Healed", value: String(log.length) },
                { label: "Active Faults", value: String(activeFaults.length), color: activeFaults.length > 0 ? "var(--red)" : "var(--green)" },
                { label: "Avg Aggression", value: log.length > 0 ? (log.reduce((s, e) => s + (e.aggression || 1), 0) / log.length).toFixed(1) : "—" },
                { label: "Success Rate", value: log.length > 0 ? `${((log.filter(e => e.success).length / log.length) * 100).toFixed(0)}%` : "—", color: "var(--green)" },
              ].map(({ label, value, color }) => (
                <div key={label} className="card-elevated">
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>{label}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700, color: color || "var(--text-primary)", marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Healing log */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Healing Log</div>
          <button className="btn btn-ghost btn-sm" onClick={fetchLog}>↻ Refresh</button>
        </div>
        {log.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🔧</div><p>No healing events yet. Inject a fault to see CASH in action.</p></div>
        ) : (
          <div className="scroll-feed" style={{ maxHeight: 480 }}>
            {log.map(entry => (
              <div key={entry.id} className="healing-entry">
                <div className="healing-dot" style={{
                  background: entry.severity === "critical" ? "var(--red)" : "var(--amber)"
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                      {faultTypeIcon[entry.fault_type] || "⚠️"} {entry.fault_type?.replace(/_/g, " ")}
                      <span style={{ fontSize: 11, fontWeight: 400, color: "var(--text-muted)", marginLeft: 6 }}>
                        on {SEGMENTS_LABELS[entry.segment_id] || entry.segment_id}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span className={`badge badge-${entry.severity === "critical" ? "critical" : "degraded"}`}>{entry.severity}</span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--blue)", marginTop: 3 }}>
                    Strategy: <strong>{entry.strategy_name}</strong>
                    <span style={{ marginLeft: 8, color: aggressionColor(entry.aggression) }}>
                      Aggression: {entry.aggression}/5
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    Context: {entry.activity_context}
                    {entry.resolved_at && <span style={{ color: "var(--green)", marginLeft: 8 }}>✓ Resolved {new Date(entry.resolved_at).toLocaleTimeString()}</span>}
                  </div>
                  {/* Steps */}
                  <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 2 }}>
                    {(Array.isArray(entry.steps) ? entry.steps : []).map((step, si) => (
                      <div key={si} style={{ fontSize: 11, color: "var(--text-secondary)", paddingLeft: 10, borderLeft: "2px solid rgba(255,255,255,0.08)" }}>
                        {si + 1}. {step}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
