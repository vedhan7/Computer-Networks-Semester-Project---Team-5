"use client";

import { useEngineStore } from "@/store/engineStore";
import { Activity, ShieldAlert, Server, Router } from "lucide-react";
import { useMemo } from "react";

import TopBar from "@/components/TopBar";
import MetricCard from "@/components/MetricCard";
import CnhsChart from "@/components/CnhsChart";
import SecurityLog from "@/components/SecurityLog";
import NetworkTopology from "@/components/NetworkTopology";
import TIPSPipeline from "@/components/TIPSPipeline";
import TimetableGantt from "@/components/TimetableGantt";

export default function Dashboard() {
  const { cnhsHistory, topology } = useEngineStore();

  // Aggregate metrics for KPI cards
  const kpiData = useMemo(() => {
    const currentScore = cnhsHistory.length > 0 ? cnhsHistory[cnhsHistory.length - 1].cnhsScore : 100;
    const activeAPs = topology.nodes.filter(n => n.type === 'ROOM_AP' && !n.isQuarantined).length;
    const totalBandwidth = topology.links.reduce((sum, link) => sum + link.currentLoadMbps, 0);
    
    // Determine Threat Level
    let threatLevel = "LOW";
    let threatStatus: "neutral" | "warning" | "critical" | "healthy" = "healthy";
    
    if (currentScore < 80) {
      threatLevel = "CRITICAL";
      threatStatus = "critical";
    } else if (currentScore < 90) {
      threatLevel = "ELEVATED";
      threatStatus = "warning";
    }

    return {
      currentScore,
      activeAPs,
      totalBandwidth,
      threatLevel,
      threatStatus
    };
  }, [cnhsHistory, topology]);

  return (
    <div className="flex flex-col h-full bg-bg w-full">
      <TopBar title="Overview" />
      
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard 
              label="NETWORK HEALTH" 
              value={`${kpiData.currentScore.toFixed(1)}`} 
              status={kpiData.currentScore < 80 ? "critical" : kpiData.currentScore < 90 ? "warning" : "healthy"}
              icon={<Activity className="w-4 h-4" />}
            />
            <MetricCard 
              label="ACTIVE APs" 
              value={kpiData.activeAPs} 
              icon={<Server className="w-4 h-4" />}
            />
            <MetricCard 
              label="THROUGHPUT" 
              value={kpiData.totalBandwidth.toFixed(0)} 
              unit="Mbps"
              icon={<Router className="w-4 h-4" />}
            />
            <MetricCard 
              label="THREAT LEVEL" 
              value={kpiData.threatLevel} 
              status={kpiData.threatStatus}
              icon={<ShieldAlert className="w-4 h-4" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CnhsChart />
            </div>
            <div className="lg:col-span-1 h-[400px]">
              <SecurityLog />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[500px]">
              <NetworkTopology />
            </div>
            <div className="flex flex-col gap-6">
              <TimetableGantt />
              <TIPSPipeline />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
