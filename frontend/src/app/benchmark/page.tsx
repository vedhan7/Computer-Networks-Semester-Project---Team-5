"use client";
import TopBar from "@/components/TopBar";
import BenchmarkOverlay from "@/components/BenchmarkOverlay";

export default function BenchmarkPage() {
  return (
    <div className="flex flex-col h-full bg-bg w-full">
      <TopBar title="System Benchmarks" />
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto h-[500px]">
          <BenchmarkOverlay />
        </div>
      </div>
    </div>
  );
}
