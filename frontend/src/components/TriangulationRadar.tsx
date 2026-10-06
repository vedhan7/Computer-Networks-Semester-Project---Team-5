"use client";

import { TriangulationResult } from "@/lib/engine/triangulation";
import { Crosshair, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

export default function TriangulationRadar({ result }: { result?: TriangulationResult | null }) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (result) {
      const interval = setInterval(() => setPulse(p => !p), 1000);
      return () => clearInterval(interval);
    }
  }, [result]);

  if (!result) {
    return (
      <div className="bg-surface border border-border rounded-md p-5 h-full flex flex-col items-center justify-center text-text-muted">
        <Crosshair className="w-8 h-8 mb-4 opacity-50" />
        <p className="text-sm font-medium">Spatial Triangulation Offline</p>
        <p className="text-xs text-text-faint mt-1">Awaiting anomaly tracking request.</p>
      </div>
    );
  }

  // Calculate SVG bounds based on AP locations
  const minX = Math.min(result.ap1.x, result.ap2.x, result.ap3.x) - 50;
  const maxX = Math.max(result.ap1.x, result.ap2.x, result.ap3.x) + 50;
  const minY = Math.min(result.ap1.y, result.ap2.y, result.ap3.y) - 50;
  const maxY = Math.max(result.ap1.y, result.ap2.y, result.ap3.y) + 50;
  
  const width = maxX - minX;
  const height = maxY - minY;

  const aps = [result.ap1, result.ap2, result.ap3];

  return (
    <div className="bg-surface border border-border rounded-md p-5 h-full flex flex-col relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-text-secondary flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-accent" /> Active Triangulation
        </h3>
        <div className="text-right">
          <span className="text-[10px] text-text-faint uppercase">Target MAC</span>
          <div className="text-xs font-mono font-bold text-text-primary">{result.mac}</div>
        </div>
      </div>

      <div className="flex-1 w-full bg-surface-secondary/30 rounded border border-border/50 relative overflow-hidden flex items-center justify-center">
        {/* Radar Background Sweeps */}
        <div className="absolute inset-0 border-[0.5px] border-accent/10 rounded-full scale-150" />
        <div className="absolute inset-0 border-[0.5px] border-accent/20 rounded-full scale-100" />
        <div className="absolute inset-0 border-[0.5px] border-accent/30 rounded-full scale-50" />
        <div className="absolute inset-0 w-full h-full bg-[conic-gradient(from_0deg_at_50%_50%,rgba(0,0,0,0)_0deg,var(--color-accent)_360deg)] opacity-10 animate-[spin_4s_linear_infinite]" />

        <svg viewBox={`${minX} ${minY} ${width} ${height}`} className="absolute inset-0 w-full h-full z-10">
          
          {/* AP Nodes */}
          {aps.map((ap, i) => (
            <g key={ap.id}>
              <circle cx={ap.x} cy={ap.y} r={2} className="fill-text-faint" />
              {/* Signal strength rings */}
              <circle 
                cx={ap.x} 
                cy={ap.y} 
                r={Math.abs(ap.rssi) * 1.5} 
                className="fill-none stroke-accent/20 stroke-1" 
                strokeDasharray="4 4" 
              />
              <text x={ap.x} y={ap.y + 12} fontSize="4" textAnchor="middle" className="fill-text-muted font-mono">
                {ap.id}
              </text>
              <text x={ap.x} y={ap.y + 18} fontSize="4" textAnchor="middle" className="fill-text-faint font-mono">
                {ap.rssi} dBm
              </text>
            </g>
          ))}

          {/* Triangulation Lines */}
          {aps.map(ap => (
            <line 
              key={`line-${ap.id}`}
              x1={ap.x} y1={ap.y} 
              x2={result.estimatedX} y2={result.estimatedY}
              className="stroke-danger/30 stroke-[0.5px]"
              strokeDasharray="2 2"
            />
          ))}

          {/* Estimated Target Position */}
          <g transform={`translate(${result.estimatedX}, ${result.estimatedY})`}>
            <circle 
              cx={0} cy={0} r={4} 
              className={`fill-danger transition-opacity duration-300 ${pulse ? 'opacity-100' : 'opacity-40'}`} 
            />
            <circle cx={0} cy={0} r={1.5} className="fill-white" />
          </g>
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-bg border border-border p-3 rounded">
          <span className="text-[10px] text-text-faint uppercase block mb-1">Estimated Coords</span>
          <span className="text-sm font-mono text-text-secondary">
            {result.estimatedX.toFixed(1)}, {result.estimatedY.toFixed(1)}
          </span>
        </div>
        <div className="bg-bg border border-border p-3 rounded">
          <span className="text-[10px] text-text-faint uppercase block mb-1">Confidence Score</span>
          <span className={`text-sm font-mono font-bold ${result.confidence > 75 ? 'text-accent' : result.confidence > 50 ? 'text-warning' : 'text-danger'}`}>
            {result.confidence.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
