"use client";

import { Search, Bell, User, Wifi, WifiOff } from "lucide-react";

interface TopBarProps {
  isConnected: boolean;
  title: string;
}

export default function TopBar({ isConnected, title }: TopBarProps) {
  return (
    <header className="h-14 border-b border-border bg-surface flex items-center justify-between px-6 shrink-0">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-muted">SDN Command Center</span>
        <span className="text-text-faint">/</span>
        <span className="text-text-primary font-medium">{title}</span>
      </div>

      {/* Right: status + controls */}
      <div className="flex items-center gap-4">
        {/* Connection status */}
        <div className="flex items-center gap-2 text-xs">
          {isConnected ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              <span className="text-text-secondary">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-danger" />
              <span className="text-danger">Disconnected</span>
            </>
          )}
        </div>

        <div className="w-px h-5 bg-border" />

        {/* Search */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-secondary border border-border text-text-muted text-xs hover:border-border hover:text-text-secondary transition-colors">
          <Search className="w-3.5 h-3.5" />
          <span>Search...</span>
          <kbd className="ml-4 px-1.5 py-0.5 rounded bg-bg border border-border text-2xs text-text-faint">⌘K</kbd>
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-md text-text-muted hover:text-text-secondary hover:bg-surface-secondary transition-colors">
          <Bell className="w-4 h-4" />
        </button>

        {/* User */}
        <button className="w-7 h-7 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-text-muted hover:border-accent/30 transition-colors">
          <User className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
