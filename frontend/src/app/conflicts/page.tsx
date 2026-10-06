"use client";
import TopBar from "@/components/TopBar";
import CashDecisions from "@/components/CashDecisions";
import TIPSPipeline from "@/components/TIPSPipeline";

export default function ConflictsPage() {
  return (
    <div className="flex flex-col h-full bg-bg w-full">
      <TopBar title="APCR & CASH Conflicts" />
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <div className="h-[400px]">
            <CashDecisions />
          </div>
          <div>
            <TIPSPipeline />
          </div>
        </div>
      </div>
    </div>
  );
}
