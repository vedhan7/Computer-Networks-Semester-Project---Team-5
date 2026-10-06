"use client";
import TopBar from "@/components/TopBar";
import TriangulationRadar from "@/components/TriangulationRadar";
import NetworkTopology from "@/components/NetworkTopology";
import { useEngineStore } from "@/store/engineStore";

export default function TriangulationPage() {
  const activeTriangulation = useEngineStore((state) => state.activeTriangulation);

  return (
    <div className="flex flex-col h-full bg-bg w-full">
      <TopBar title="Spatial Triangulation" />
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[600px] flex flex-col">
            <TriangulationRadar result={activeTriangulation} />
          </div>
          <div className="h-[600px] flex flex-col">
            <NetworkTopology />
          </div>
        </div>
      </div>
    </div>
  );
}
