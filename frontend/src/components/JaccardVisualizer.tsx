"use client";

import { motion } from "framer-motion";
import { useSDNStore } from "@/store/useSDNStore";
import { Users } from "lucide-react";

export default function JaccardVisualizer() {
  const { jaccardScore } = useSDNStore();
  const isAuthorized = jaccardScore >= 0.60;

  // Generate mock nodes
  const nodes = Array.from({ length: 12 }).map((_, i) => i);

  return (
    <div className="bg-surface border border-surface-border p-6 rounded-xl relative overflow-hidden flex flex-col min-h-[300px]">
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h3 className="text-gray-400 text-xs uppercase tracking-widest font-semibold">
          Spatial Triangulation
        </h3>
        <div className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
          isAuthorized ? "bg-kinetic-purple/20 text-kinetic-purple border border-kinetic-purple/30" : "bg-obsidian text-gray-500 border border-surface-border"
        }`}>
          Score: {jaccardScore.toFixed(2)}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-between px-8 relative z-10">
        {/* Source Room */}
        <div className="w-32 h-32 border border-surface-border bg-obsidian rounded-lg flex flex-col items-center justify-center relative">
          <span className="text-gray-500 text-xs mb-2 font-mono">ROOM_A</span>
          <Users className="text-gray-600 w-8 h-8 opacity-30" />
        </div>

        {/* Destination Room */}
        <div className="w-32 h-32 border border-kinetic-purple/30 bg-kinetic-purple/5 rounded-lg flex flex-col items-center justify-center relative">
          <span className="text-kinetic-purple text-xs mb-2 font-mono">ROOM_B</span>
          <Users className="text-kinetic-purple w-8 h-8 opacity-60" />
          
          {/* Policy Shift Line */}
          {isAuthorized && (
            <motion.div 
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute top-1/2 -left-32 w-32 h-px bg-gradient-to-r from-transparent to-kinetic-purple origin-right"
            />
          )}
        </div>

        {/* Animated Nodes */}
        {nodes.map((node) => (
          <motion.div
            key={node}
            initial={false}
            animate={isAuthorized ? {
              x: 200 + (Math.random() * 40 - 20),
              y: Math.random() * 40 - 20,
              opacity: [0, 1, 0.8]
            } : {
              x: (Math.random() * 40 - 20),
              y: (Math.random() * 40 - 20),
              opacity: 0.4
            }}
            transition={{ 
              duration: 1.5 + Math.random(), 
              ease: "easeInOut",
              delay: isAuthorized ? Math.random() * 0.5 : 0 
            }}
            className={`absolute left-[5.5rem] w-2 h-2 rounded-full ${
              isAuthorized ? "bg-kinetic-purple shadow-[0_0_8px_rgba(167,139,250,0.8)]" : "bg-gray-500"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
