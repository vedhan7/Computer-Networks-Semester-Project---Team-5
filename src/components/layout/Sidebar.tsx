"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { useAuth } from "@/providers/AuthProvider";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "⬡", label: "Overview" },
  { href: "/dashboard/monitor", icon: "📡", label: "Network Monitor" },
  { href: "/dashboard/schedule", icon: "📅", label: "ERP Schedule" },
  { href: "/dashboard/intents", icon: "🧠", label: "Intent Builder" },
  { href: "/dashboard/tips", icon: "⏱", label: "TIPS Pipeline" },
  { href: "/dashboard/healing", icon: "🔧", label: "CASH Healing" },
  { href: "/dashboard/conflicts", icon: "⚖️", label: "APCR Conflicts" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { status, data } = useWebSocket();
  const { user, logout } = useAuth();
  const faultCount = (data?.active_faults as unknown[])?.length ?? 0;
  const alertCount = data?.alerts?.length ?? 0;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-text">ACORN</div>
        <div className="logo-sub">Smart Campus Network</div>
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <div className={`pulse-dot ${status === "connected" ? "" : status === "reconnecting" ? "amber" : "red"}`} />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {status === "connected" ? "Live" : status === "reconnecting" ? "Reconnecting…" : "Offline"}
          </span>
        </div>
      </div>

      {/* Campus CNHS score */}
      {data && (
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--acorn-border)" }}>
          <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Campus Health</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 26, fontWeight: 700,
              color: data.campus_cnhs >= 70 ? "var(--green)" : data.campus_cnhs >= 40 ? "var(--amber)" : "var(--red)"
            }}>
              {data.campus_cnhs.toFixed(1)}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>/ 100</span>
            <span className={`badge badge-${data.campus_status === "healthy" ? "healthy" : data.campus_status === "degraded" ? "degraded" : "critical"}`}
              style={{ marginLeft: "auto" }}>
              {data.campus_status}
            </span>
          </div>
          <div className="progress-track" style={{ marginTop: 6 }}>
            <div className="progress-fill" style={{
              width: `${data.campus_cnhs}%`,
              background: data.campus_cnhs >= 70 ? "var(--green)" : data.campus_cnhs >= 40 ? "var(--amber)" : "var(--red)",
            }} />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 8 }}>
        <div className="nav-section">Navigation</div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const hasBadge = item.href === "/dashboard/healing" && faultCount > 0;
          return (
            <Link key={item.href} href={item.href} className={`nav-item ${isActive ? "active" : ""}`}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              <span>{item.label}</span>
              {hasBadge && <span className="nav-badge">{faultCount}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Context info */}
      {data?.erp_context?.active_event && (
        <div style={{ padding: "10px 14px", borderTop: "1px solid var(--acorn-border)", margin: "8px 10px", background: "rgba(59,130,246,0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(59,130,246,0.15)" }}>
          <div style={{ fontSize: 10, color: "var(--blue)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
            Active Event
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
            {data.erp_context.active_event.title}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            {data.erp_context.active_event.venue}
          </div>
        </div>
      )}

      {/* User footer */}
      <div style={{ padding: "12px 14px", borderTop: "1px solid var(--acorn-border)", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg, var(--blue), var(--purple))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>
          {user?.username?.[0]?.toUpperCase() || "U"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
            {user?.username || "Admin"}
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{user?.role}</div>
        </div>
        <button onClick={logout} style={{ fontSize: 10, color: "var(--text-muted)", cursor: "pointer", padding: "4px 8px", borderRadius: "var(--radius-xs)", border: "1px solid var(--acorn-border)", background: "none" }}
          title="Sign out">⇐</button>
      </div>
    </aside>
  );
}
