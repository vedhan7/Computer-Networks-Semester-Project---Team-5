"use client";
import TopBar from "@/components/TopBar";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full bg-bg w-full">
      <TopBar title="Settings" />
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center text-text-muted flex flex-col items-center gap-4">
          <Settings className="w-12 h-12 opacity-50" />
          <h2 className="text-xl font-medium text-text-secondary">System Settings</h2>
          <p className="text-sm">Global ACORN Engine parameters are locked by the administrator.</p>
        </div>
      </div>
    </div>
  );
}
