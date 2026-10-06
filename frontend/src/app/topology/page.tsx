"use client";

import TopBar from "@/components/TopBar";
import NetworkTopology from "@/components/NetworkTopology";

export default function TopologyPage() {
  return (
    <div className="flex flex-col h-full bg-bg w-full">
      <TopBar title="Live Topology (Digital Twin)" />
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <NetworkTopology />
        </div>
      </div>
    </div>
  );
}
