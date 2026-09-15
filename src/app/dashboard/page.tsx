"use client";
import DashboardShell from "@/components/layout/DashboardShell";
import { useWebSocket } from "@/providers/WebSocketProvider";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useState, useEffect } from "react";

const SEGMENT_LABELS: Record<string, string> = {
  campus_root: "Campus Uplink",
  block_a: "Block A",
  lab_a1: "Prog Lab A1",
  lab_a2: "Electronics A2",
  halls_a: "Lecture Halls",
  block_b: "Block B",
  lab_b1: "Network Lab B1",
  exam_hall: "Exam Hall",
  hostel: "Hostel",
  admin_block: "Admin Block",
  library: "Library",
};

const statusColor = (s: string) =>
  s === "healthy" ? "var(--green)" : s === "degraded" ? "var(--amber)" : "var(--red)";

function CampusHealthGauge({ cnhs, status }: { cnhs: number; status: string }) {
  const angle = (cnhs / 100) * 180 - 90;
  const color = statusColor(status);
  return (
    <div style={{ position: "relative", width: 200, height: 120, margin: "0 auto" }}>
      <svg width={200} height={120} viewBox="0 0 200 120">
        {/* Track */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={16} strokeLinecap="round" />
        {/* Fill */}
        <path
          d={`M 20 100 A 80 80 0 0 1 ${100 + 80 * Math.cos(((angle) * Math.PI) / 180)} ${100 - 80 * Math.sin(((angle) * Math.PI) / 180)}`}
          fill="none" stroke={color} strokeWidth={16} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "all 0.6s ease" }}
        />
        {/* Needle */}
        <line
          x1={100} y1={100}
          x2={100 + 60 * Math.cos(((angle) * Math.PI) / 180)}
          y2={100 - 60 * Math.sin(((angle) * Math.PI) / 180)}
          stroke={color} strokeWidth={2.5} strokeLinecap="round"
          style={{ transition: "all 0.6s ease" }}
        />
        <circle cx={100} cy={100} r={5} fill={color} />
        {/* Labels */}
        <text x={20} y={118} fill="var(--text-muted)" fontSize={10} textAnchor="middle">0</text>
        <text x={100} y={26}  fill="var(--text-muted)" fontSize={10} textAnchor="middle">50</text>
        <text x={180} y={118} fill="var(--text-muted)" fontSize={10} textAnchor="middle">100</text>
      </svg>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>
          {cnhs.toFixed(1)}
        </div>
        <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>
          Campus CNHS
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, unit, color, sub }: { label: string; value: string; unit?: string; color?: string; sub?: string }) {
  return (
    <div className="card" style={{ borderColor: color ? `${color}22` : undefined }}>
      <div className="metric-label">{label}</div>
      <div style={{ marginTop: 8, display: "flex", alignItems: "baseline", gap: 4 }}>
        <span className="metric-value" style={{ color: color || "var(--text-primary)" }}>{value}</span>
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div style={{ color: "var(--text-muted)", marginBottom: 4, fontSize: 11 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: "var(--cyan)" }}>{p.name}: <strong>{p.value?.toFixed?.(1)}%</strong></div>
      ))}
    </div>
  );
};

