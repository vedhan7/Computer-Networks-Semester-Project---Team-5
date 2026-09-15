"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

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

const WS_URL = "ws://localhost:8000/ws/monitor";

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<WSStatus>("connecting");
  const [data, setData] = useState<ACORNUpdate | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        retryCount.current = 0;
      };

      ws.onmessage = (e) => {
        try {
          const parsed: ACORNUpdate = JSON.parse(e.data);
          setData(parsed);
          setLastUpdate(new Date());
        } catch { /* ignore parse errors */ }
      };

      ws.onclose = () => {
        setStatus("reconnecting");
        const delay = Math.min(1000 * 2 ** retryCount.current, 15000);
        retryCount.current += 1;
        reconnectRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      setStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connect]);

  return (
    <WSContext.Provider value={{ status, data, lastUpdate }}>
      {children}
    </WSContext.Provider>
  );
}

export const useWebSocket = () => useContext(WSContext);
