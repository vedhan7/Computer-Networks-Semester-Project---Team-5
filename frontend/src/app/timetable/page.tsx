"use client";

import { useEngineStore } from "@/store/engineStore";
import TopBar from "@/components/TopBar";
import TimetableGantt from "@/components/TimetableGantt";

export default function TimetablePage() {
  return (
    <div className="flex flex-col h-full bg-bg w-full">
      <TopBar title="ERP Timetable" />
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <TimetableGantt />
        </div>
      </div>
    </div>
  );
}
