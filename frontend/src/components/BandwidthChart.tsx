"use client";

import { useSDNStore } from "@/store/useSDNStore";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

export default function BandwidthChart() {
  const { allocations, bandwidthCapacity } = useSDNStore();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-obsidian border border-surface-border p-3 rounded-lg shadow-xl">
          <p className="text-gray-300 font-mono text-sm">{payload[0].payload.classId}</p>
          <p className="text-quantum-teal font-bold">{payload[0].value} Mbps</p>
          <p className="text-gray-500 text-xs mt-1">{payload[0].payload.studentCount} students</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-surface border border-surface-border p-6 rounded-xl flex flex-col h-full min-h-[300px]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-gray-400 text-xs uppercase tracking-widest font-semibold">
          Equitable Allocator
        </h3>
        <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
          CAP: {bandwidthCapacity} Mbps
        </span>
      </div>

      <div className="flex-1 w-full h-full relative -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={allocations} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 40 }}>
            <XAxis type="number" domain={[0, bandwidthCapacity]} hide />
            <YAxis 
              dataKey="classId" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 12, fontFamily: 'monospace' }} 
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Bar dataKey="allocatedMbps" radius={[0, 4, 4, 0]} animationDuration={1500}>
              {allocations.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "var(--color-quantum-teal)" : "var(--color-kinetic-purple)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
