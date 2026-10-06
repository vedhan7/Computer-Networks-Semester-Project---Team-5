"use client";

import { useSDNStore } from "@/store/useSDNStore";
import { useNetworkTelemetry } from "../../hooks/useNetworkTelemetry";
import { useEffect, useMemo } from "react";
import { Activity, ShieldAlert, Server, Router } from "lucide-react";

import TopBar from "@/components/TopBar";
import MetricCard from "@/components/MetricCard";
import HealthOverview from "@/components/HealthOverview";
import ThreatTable from "@/components/ThreatTable";
import NetworkTopology from "@/components/NetworkTopology";
import BandwidthAllocation from "@/components/BandwidthAllocation";
import TIPSPipeline from "@/components/TIPSPipeline";

export default function Dashboard() {
  const { activeTab, updateFromTelemetry, cnhsScore, threatLogs, allocations } = useSDNStore();
  const { telemetry, isLoading } = useNetworkTelemetry();

  useEffect(() => {
    updateFromTelemetry(telemetry);
  }, [telemetry, updateFromTelemetry]);

  // Aggregate metrics for KPI cards
  const kpiData = useMemo(() => {
    const activeDevices = allocations.reduce((sum, a) => sum + a.studentCount, 0);
    const activeFlows = activeDevices * Math.floor(Math.random() * 20 + 30); // Simulated based on devices
    const totalBandwidth = threatLogs.reduce((sum, log) => sum + log.u_obs, 0);
    
    // Determine Threat Level
    let threatLevel = "LOW";
    let threatStatus: "neutral" | "warning" | "critical" | "healthy" = "healthy";
    
    if (cnhsScore < 80) {
      threatLevel = "CRITICAL";
      threatStatus = "critical";
    } else if (cnhsScore < 90) {
      threatLevel = "ELEVATED";
      threatStatus = "warning";
    }

    return {
      activeDevices,
      activeFlows,
      totalBandwidth,
      threatLevel,
      threatStatus
    };
  }, [allocations, threatLogs, cnhsScore]);

  // Map tabs to titles
  const tabTitles: Record<string, string> = {
    dashboard: "Overview",
    activity: "Traffic Analytics",
    threats: "Threat Events",
    timeline: "TIPS Pipeline",
    bandwidth: "Bandwidth Control",
    settings: "System Settings",
  };

  return (
    <div className="flex flex-col h-full bg-bg w-full">
      <TopBar isConnected={!isLoading} title={tabTitles[activeTab] || "Overview"} />
      
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          
          {/* Top KPI Cards (visible on dashboard or if we want them globally) */}
          {(activeTab === 'dashboard' || activeTab === 'activity' || activeTab === 'threats') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard 
                label="NETWORK HEALTH" 
                value={`${cnhsScore.toFixed(1)}%`} 
                status={cnhsScore < 80 ? "critical" : cnhsScore < 90 ? "warning" : "healthy"}
                icon={<Activity className="w-4 h-4" />}
                trend={{ value: "+0.4% from last hour", direction: "up" }}
              />
              <MetricCard 
                label="ACTIVE DEVICES" 
                value={kpiData.activeDevices} 
                icon={<Server className="w-4 h-4" />}
              />
              <MetricCard 
                label="THROUGHPUT" 
                value={kpiData.totalBandwidth.toFixed(0)} 
                unit="Mbps"
                icon={<Router className="w-4 h-4" />}
                trend={{ value: "-12 Mbps from last hour", direction: "neutral" }}
              />
              <MetricCard 
                label="THREAT LEVEL" 
                value={kpiData.threatLevel} 
                status={kpiData.threatStatus}
                icon={<ShieldAlert className="w-4 h-4" />}
              />
            </div>
          )}

          {/* Dynamic Content based on Tab */}
          
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <HealthOverview />
                </div>
                <div className="lg:col-span-2">
                  <ThreatTable />
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <NetworkTopology />
                <BandwidthAllocation />
              </div>
            </>
          )}

          {activeTab === 'activity' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NetworkTopology />
              <BandwidthAllocation />
            </div>
          )}

          {activeTab === 'threats' && (
            <div className="grid grid-cols-1 gap-6">
              <ThreatTable />
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="grid grid-cols-1 gap-6">
              <TIPSPipeline />
            </div>
          )}
          
          {activeTab === 'bandwidth' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BandwidthAllocation />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-surface border border-border rounded-md p-10 flex flex-col items-center justify-center h-64 text-text-muted text-sm">
              <Settings className="w-8 h-8 mb-4 opacity-50" />
              <p>System configuration is unavailable in read-only mode.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
