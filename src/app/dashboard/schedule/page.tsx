"use client";
import DashboardShell from "@/components/layout/DashboardShell";
import { useApiClient } from "@/providers/AuthProvider";
import { useState, useEffect } from "react";

interface AcademicEvent {
  id: string; title: string; event_type: string; department: string | null;
  venue: string; start_time: string; end_time: string; expected_users: number;
  bandwidth_profile: string; requires_security_lockdown: boolean; network_segments: string[];
}

const EVENT_COLORS: Record<string, string> = {
  exam: "var(--red)", lab: "var(--blue)", lecture: "var(--teal)",
  event: "var(--purple)", free: "var(--text-muted)",
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8am–7pm

function EventBadge({ event }: { event: AcademicEvent }) {
  const color = EVENT_COLORS[event.event_type] || "var(--text-muted)";
  return (
    <div style={{
      padding: "5px 8px", borderRadius: 6, marginBottom: 4,
      background: `${color}18`, border: `1px solid ${color}35`,
      cursor: "pointer", transition: "all 0.15s ease",
    }}
      onMouseEnter={e => (e.currentTarget.style.background = `${color}28`)}
      onMouseLeave={e => (e.currentTarget.style.background = `${color}18`)}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color, lineHeight: 1.2 }}>
        {event.title.slice(0, 28)}{event.title.length > 28 ? "…" : ""}
      </div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
        {new Date(event.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {new Date(event.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{event.venue} · {event.expected_users} users</div>
      {event.requires_security_lockdown && (
        <div style={{ fontSize: 10, color: "var(--red)", marginTop: 2 }}>🔒 Security Lockdown</div>
      )}
    </div>
  );
}

export default function SchedulePage() {
  const api = useApiClient();
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AcademicEvent | null>(null);
  const [enciPreview, setEnciPreview] = useState<{ intents: unknown[]; enci_description: string } | null>(null);
  const [loadingEnci, setLoadingEnci] = useState(false);

  useEffect(() => {
    api("/api/erp/all").then(data => { setEvents(data); setLoading(false); }).catch(() => setLoading(false));
  }, [api]);

  const loadEnci = async (event: AcademicEvent) => {
    setSelected(event); setEnciPreview(null); setLoadingEnci(true);
    try {
      const d = await api(`/api/enci/preview/${event.id}`);
      setEnciPreview(d);
    } catch { /* ignore */ } finally { setLoadingEnci(false); }
  };

  // Group events by day-of-week
  const byDay: Record<number, AcademicEvent[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };
  events.forEach(ev => {
    const dow = new Date(ev.start_time).getDay(); // 0=Sun
    const idx = dow - 1; // Mon=0..Fri=4
    if (idx >= 0 && idx <= 4) byDay[idx] = [...(byDay[idx] || []), ev];
  });

  const eventTypeStats = events.reduce((acc, ev) => {
    acc[ev.event_type] = (acc[ev.event_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DashboardShell title="ERP Academic Schedule" subtitle="College timetable — ENCI profiles — TIPS intent generation">
      {/* Summary row */}
      <div className="grid-4" style={{ marginBottom: 20 }}>
        {Object.entries(eventTypeStats).map(([type, count]) => (
          <div key={type} className="card-elevated">
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{type}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: EVENT_COLORS[type] || "inherit", marginTop: 4 }}>{count}</div>
          </div>
        ))}
      </div>

      {/* Timetable grid */}
      <div className="card" style={{ marginBottom: 20, overflowX: "auto" }}>
        <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 13 }}>Weekly Timetable</div>
        {loading ? (
          <div className="empty-state"><div className="spinner" /></div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "60px repeat(5, 1fr)", gap: 8, minWidth: 700 }}>
            {/* Header */}
            <div />
            {DAYS.map(d => (
              <div key={d} style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textAlign: "center", padding: "4px 0", borderBottom: "1px solid var(--acorn-border)" }}>
                {d}
              </div>
            ))}
            {/* Time rows */}
            {HOURS.map(h => (
              <>
                <div key={`hour-${h}`} style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "right", paddingRight: 8, paddingTop: 4, fontFamily: "var(--font-mono)" }}>
                  {h}:00
                </div>
                {DAYS.map((_, di) => {
                  const dayEvents = (byDay[di] || []).filter(ev => {
                    const startH = new Date(ev.start_time).getHours();
                    return startH === h;
                  });
                  return (
                    <div key={`cell-${h}-${di}`}
                      style={{ minHeight: 40, borderBottom: "1px solid rgba(255,255,255,0.03)", borderLeft: "1px solid rgba(255,255,255,0.03)", padding: 2 }}>
                      {dayEvents.map(ev => (
                        <div key={ev.id} onClick={() => loadEnci(ev)}>
                          <EventBadge event={ev} />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        )}
      </div>

      {/* ENCI detail panel */}
      {selected && (
        <div className="card fade-in" style={{ borderColor: `${EVENT_COLORS[selected.event_type] || "var(--acorn-border)"}44` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text-primary)" }}>ENCI Profile — {selected.title}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                {new Date(selected.start_time).toLocaleString()} → {new Date(selected.end_time).toLocaleString()}
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(null); setEnciPreview(null); }}>✕</button>
          </div>

          {loadingEnci ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--text-muted)", fontSize: 13 }}>
              <div className="spinner" /> Loading ENCI profile…
            </div>
          ) : enciPreview ? (
            <div>
              <div className="alert alert-info" style={{ marginBottom: 16, whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.8 }}>
                {enciPreview.enci_description}
              </div>
              <div style={{ fontWeight: 600, fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>
                Auto-Generated TIPS Intents ({enciPreview.intents.length})
              </div>
              {(enciPreview.intents as { action: string; raw_text: string; bandwidth_mbps: number; priority: number; qos_dscp: number }[]).map((intent, i) => (
                <div key={i} className="card-elevated" style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span className={`badge ${intent.action === "lockdown" ? "badge-critical" : intent.action === "block" ? "badge-degraded" : "badge-info"}`}>
                      {intent.action}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      P:{intent.priority} · DSCP:{intent.qos_dscp} {intent.bandwidth_mbps ? `· ${intent.bandwidth_mbps}Mbps` : ""}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{intent.raw_text}</div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </DashboardShell>
  );
}
