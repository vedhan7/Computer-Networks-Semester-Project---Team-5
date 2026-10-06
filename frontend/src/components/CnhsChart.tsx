"use client";

import { useEngineStore } from "@/store/engineStore";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { useMemo } from "react";
import { Activity } from "lucide-react";

export default function CnhsChart() {
  const { cnhsHistory, currentTime } = useEngineStore();

  const data = useMemo(() => {
    // Group by timestamp and calculate average CNHS across all rooms at that time
    const grouped = new Map<number, { sum: number; count: number }>();
    
    cnhsHistory.forEach(record => {
      const existing = grouped.get(record.timestamp) || { sum: 0, count: 0 };
      grouped.set(record.timestamp, {
        sum: existing.sum + record.cnhsScore,
        count: existing.count + 1
      });
    });

    const arr = Array.from(grouped.entries())
      .map(([timestamp, { sum, count }]) => ({
        timestamp,
        timeLabel: new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avgScore: sum / count
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    // If no data, provide a baseline
    if (arr.length === 0) {
      return [{ timestamp: currentTime, timeLabel: new Date(currentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), avgScore: 100 }];
    }
    
    // Limit to last 50 points to prevent chart from getting too crowded
    return arr.slice(-50);
  }, [cnhsHistory, currentTime]);

  const currentScore = data.length > 0 ? data[data.length - 1].avgScore : 100;
  
  return (
    <div className="bg-surface border border-border rounded-md p-5 flex flex-col h-full min-h-[300px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
            <Activity className="w-4 h-4" /> Global CNHS Trend
          </h3>
          <p className="text-[10px] text-text-faint mt-1 font-mono">CNHS = 100 - (0.8 * D * log₁₀(W_ac + 1))</p>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-xs text-text-muted">Current Score</span>
          <span className={`text-2xl font-bold font-mono ${currentScore > 90 ? 'text-accent' : currentScore > 75 ? 'text-warning' : 'text-danger'}`}>
            {currentScore.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="flex-1 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.5} />
            <XAxis 
              dataKey="timeLabel" 
              stroke="var(--color-text-faint)" 
              fontSize={10}
              tickMargin={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              domain={[0, 100]} 
              stroke="var(--color-text-faint)" 
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)', borderRadius: '6px' }}
              itemStyle={{ color: 'var(--color-accent)' }}
              labelStyle={{ color: 'var(--color-text-secondary)' }}
            />
            <ReferenceLine y={75} stroke="var(--color-warning)" strokeDasharray="3 3" opacity={0.5} />
            <ReferenceLine y={50} stroke="var(--color-danger)" strokeDasharray="3 3" opacity={0.5} />
            <Line 
              type="monotone" 
              dataKey="avgScore" 
              name="Avg CNHS"
              stroke="var(--color-accent)" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: 'var(--color-accent)' }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
