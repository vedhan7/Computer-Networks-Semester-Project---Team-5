"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../lib/firebase";

export type WSStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

export interface ACORNUpdate {
  type: string;
  timestamp: string;
  campus_cnhs: number;
  campus_status: string;
  erp_context: {
    active_event: {
      id: string; title: string; event_type: string;
      department: string | null; venue: string;
      start_time: string; end_time: string;
      expected_users: number; bandwidth_profile: string;
      requires_security_lockdown: boolean; network_segments: string[];
    } | null;
    upcoming_events: unknown[];
    overall_demand_level: string;
    predicted_segment_loads: Record<string, number>;
  };
  segments: Array<{
    segment_id: string; utilization_percent: number; used_mbps: number;
    total_mbps: number; latency_ms: number; packet_loss_percent: number;
    active_connections: number; history: number[];
    cnhs: number; status: string; explanation: string;
    observed_utilization: number; predicted_utilization: number;
    deviation_percent: number; criticality_weight: number; activity_context: string;
  }>;
  active_intents: unknown[];
  tips_pipeline: {
    staged: number; armed: number; active: number;
    staged_intents: unknown[]; armed_intents: unknown[]; active_intents_list: unknown[];
  };
  active_faults: unknown[];
  recent_healing: unknown[];
  new_healing_events: unknown[];
  apcr_recent: unknown[];
  alerts: Array<{ severity: string; segment_id: string; message: string; timestamp: string }>;
}

interface WSCtx {
  status: WSStatus;
  data: ACORNUpdate | null;
  lastUpdate: Date | null;
}

const WSContext = createContext<WSCtx>({ status: "connecting", data: null, lastUpdate: null });

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<WSStatus>("connecting");
  const [data, setData] = useState<ACORNUpdate | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Listen to Firebase connection state
    const connectedRef = ref(database, ".info/connected");
    const unsubConnected = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        setStatus("connected");
      } else {
        setStatus("connecting");
      }
    });

    // Listen to the ACORN network state
    const stateRef = ref(database, "acorn/network_state");
    const unsubState = onValue(stateRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setData(val);
        setLastUpdate(new Date());
      }
    });

    return () => {
      unsubConnected();
      unsubState();
    };
  }, []);

  return (
    <WSContext.Provider value={{ status, data, lastUpdate }}>
      {children}
    </WSContext.Provider>
  );
}

export const useWebSocket = () => useContext(WSContext);
