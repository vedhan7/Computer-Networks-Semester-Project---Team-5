"use client";
import TopBar from "@/components/TopBar";
import CnhsChart from "@/components/CnhsChart";
import SecurityLog from "@/components/SecurityLog";

export default function SecurityPage() {
  return (
    <div className="flex flex-col h-full bg-bg w-full">
      <TopBar title="Security (CNHS)" />
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div className="h-[500px]">
            <CnhsChart />
          </div>
          <div className="h-[400px]">
            <SecurityLog />
          </div>
        </div>
      </div>
    </div>
  );
}
