"use client";

import {
  LayoutDashboard,
  Calendar,
  Network,
  ShieldAlert,
  MapPin,
  GitMerge,
  BarChart,
  Settings,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { path: "/", label: "Overview", icon: LayoutDashboard },
      { path: "/timetable", label: "ERP Timetable", icon: Calendar },
    ],
  },
  {
    label: "Digital Twin",
    items: [
      { path: "/topology", label: "Live Topology", icon: Network },
      { path: "/security", label: "Security (CNHS)", icon: ShieldAlert },
    ],
  },
  {
    label: "ACORN Engine",
    items: [
      { path: "/triangulation", label: "Triangulation", icon: MapPin },
      { path: "/conflicts", label: "APCR & CASH", icon: GitMerge },
    ],
  },
  {
    label: "System",
    items: [
      { path: "/benchmark", label: "Benchmark", icon: BarChart },
      { path: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-screen fixed left-0 top-0 z-40 flex flex-col border-r border-border bg-surface transition-all duration-200 ${
        collapsed ? "w-[56px]" : "w-[220px]"
      }`}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
        <div className="w-7 h-7 rounded-md bg-accent/10 border border-accent/25 flex items-center justify-center shrink-0">
          <Network className="w-3.5 h-3.5 text-accent" />
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold text-text-primary truncate">
            ACORN Twin
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            {!collapsed && (
              <div className="px-2 mb-1.5 text-2xs font-medium text-text-faint uppercase tracking-wider">
                {group.label}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path || pathname?.startsWith(item.path + '/');
                // Exact match for home, startsWith for others
                const isCurrent = item.path === '/' ? pathname === '/' : isActive;
                
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-sm transition-colors duration-150 ${
                      isCurrent
                        ? "bg-accent/10 text-accent"
                        : "text-text-muted hover:text-text-secondary hover:bg-surface-secondary"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {!collapsed && (
                      <span className="truncate font-medium">{item.label}</span>
                    )}
                    {isCurrent && !collapsed && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border px-2 py-2 shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-surface-secondary transition-colors text-xs"
        >
          <ChevronLeft
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
              collapsed ? "rotate-180" : ""
            }`}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
