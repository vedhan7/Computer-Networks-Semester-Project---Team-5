"use client";

import { useEngineStore } from "@/store/engineStore";
import { TopologyNode } from "@/lib/engine/topology";
import { useState } from "react";
import { Network, X, Server, ShieldAlert } from "lucide-react";

export default function NetworkTopology() {
  const { topology } = useEngineStore();
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);

  // Constants for SVG layout
  const width = 900;
  const height = 450;
  const coreY = 50;
  const buildingY = 200;
  const roomY = 350;

  // Compute node positions
  const positions: Record<string, { x: number, y: number }> = {
    'CORE': { x: width / 2, y: coreY },
    'SW-ALPHA': { x: width * 0.2, y: buildingY },
    'SW-BETA': { x: width * 0.5, y: buildingY },
    'SW-GAMMA': { x: width * 0.8, y: buildingY },
  };

  const buildings = ['Alpha', 'Beta', 'Gamma'];
  buildings.forEach((b, i) => {
    const bCenterX = width * (0.2 + i * 0.3);
    for (let r = 1; r <= 3; r++) {
      const roomId = `${b}-${r}01`;
      positions[roomId] = {
        x: bCenterX + (r - 2) * 80, // Spread rooms by 80px
        y: roomY
      };
    }
  });

  const getLinkColor = (load: number, capacity: number, isFailed: boolean) => {
    if (isFailed) return "stroke-danger";
    const pct = (load / capacity) * 100;
    if (pct > 90) return "stroke-danger";
    if (pct > 75) return "stroke-warning";
    return "stroke-accent";
  };

  return (
    <div className="bg-surface border border-border rounded-md p-5 relative overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-medium text-text-secondary">Network Digital Twin</h3>
        <div className="flex items-center gap-3 text-2xs text-text-faint">
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-accent" /> Healthy
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-warning" /> High Load
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5 bg-danger" /> Critical/Failed
          </span>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto min-h-[450px]">
        <svg width={width} height={height} className="mx-auto block" style={{ minWidth: width }}>
          {/* Draw Links */}
          {topology.links.map(link => {
            const sourcePos = positions[link.source];
            const targetPos = positions[link.target];
            const pct = ((link.currentLoadMbps / link.capacityMbps) * 100).toFixed(1);
            
            if (!sourcePos || !targetPos) return null;

            return (
              <g key={link.id}>
                <line
                  x1={sourcePos.x}
                  y1={sourcePos.y}
                  x2={targetPos.x}
                  y2={targetPos.y}
                  className={`${getLinkColor(link.currentLoadMbps, link.capacityMbps, link.isFailed)} transition-colors duration-500`}
                  strokeWidth="2"
                  strokeDasharray={link.isFailed ? "5,5" : "none"}
                />
                {/* % Label background */}
                <rect 
                  x={(sourcePos.x + targetPos.x) / 2 - 16}
                  y={(sourcePos.y + targetPos.y) / 2 - 8}
                  width="32"
                  height="16"
                  rx="4"
                  fill="var(--color-surface)"
                  stroke="var(--color-border)"
                  strokeWidth="1"
                />
                {/* % Label text */}
                <text
                  x={(sourcePos.x + targetPos.x) / 2}
                  y={(sourcePos.y + targetPos.y) / 2 + 3}
                  textAnchor="middle"
                  className="text-[9px] fill-text-muted font-mono"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Draw Nodes */}
          {topology.nodes.map(node => {
            const pos = positions[node.id];
            if (!pos) return null;

            const isSelected = selectedNode?.id === node.id;
            const nodeSize = node.type === 'CORE_SWITCH' ? 24 : node.type === 'BUILDING_SWITCH' ? 20 : 16;
            
            return (
              <g 
                key={node.id} 
                className="cursor-pointer group"
                onClick={() => setSelectedNode(node)}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={nodeSize}
                  className={`transition-colors ${
                    isSelected 
                      ? "fill-accent/20 stroke-accent" 
                      : node.isQuarantined 
                        ? "fill-danger/10 stroke-danger"
                        : "fill-surface-secondary stroke-border group-hover:stroke-text-muted"
                  }`}
                  strokeWidth="2"
                />
                
                {/* Icon inside circle */}
                <foreignObject x={pos.x - 8} y={pos.y - 8} width="16" height="16">
                  <div className="flex items-center justify-center w-full h-full text-text-secondary">
                    {node.type === 'ROOM_AP' && node.isQuarantined ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-danger" />
                    ) : node.type === 'ROOM_AP' ? (
                      <Network className="w-3.5 h-3.5" />
                    ) : (
                      <Server className="w-4 h-4" />
                    )}
                  </div>
                </foreignObject>

                {/* Label */}
                <text
                  x={pos.x}
                  y={pos.y + nodeSize + 14}
                  textAnchor="middle"
                  className={`text-xs font-mono transition-colors ${
                    isSelected ? "fill-text-primary font-medium" : "fill-text-muted"
                  }`}
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Flow Table Drawer (Overlay) */}
      {selectedNode && (
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-surface-secondary border-l border-border shadow-xl transform transition-transform duration-300 flex flex-col z-10">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h4 className="text-sm font-medium text-text-primary">{selectedNode.label}</h4>
              <p className="text-xs text-text-muted font-mono">{selectedNode.id} - Flow Table</p>
            </div>
            <button 
              onClick={() => setSelectedNode(null)}
              className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-surface transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {selectedNode.flowTable.length === 0 ? (
              <div className="text-center text-text-muted text-sm py-8">
                No active flow rules.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedNode.flowTable.map(rule => (
                  <div key={rule.id} className="bg-surface border border-border rounded-md p-3 text-xs">
                    <div className="flex justify-between items-center mb-2 border-b border-border/50 pb-2">
                      <span className="font-mono font-medium text-text-secondary">{rule.id}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-medium ${
                        rule.state === 'ACTIVE' ? "bg-accent/10 text-accent border border-accent/20" : "bg-surface-elevated text-text-muted border border-border"
                      }`}>
                        {rule.state}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-text-muted font-mono mt-1">
                      <div>
                        <span className="text-text-faint">Priority:</span> {rule.priority}
                      </div>
                      <div>
                        <span className="text-text-faint">Match W_ac:</span> {rule.match.priorityGroup}
                      </div>
                      <div className="col-span-2 truncate">
                        <span className="text-text-faint">Match Room:</span> {rule.match.room}
                      </div>
                      <div>
                        <span className="text-text-faint">Rate Limit:</span> {rule.action.rateLimitMbps} Mbps
                      </div>
                      <div>
                        <span className="text-text-faint">Queue:</span> {rule.action.queue}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