export default function OverviewPage() {
  const { data, status } = useWebSocket();
  const [history, setHistory] = useState<{ t: string; cnhs: number }[]>([]);

  useEffect(() => {
    if (data?.campus_cnhs !== undefined) {
      setHistory(prev => {
        const next = [...prev.slice(-29), { t: new Date().toLocaleTimeString(), cnhs: data.campus_cnhs }];
        return next;
      });
    }
  }, [data?.campus_cnhs]);

  if (!data) {
    return (
      <DashboardShell title="Overview" subtitle="Campus CNHS · ERP Context · Network Status">
        <div className="empty-state">
          <div className="empty-icon">🌐</div>
          <p>Connecting to ACORN backend…</p>
          <div className="spinner" style={{ margin: "12px auto" }} />
        </div>
      </DashboardShell>
    );
  }

  const topSegments = [...(data.segments || [])].sort((a, b) => b.utilization_percent - a.utilization_percent).slice(0, 5);
  const avgUtil = data.segments?.length
    ? (data.segments.reduce((s, x) => s + x.utilization_percent, 0) / data.segments.length).toFixed(1)
    : "0";
  const faultCount = (data.active_faults as unknown[])?.length ?? 0;
  const activeIntents = (data.active_intents as unknown[])?.length ?? 0;

  return (
    <DashboardShell title="Network Overview" subtitle="Live Campus Health · ERP Context · Active Intents">

      {/* Critical alerts */}
      {data.alerts?.filter(a => a.severity === "critical").map((a, i) => (
        <div key={i} className="alert alert-critical" style={{ marginBottom: 10 }}>
          <span>🚨</span>
          <span>{a.message}</span>
          <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            {new Date(a.timestamp).toLocaleTimeString()}
          </span>
        </div>
      ))}

      {/* Main KPI row */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        <div className="card" style={{ gridColumn: "span 1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 180, borderColor: `${statusColor(data.campus_status)}22` }}>
          <CampusHealthGauge cnhs={data.campus_cnhs} status={data.campus_status} />
        </div>
        <KPICard label="Active Faults" value={String(faultCount)} color={faultCount > 0 ? "var(--red)" : "var(--green)"}
          sub={faultCount === 0 ? "No faults detected" : "CASH healing active"} />
        <KPICard label="Active Intents" value={String(activeIntents)} color="var(--blue)"
          sub={`${data.tips_pipeline?.staged ?? 0} staged, ${data.tips_pipeline?.armed ?? 0} armed`} />
        <KPICard label="Avg Utilization" value={avgUtil} unit="%" color="var(--cyan)"
          sub={`Demand: ${data.erp_context?.overall_demand_level}`} />
      </div>

      {/* CNHS history chart + segment table */}
      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 13 }}>Campus CNHS — Live History</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={history} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="cnhsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--cyan)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--cyan)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="t" tick={{ fontSize: 9, fill: "var(--text-muted)" }} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "var(--text-muted)" }} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="cnhs" name="CNHS" stroke="var(--cyan)" fill="url(#cnhsGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ERP Context */}
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 13 }}>ERP Context</div>
          {data.erp_context?.active_event ? (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{data.erp_context.active_event.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{data.erp_context.active_event.venue}</div>
                </div>
                <span className={`badge badge-${data.erp_context.active_event.event_type === "exam" ? "critical" : data.erp_context.active_event.event_type === "lab" ? "info" : "teal"}`}>
                  {data.erp_context.active_event.event_type}
                </span>
              </div>
              <div className="grid-2" style={{ gap: 8 }}>
                {[
                  ["Users", String(data.erp_context.active_event.expected_users)],
                  ["Profile", data.erp_context.active_event.bandwidth_profile],
                  ["Security", data.erp_context.active_event.requires_security_lockdown ? "🔒 Lockdown" : "Open"],
                  ["Demand", data.erp_context.overall_demand_level],
                ].map(([k, v]) => (
                  <div key={k} className="card-elevated">
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>{k}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--text-primary)", marginTop: 2 }}>{v}</div>
                  </div>
                ))}
              </div>
              {data.erp_context.upcoming_events?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div className="section-title" style={{ marginBottom: 6 }}>Upcoming</div>
                  {(data.erp_context.upcoming_events as {title: string; event_type: string; start_time: string}[]).slice(0, 3).map((ev, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--acorn-border)", fontSize: 12 }}>
                      <span style={{ color: "var(--text-secondary)" }}>{ev.title.slice(0, 35)}</span>
                      <span className={`badge badge-${ev.event_type === "exam" ? "critical" : "info"}`}>{ev.event_type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: "24px 0" }}>
              <div style={{ fontSize: 24 }}>📅</div>
              <p>No active ERP event</p>
              <p style={{ fontSize: 11, marginTop: 4 }}>
                Demand: <strong style={{ color: "var(--teal)" }}>{data.erp_context?.overall_demand_level}</strong>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Top segments */}
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 14, fontSize: 13 }}>Top Network Segments by Utilization</div>
        <table className="table">
          <thead>
            <tr>
              <th>Segment</th><th>Utilization</th><th>CNHS</th><th>Latency</th><th>Packet Loss</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {topSegments.map(seg => (
              <tr key={seg.segment_id}>
                <td style={{ fontWeight: 500 }}>{SEGMENT_LABELS[seg.segment_id] || seg.segment_id}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="progress-track" style={{ width: 80 }}>
                      <div className="progress-fill" style={{
                        width: `${seg.utilization_percent}%`,
                        background: seg.utilization_percent > 85 ? "var(--red)" : seg.utilization_percent > 60 ? "var(--amber)" : "var(--green)"
                      }} />
                    </div>
                    <span className="mono" style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                      {seg.utilization_percent?.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className={`mono cnhs-${seg.cnhs >= 70 ? "high" : seg.cnhs >= 40 ? "medium" : "low"}`} style={{ fontWeight: 600 }}>
                  {seg.cnhs?.toFixed(1)}
                </td>
                <td className="mono" style={{ fontSize: 12 }}>{seg.latency_ms?.toFixed(1)}ms</td>
                <td className="mono" style={{ fontSize: 12, color: seg.packet_loss_percent > 0.5 ? "var(--red)" : "inherit" }}>
                  {seg.packet_loss_percent?.toFixed(3)}%
                </td>
                <td><span className={`badge badge-${seg.status}`}>{seg.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TIPS pipeline strip */}
      {data.tips_pipeline && (
        <div className="card" style={{ marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>TIPS Intent Pipeline</div>
          <div className="tips-pipeline">
            {[
              { phase: "DRAFT", count: 0, color: "#4b5563" },
              { phase: "STAGED", count: data.tips_pipeline.staged, color: "var(--blue)" },
              { phase: "ARMED", count: data.tips_pipeline.armed, color: "var(--amber)" },
              { phase: "ACTIVE", count: data.tips_pipeline.active, color: "var(--green)" },
              { phase: "EXPIRED", count: 0, color: "var(--text-muted)" },
            ].map((s, i, arr) => (
              <div key={s.phase} className={`tips-stage ${s.count > 0 ? "active-stage" : ""}`}
                style={{ borderLeft: i === 0 ? "1px solid var(--acorn-border)" : "none" }}>
                <div style={{ fontSize: 10, color: s.count > 0 ? s.color : "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.phase}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700, color: s.count > 0 ? s.color : "var(--text-muted)", marginTop: 2 }}>{s.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
