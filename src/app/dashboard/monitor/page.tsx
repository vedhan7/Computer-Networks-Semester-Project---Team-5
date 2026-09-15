"use client";
import DashboardShell from "@/components/layout/DashboardShell";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend } from "recharts";

const SEGMENT_LABELS: Record<string, string> = {
  campus_root: "Campus Uplink", block_a: "Block A", lab_a1: "Prog Lab A1",
  lab_a2: "Electronics A2", halls_a: "Lecture Halls", block_b: "Block B",
  lab_b1: "Network Lab B1", exam_hall: "Exam Hall", hostel: "Hostel",
  admin_block: "Admin Block", library: "Library",
};

const statusBg = (s: string) =>
  s === "healthy" ? "rgba(16,185,129,0.08)" : s === "degraded" ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.1)";
const statusBorder = (s: string) =>
  s === "healthy" ? "rgba(16,185,129,0.25)" : s === "degraded" ? "rgba(245,158,11,0.25)" : "rgba(239,68,68,0.3)";
const statusColor = (s: string) =>
  s === "healthy" ? "var(--green)" : s === "degraded" ? "var(--amber)" : "var(--red)";

export default function MonitorPage() {
  const { data } = useWebSocket();
  const [selected, setSelected] = useState<string | null>(null);

  if (!data) return (
    <DashboardShell title="Network Monitor" subtitle="Real-time CRATE scores and traffic analysis">
      <div className="empty-state"><div className="empty-icon">📡</div><p>Waiting for live data…</p></div>
    </DashboardShell>
  );

  const selectedSeg = data.segments?.find(s => s.segment_id === selected);

  // Build chart data from history
  const historyData = selectedSeg?.history?.map((h, i) => ({
    t: String(i * 2) + "s",
    util: h,
    predicted: selectedSeg.predicted_utilization,
  })) ?? [];

  // Campus overview bar data
  const barData = data.segments?.map(s => ({
    name: SEGMENT_LABELS[s.segment_id]?.slice(0, 12) || s.segment_id,
    util: s.utilization_percent,
    predicted: s.predicted_utilization,
  })) ?? [];

  return (
    <DashboardShell title="Network Monitor" subtitle="CRATE context-relative health · live traffic · per-segment deep-dive">
      {/* Campus utilization bar chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 13 }}>Campus-Wide Utilization vs. CRATE Prediction</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} margin={{ top: 0, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--text-muted)" }} />
            <YAxis tick={{ fontSize: 9, fill: "var(--text-muted)" }} domain={[0, 100]} unit="%" />
            <Tooltip contentStyle={{ background: "var(--acorn-elevated)", border: "1px solid var(--acorn-border)", borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11, color: "var(--text-muted)" }} />
            <Bar dataKey="util" name="Observed %" fill="var(--cyan)" radius={[4,4,0,0]} opacity={0.8} />
            <Bar dataKey="predicted" name="Predicted %" fill="rgba(167,139,250,0.5)" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Segment grid */}
      <div className="grid-3" style={{ marginBottom: 20 }}>
        {data.segments?.map(seg => (
          <div key={seg.segment_id}
            className="card"
            onClick={() => setSelected(seg.segment_id === selected ? null : seg.segment_id)}
            style={{
              cursor: "pointer",
              background: statusBg(seg.status),
              borderColor: selected === seg.segment_id ? statusColor(seg.status) : statusBorder(seg.status),
              boxShadow: selected === seg.segment_id ? `0 0 20px ${statusColor(seg.status)}22` : "none",
              transition: "all 0.2s ease",
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>
                  {SEGMENT_LABELS[seg.segment_id] || seg.segment_id}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
                  {seg.segment_id}
                </div>
              </div>
              <span className={`badge badge-${seg.status}`}>{seg.status}</span>
            </div>

            {/* CNHS */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>CNHS</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: statusColor(seg.status) }}>
                  {seg.cnhs?.toFixed(1)}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Util</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: "var(--text-primary)" }}>
                  {seg.utilization_percent?.toFixed(1)}%
                </div>
                <div style={{ fontSize: 9, color: "var(--text-muted)" }}>
                  pred: {seg.predicted_utilization?.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Utilization bar */}
            <div className="progress-track">
              <div className="progress-fill" style={{
                width: `${seg.utilization_percent}%`,
                background: seg.utilization_percent > 85 ? "var(--red)" : seg.utilization_percent > 60 ? "var(--amber)" : "var(--green)",
              }} />
            </div>

            {/* Mini stats */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--text-muted)" }}>
              <span>⏱ {seg.latency_ms?.toFixed(0)}ms</span>
              <span>📉 {seg.packet_loss_percent?.toFixed(2)}%</span>
              <span>👥 {seg.active_connections}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Deep-dive panel */}
      {selectedSeg && (
        <div className="card fade-in" style={{ borderColor: `${statusColor(selectedSeg.status)}33` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>
                {SEGMENT_LABELS[selectedSeg.segment_id]} — Deep Dive
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>CRATE Analysis</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕ Close</button>
          </div>

          {/* CRATE explanation */}
          <div className="alert alert-info" style={{ marginBottom: 16, fontSize: 12, lineHeight: 1.7 }}>
            <span>🔬</span>
            <span>{selectedSeg.explanation}</span>
          </div>

          <div className="grid-2">
            {/* History chart */}
            <div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>Utilization History (last 2 min)</div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={historyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="utilGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={statusColor(selectedSeg.status)} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={statusColor(selectedSeg.status)} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="t" tick={{ fontSize: 9, fill: "var(--text-muted)" }} interval="preserveStartEnd" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "var(--text-muted)" }} />
                  <Tooltip contentStyle={{ background: "var(--acorn-elevated)", border: "1px solid var(--acorn-border)", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="util" name="Observed %" stroke={statusColor(selectedSeg.status)} fill="url(#utilGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="predicted" name="Predicted %" stroke="var(--purple)" fill="none" strokeDasharray="4 2" strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Stats grid */}
            <div className="grid-2" style={{ gap: 10, alignContent: "start" }}>
              {[
                { label: "CNHS Score", value: selectedSeg.cnhs?.toFixed(1), color: statusColor(selectedSeg.status) },
                { label: "Deviation", value: `${selectedSeg.deviation_percent?.toFixed(1)}%` },
                { label: "Criticality Weight", value: String(selectedSeg.criticality_weight) },
                { label: "Activity Context", value: selectedSeg.activity_context?.toUpperCase() },
                { label: "Latency", value: `${selectedSeg.latency_ms?.toFixed(1)} ms`, color: selectedSeg.latency_ms > 150 ? "var(--red)" : undefined },
                { label: "Packet Loss", value: `${selectedSeg.packet_loss_percent?.toFixed(3)}%`, color: selectedSeg.packet_loss_percent > 0.5 ? "var(--red)" : undefined },
                { label: "Used BW", value: `${selectedSeg.used_mbps} Mbps` },
                { label: "Connections", value: String(selectedSeg.active_connections) },
              ].map(({ label, value, color }) => (
                <div key={label} className="card-elevated">
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700, color: color || "var(--text-primary)", marginTop: 3 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
