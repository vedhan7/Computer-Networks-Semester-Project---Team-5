"use client";

import CNHSGauge from "@/components/CNHSGauge";
import ActiveThreatLog from "@/components/ActiveThreatLog";
import JaccardVisualizer from "@/components/JaccardVisualizer";
import BandwidthChart from "@/components/BandwidthChart";
import TIPSTimeline from "@/components/TIPSTimeline";
import { useSDNStore } from "@/store/useSDNStore";
import { Activity } from "lucide-react";
import { useNetworkTelemetry } from "../../hooks/useNetworkTelemetry";
import { useEffect } from "react";

export default function Dashboard() {
  const { activeTab, updateFromTelemetry } = useSDNStore();
  const { telemetry, isLoading } = useNetworkTelemetry();

  useEffect(() => {
    updateFromTelemetry(telemetry);
  }, [telemetry, updateFromTelemetry]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-100 flex items-center gap-3">
            SDN Command Center
            <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500' : 'bg-quantum-teal'} animate-pulse`} />
          </h1>
          <p className="text-gray-500 mt-2 font-mono text-sm uppercase tracking-wider">
            {isLoading ? "ESTABLISHING WEBSOCKET CONNECTION..." : "FIRESTORE ONSNAPSHOT ACTIVE • V 3.0.0 (NOSQL)"}
          </p>
        </div>
        {!isLoading && (
          <div className="flex items-center gap-2 text-quantum-teal font-mono text-xs border border-quantum-teal/30 bg-quantum-teal/10 px-3 py-1 rounded-full">
            <Activity className="w-3 h-3" /> REAL-TIME SYNC ENGAGED
          </div>
        )}
      </header>

      {/* Dynamic Content based on Sidebar */}
      {(activeTab === 'dashboard' || activeTab === 'threats') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 h-80">
            <CNHSGauge />
          </div>
          <div className="lg:col-span-2 h-80">
            <ActiveThreatLog />
          </div>
        </div>
      )}

      {(activeTab === 'dashboard' || activeTab === 'activity') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <JaccardVisualizer />
          <BandwidthChart />
        </div>
      )}

      {(activeTab === 'dashboard' || activeTab === 'timeline') && (
        <TIPSTimeline />
      )}

      {activeTab === 'settings' && (
        <div className="bg-surface border border-surface-border p-6 rounded-xl flex items-center justify-center h-64 text-gray-500 font-mono">
          [ SYSTEM CONFIGURATION UNAVAILABLE IN READ-ONLY MODE ]
        </div>
      )}

    </div>
  );
}
