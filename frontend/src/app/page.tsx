import CNHSGauge from "@/components/CNHSGauge";
import ActiveThreatLog from "@/components/ActiveThreatLog";
import JaccardVisualizer from "@/components/JaccardVisualizer";
import BandwidthChart from "@/components/BandwidthChart";
import TIPSTimeline from "@/components/TIPSTimeline";

export default function Dashboard() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      
      {/* Header */}
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-100 flex items-center gap-3">
          SDN Command Center
          <div className="w-2 h-2 rounded-full bg-quantum-teal animate-pulse" />
        </h1>
        <p className="text-gray-500 mt-2 font-mono text-sm uppercase tracking-wider">
          System nominal • Awaiting telemetry • V 1.0.0
        </p>
      </header>

      {/* Top Row: CNHS + Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 h-80">
          <CNHSGauge />
        </div>
        <div className="lg:col-span-2 h-80">
          <ActiveThreatLog />
        </div>
      </div>

      {/* Middle Row: Math Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <JaccardVisualizer />
        <BandwidthChart />
      </div>

      {/* Bottom Row: TIPS */}
      <TIPSTimeline />

    </div>
  );
}
