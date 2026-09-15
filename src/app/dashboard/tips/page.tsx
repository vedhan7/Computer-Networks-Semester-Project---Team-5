"use client";
import DashboardShell from "@/components/layout/DashboardShell";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { useApiClient } from "@/providers/AuthProvider";
import { useState, useEffect } from "react";

interface Intent {
  id: string; source: string; raw_text: string; action: string;
  target_segments: string[]; bandwidth_mbps: number | null;
  priority: number; lifecycle_status: string; erp_event_id: string | null;
  stage_time: string | null; arm_time: string | null;
  activate_time: string | null; expire_time: string | null;
  created_at: string;
}

interface Pipeline {
  draft: Intent[]; staged: Intent[]; armed: Intent[];
  active: Intent[]; expired: Intent[]; failed: Intent[];
}

const PHASE_CONFIG = [
  { phase: "draft",   label: "Draft",   color: "#6b7280", icon: "📋", desc: "Awaiting T-30min window" },
  { phase: "staged",  label: "Staged",  color: "var(--blue)",  icon: "📦", desc: "Pre-configured, T-30min" },
  { phase: "armed",   label: "Armed",   color: "var(--amber)", icon: "⚡", desc: "Ready to fire, T-5min" },
  { phase: "active",  label: "Active",  color: "var(--green)", icon: "✅", desc: "Enforced on network" },
  { phase: "expired", label: "Expired", color: "#374151",      icon: "⏰", desc: "Event ended, reverted" },
  { phase: "failed",  label: "Failed",  color: "var(--red)",   icon: "❌", desc: "Error during activation" },
];

const SEGMENT_LABELS: Record<string, string> = {
  campus_root: "Campus Uplink", block_a: "Block A", lab_a1: "Prog Lab A1",
  lab_a2: "Electronics A2", halls_a: "Lecture Halls", block_b: "Block B",
  lab_b1: "Network Lab B1", exam_hall: "Exam Hall", hostel: "Hostel",
  admin_block: "Admin Block", library: "Library",
};

function IntentCard({ intent }: { intent: Intent }) {
  const phase = PHASE_CONFIG.find(p => p.phase === intent.lifecycle_status) || PHASE_CONFIG[0];
  return (
    <div className="card-elevated" style={{
      borderColor: `${phase.color}33`, marginBottom: 6,
      boxShadow: intent.lifecycle_status === "active" ? `0 0 12px ${phase.color}22` : "none",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4, flex: 1, marginRight: 8 }}>
          {intent.raw_text?.slice(0, 70)}{(intent.raw_text?.length ?? 0) > 70 ? "…" : ""}
        </div>
        <span className={`badge pill-${intent.lifecycle_status}`} style={{ flexShrink: 0 }}>{intent.lifecycle_status}</span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 11, color: "var(--text-muted)" }}>
        <span>Action: <strong style={{ color: "var(--text-secondary)" }}>{intent.action}</strong></span>
        <span>P: <strong style={{ color: phase.color }}>{intent.priority}</strong></span>
        {intent.bandwidth_mbps && <span>BW: <strong>{intent.bandwidth_mbps}Mbps</strong></span>}
        <span>{intent.source === "ERP_AUTO" ? "🤖 ERP Auto" : "👤 Manual"}</span>
      </div>
      {/* Lifecycle timing */}
      <div style={{ marginTop: 8, display: "flex", gap: 8, fontSize: 10, color: "var(--text-muted)", flexWrap: "wrap" }}>
        {intent.stage_time    && <span style={{ color: "var(--blue)"  }}>Staged: {new Date(intent.stage_time).toLocaleTimeString()}</span>}
        {intent.arm_time      && <span style={{ color: "var(--amber)" }}>Armed: {new Date(intent.arm_time).toLocaleTimeString()}</span>}
        {intent.activate_time && <span style={{ color: "var(--green)" }}>Activated: {new Date(intent.activate_time).toLocaleTimeString()}</span>}
        {intent.expire_time   && <span style={{ color: "#6b7280"      }}>Expired: {new Date(intent.expire_time).toLocaleTimeString()}</span>}
      </div>
    </div>
  );
}

