"use client";
import DashboardShell from "@/components/layout/DashboardShell";
import { useApiClient } from "@/providers/AuthProvider";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { useState, useEffect, FormEvent } from "react";

interface Intent {
  id: string; source: string; raw_text: string; action: string;
  target_services: string[]; target_segments: string[];
  bandwidth_mbps: number | null; priority: number;
  lifecycle_status: string; erp_event_id: string | null;
  apcr_conflict: string | null; apcr_resolution: string | null;
  created_at: string;
}

const statusPill = (s: string) => (
  <span className={`badge pill-${s}`}>{s.toUpperCase()}</span>
);

const EXAMPLES = [
  "Allocate 200Mbps for exam in exam hall with security lockdown",
  "Block social media and streaming in lab_a1 during lab session",
  "Throttle hostel bandwidth to 5Mbps per user during free period",
  "Prioritize exam portal in exam_hall with DSCP 46",
];

export default function IntentBuilder() {
  const api = useApiClient();
  const { data: wsData } = useWebSocket();
  const [intents, setIntents] = useState<Intent[]>([]);
  const [rawText, setRawText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ parsed: Record<string, unknown>; apcr: Record<string, unknown> } | null>(null);
  const [error, setError] = useState("");

  const fetchIntents = () => api("/api/intents").then(setIntents).catch(() => {});

  useEffect(() => { fetchIntents(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) return;
    setSubmitting(true); setError(""); setResult(null);
    try {
      const res = await api("/api/intents", {
        method: "POST",
        body: JSON.stringify({ raw_text: rawText }),
      });
      setResult(res);
      setRawText("");
      await fetchIntents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create intent");
    } finally { setSubmitting(false); }
  };

  const handleActivate = async (id: string) => {
    await api(`/api/intents/${id}/activate`, { method: "PUT" });
    await fetchIntents();
  };

  const handleDelete = async (id: string) => {
    await api(`/api/intents/${id}`, { method: "DELETE" });
    await fetchIntents();
  };

  return (
    <DashboardShell title="Intent Builder" subtitle="Natural language → TIPS lifecycle → network policy">
      <div className="grid-2" style={{ marginBottom: 20, gap: 20 }}>
        {/* Input panel */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14 }}>Create Intent</div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label className="label">Intent Statement (natural language)</label>
              <textarea
                className="input textarea"
                id="intent-text"
                placeholder="e.g. Allocate 200Mbps for exam in exam hall with security lockdown"
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                required
                style={{ minHeight: 100 }}
              />
            </div>

            <div>
              <div className="section-title">Example intents</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {EXAMPLES.map((ex, i) => (
                  <button key={i} type="button" className="btn btn-ghost btn-sm"
                    style={{ textAlign: "left", justifyContent: "flex-start", fontSize: 11 }}
                    onClick={() => setRawText(ex)}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="alert alert-critical"><span>⚠</span>{error}</div>}

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <><div className="spinner" />Processing…</> : "🧠 Generate & Stage Intent"}
            </button>
          </form>

          {/* ENCI parse result */}
          {result && (
            <div className="fade-in" style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, color: "var(--green)" }}>✓ Intent staged successfully</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                {Object.entries(result.parsed).filter(([k]) => !["target_services", "target_segments"].includes(k)).map(([k, v]) => (
                  <div key={k} className="card-elevated">
                    <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase" }}>{k}</div>
                    <div style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{String(v)}</div>
                  </div>
                ))}
              </div>
              {result.apcr?.resolution_action !== "no_conflict" && (
                <div className="alert alert-warning" style={{ marginTop: 10, fontSize: 12 }}>
                  <span>⚖️</span>
                  <div>
                    <div><strong>APCR Conflict Detected</strong></div>
                    <div>{result.apcr.resolution_action as string} — {result.apcr.academic_justification as string}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* TIPS Pipeline */}
        <div className="card">
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14 }}>TIPS Lifecycle Pipeline</div>
          {wsData?.tips_pipeline && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
              {[
                { phase: "STAGED", count: wsData.tips_pipeline.staged, color: "var(--blue)" },
                { phase: "ARMED", count: wsData.tips_pipeline.armed, color: "var(--amber)" },
                { phase: "ACTIVE", count: wsData.tips_pipeline.active, color: "var(--green)" },
                { phase: "TOTAL", count: intents.length, color: "var(--text-secondary)" },
              ].map(({ phase, count, color }) => (
                <div key={phase} className="card-elevated" style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{phase}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 700, color }}>{count}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>
            DRAFT → STAGED (T-30m) → ARMED (T-5m) → ACTIVE → EXPIRED
          </div>
          <div className="progress-track" style={{ marginBottom: 16 }}>
            <div className="progress-fill" style={{
              width: `${wsData?.tips_pipeline ? (wsData.tips_pipeline.active / Math.max(intents.length, 1)) * 100 : 0}%`,
              background: "var(--green)",
            }} />
          </div>

          {/* Active faults warning */}
          {wsData && (wsData.active_faults as unknown[])?.length > 0 && (
            <div className="alert alert-critical" style={{ marginBottom: 12 }}>
              <span>🚨</span>
              <span><strong>{(wsData.active_faults as unknown[]).length} active fault(s)</strong> — CASH healing in progress</span>
            </div>
          )}
        </div>
      </div>

      {/* Intents table */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>All Intents</div>
          <button className="btn btn-ghost btn-sm" onClick={fetchIntents}>↻ Refresh</button>
        </div>

        {intents.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🧠</div><p>No intents yet. Create one above.</p></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Intent</th><th>Action</th><th>Priority</th><th>BW</th><th>Source</th><th>Status</th><th>APCR</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {intents.map(intent => (
                  <tr key={intent.id}>
                    <td style={{ maxWidth: 220 }}>
                      <div style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.4 }}>
                        {intent.raw_text.slice(0, 60)}{intent.raw_text.length > 60 ? "…" : ""}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{intent.id.slice(0, 12)}…</div>
                    </td>
                    <td><span className={`badge ${intent.action === "lockdown" ? "badge-critical" : intent.action === "block" ? "badge-degraded" : "badge-info"}`}>{intent.action}</span></td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{intent.priority}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{intent.bandwidth_mbps ? `${intent.bandwidth_mbps}M` : "—"}</td>
                    <td style={{ fontSize: 11, color: "var(--text-muted)" }}>{intent.source === "ERP_AUTO" ? "🤖 Auto" : "👤 Manual"}</td>
                    <td>{statusPill(intent.lifecycle_status)}</td>
                    <td style={{ fontSize: 11 }}>
                      {intent.apcr_resolution && intent.apcr_resolution !== "no_conflict"
                        ? <span style={{ color: "var(--amber)" }}>⚖ {intent.apcr_resolution}</span>
                        : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        {intent.lifecycle_status === "draft" && (
                          <button className="btn btn-success btn-sm" onClick={() => handleActivate(intent.id)} title="Activate">▶</button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(intent.id)} title="Delete">✕</button>
                      </div>
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
