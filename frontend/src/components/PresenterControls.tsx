"use client";

import { useEngineStore } from "@/store/engineStore";
import { useState } from "react";
import { Settings2, Play, Hash, Zap, RefreshCw, AlertTriangle, ArrowRightLeft, Unplug, ShieldAlert } from "lucide-react";

export default function PresenterControls() {
  const { seed, initialize, injectScenario } = useEngineStore();
  const [isOpen, setIsOpen] = useState(false);
  const [inputSeed, setInputSeed] = useState(seed.toString());

  // Simple string hashing function for the "Run Hash" requirement
  const getRunHash = (s: number) => {
    let hash = 0;
    const str = s.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  };

  const runHash = getRunHash(seed);

  return (
    <>
      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-3 bg-surface border border-border shadow-2xl rounded-full text-text-muted hover:text-accent transition-colors"
      >
        <Settings2 className="w-5 h-5" />
      </button>

      {/* Control Panel */}
      <div 
        className={`fixed top-14 bottom-0 right-0 w-80 bg-surface/95 backdrop-blur-md border-l border-border z-40 transform transition-transform duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <Play className="w-4 h-4 text-accent" /> Presenter Controls
          </h3>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          {/* Engine State */}
          <div className="space-y-3">
            <span className="text-2xs font-semibold text-text-faint uppercase tracking-wider">Engine State</span>
            
            <div className="flex items-center justify-between text-xs bg-surface-secondary p-2 rounded border border-border font-mono">
              <span className="text-text-muted flex items-center gap-1"><Hash className="w-3 h-3" /> Run Hash</span>
              <span className="text-accent">{runHash}</span>
            </div>

            <div className="flex gap-2">
              <input 
                type="number" 
                value={inputSeed}
                onChange={(e) => setInputSeed(e.target.value)}
                className="flex-1 bg-surface-secondary border border-border rounded px-2 py-1.5 text-xs text-text-secondary focus:outline-none focus:border-accent"
                placeholder="Seed"
              />
              <button 
                onClick={() => initialize(parseInt(inputSeed) || 123456789)}
                className="px-3 py-1.5 bg-surface-secondary border border-border rounded text-xs hover:text-accent transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>
          </div>

          {/* Scenario Injections */}
          <div className="space-y-2">
            <span className="text-2xs font-semibold text-text-faint uppercase tracking-wider block mb-3">Scenario Injections</span>
            
            <button 
              onClick={() => injectScenario('DDOS')}
              className="w-full flex items-center gap-3 p-2.5 rounded-md border border-danger/20 bg-danger/5 hover:bg-danger/10 transition-colors text-left group"
            >
              <AlertTriangle className="w-4 h-4 text-danger group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-medium text-danger">Inject DDoS Spike</div>
                <div className="text-[10px] text-text-muted">Target highest priority room with 850 Mbps</div>
              </div>
            </button>

            <button 
              onClick={() => injectScenario('EXAM_SURGE')}
              className="w-full flex items-center gap-3 p-2.5 rounded-md border border-warning/20 bg-warning/5 hover:bg-warning/10 transition-colors text-left group"
            >
              <Zap className="w-4 h-4 text-warning group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-medium text-warning">Exam Surge</div>
                <div className="text-[10px] text-text-muted">Simulate large cohort connecting instantly</div>
              </div>
            </button>

            <button 
              onClick={() => injectScenario('ROOM_MOVE')}
              className="w-full flex items-center gap-3 p-2.5 rounded-md border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-colors text-left group"
            >
              <ArrowRightLeft className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-medium text-accent">Ad-hoc Room Move</div>
                <div className="text-[10px] text-text-muted">Trigger spatial triangulation evaluation</div>
              </div>
            </button>

            <button 
              onClick={() => injectScenario('LINK_FAILURE')}
              className="w-full flex items-center gap-3 p-2.5 rounded-md border border-danger/20 bg-danger/5 hover:bg-danger/10 transition-colors text-left group"
            >
              <Unplug className="w-4 h-4 text-danger group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-medium text-danger">Link Failure</div>
                <div className="text-[10px] text-text-muted">Break core-to-building link for CASH failover</div>
              </div>
            </button>

            <button 
              onClick={() => injectScenario('ROGUE_MAC')}
              className="w-full flex items-center gap-3 p-2.5 rounded-md border border-danger/20 bg-danger/5 hover:bg-danger/10 transition-colors text-left group"
            >
              <ShieldAlert className="w-4 h-4 text-danger group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-medium text-danger">Rogue MAC Flood</div>
                <div className="text-[10px] text-text-muted">Inject 500 unknown MACs to test containment</div>
              </div>
            </button>
          </div>

          {/* Scripted Demo */}
          <div className="space-y-3 pt-4 border-t border-border">
            <button className="w-full py-2.5 rounded-md bg-accent text-bg text-sm font-semibold hover:bg-accent/90 transition-colors flex justify-center items-center gap-2">
              <Play className="w-4 h-4 fill-current" /> Play Scripted Demo
            </button>
            <p className="text-[10px] text-text-muted text-center">
              Runs a 3-minute continuous scenario mapping to the paper's evaluation phases.
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