export default function TIPSPage() {
  const { data: wsData } = useWebSocket();
  const api = useApiClient();
  const [pipeline, setPipeline] = useState<Pipeline>({ draft: [], staged: [], armed: [], active: [], expired: [], failed: [] });

  const fetchPipeline = () => api("/api/intents/pipeline").then(setPipeline).catch(() => {});
  useEffect(() => { fetchPipeline(); const t = setInterval(fetchPipeline, 10000); return () => clearInterval(t); }, [api]);

  const total = Object.values(pipeline).flat().length;
  const activeCount = pipeline.active?.length ?? 0;

  return (
    <DashboardShell title="TIPS Pipeline" subtitle="Temporal Intent Pre-Staging — 4-phase lifecycle">
      {/* Phase summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 20 }}>
        {PHASE_CONFIG.map(({ phase, label, color, icon, desc }) => {
          const count = (pipeline[phase as keyof Pipeline] || []).length;
          return (
            <div key={phase} className="card" style={{
              textAlign: "center",
              borderColor: count > 0 ? `${color}33` : undefined,
              background: count > 0 ? `${color}08` : undefined,
            }}>
              <div style={{ fontSize: 18 }}>{icon}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: count > 0 ? color : "var(--text-muted)", marginTop: 4 }}>{count}</div>
              <div style={{ fontSize: 10, color: count > 0 ? color : "var(--text-muted)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</div>
              <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>{desc}</div>
            </div>
          );
        })}
      </div>

      {/* Visual flow arrow */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12 }}>4-Phase Lifecycle (Novel Contribution #3)</div>
        <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto" }}>
          {PHASE_CONFIG.slice(0, 4).map(({ phase, label, color, icon, desc }, i) => {
            const count = (pipeline[phase as keyof Pipeline] || []).length;
            return (
              <div key={phase} style={{ display: "flex", alignItems: "center" }}>
                <div style={{
                  padding: "10px 16px", textAlign: "center", minWidth: 120,
                  background: count > 0 ? `${color}15` : "var(--acorn-elevated)",
                  border: `1px solid ${count > 0 ? color : "var(--acorn-border)"}44`,
                  borderRadius: i === 0 ? "var(--radius-sm) 0 0 var(--radius-sm)" : i === 3 ? "0 var(--radius-sm) var(--radius-sm) 0" : 0,
                  boxShadow: count > 0 ? `0 0 12px ${color}22` : "none",
                  transition: "all 0.3s ease",
                }}>
                  <div style={{ fontSize: 14 }}>{icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: count > 0 ? color : "var(--text-muted)", textTransform: "uppercase", marginTop: 4 }}>{label}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: count > 0 ? color : "var(--text-muted)" }}>{count}</div>
                  <div style={{ fontSize: 9, color: "var(--text-muted)", marginTop: 2 }}>{desc}</div>
                </div>
                {i < 3 && (
                  <div style={{ fontSize: 18, color: "var(--text-muted)", padding: "0 4px" }}>→</div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-muted)" }}>
          TIPS schedules intents <strong style={{ color: "var(--blue)" }}>30 minutes</strong> before events (STAGED),
          arms them <strong style={{ color: "var(--amber)" }}>5 minutes</strong> before,
          activates at <strong style={{ color: "var(--green)" }}>T=0</strong>, and reverts when the event ends.
        </div>
      </div>

      {/* Kanban columns */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {PHASE_CONFIG.slice(1, 4).map(({ phase, label, color, icon }) => (
          <div key={phase} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color, display: "flex", alignItems: "center", gap: 6 }}>
                <span>{icon}</span>{label}
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color }}>{(pipeline[phase as keyof Pipeline] || []).length}</span>
            </div>
            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {(pipeline[phase as keyof Pipeline] || []).length === 0 ? (
                <div style={{ padding: "16px 0", textAlign: "center", fontSize: 12, color: "var(--text-muted)" }}>
                  No {label.toLowerCase()} intents
                </div>
              ) : (
                (pipeline[phase as keyof Pipeline] || []).map((intent: Intent) => (
                  <IntentCard key={intent.id} intent={intent} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Active intents detailed */}
      {pipeline.active?.length > 0 && (
        <div className="card" style={{ marginTop: 16, borderColor: "rgba(16,185,129,0.25)" }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: "var(--green)", marginBottom: 14 }}>
            ✅ Active Intents — Currently Enforced on Network
          </div>
          <div className="grid-2">
            {pipeline.active.map((intent: Intent) => (
              <IntentCard key={intent.id} intent={intent} />
            ))}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
