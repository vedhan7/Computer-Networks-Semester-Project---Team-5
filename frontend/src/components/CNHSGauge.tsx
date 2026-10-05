"use client";

import { motion } from "framer-motion";
import { useSDNStore } from "@/store/useSDNStore";

export default function CNHSGauge() {
  const { cnhsScore } = useSDNStore();
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (cnhsScore / 100) * circumference;

  const isCritical = cnhsScore < 80;
  const strokeColor = isCritical ? "var(--color-anomaly-critical)" : "var(--color-quantum-teal)";

  return (
    <div className="bg-surface border border-surface-border p-6 rounded-xl flex flex-col items-center justify-center relative">
      <h3 className="text-gray-400 text-xs uppercase tracking-widest font-semibold absolute top-6 left-6">
        CNHS Dial
      </h3>
      
      <div className="relative mt-8 flex items-center justify-center">
        {/* Background Track */}
        <svg className="transform -rotate-90 w-40 h-40">
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-obsidian"
          />
          {/* Animated Progress */}
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            stroke={strokeColor}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
            className="drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]"
            style={isCritical ? { filter: "drop-shadow(0 0 10px rgba(244,63,94,0.5))" } : {}}
          />
        </svg>
        
        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`text-4xl font-bold ${isCritical ? "text-anomaly-critical" : "text-quantum-teal"}`}
          >
            {cnhsScore.toFixed(1)}
          </motion.span>
          <span className="text-[10px] text-gray-500 tracking-wider">SCORE</span>
        </div>
      </div>
    </div>
  );
}
