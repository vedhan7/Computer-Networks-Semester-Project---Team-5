import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface TelemetryData {
  id: string; // roomId
  currentBandwidth: number;
  connectedMacAddresses: string[];
  cnhsScore: number;
  quarantineStatus: boolean;
  allocatedBandwidth: number;
  matchScore: number;
  isMigrated: boolean;
  lastUpdated: any;
  // Included from TIPS if needed
  tipsStaged?: any;
  tipsArmed?: any;
  tipsActive?: any;
  tipsExpired?: any;
}

export function useNetworkTelemetry() {
  const [telemetry, setTelemetry] = useState<TelemetryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'NetworkTelemetry'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as TelemetryData[];
        setTelemetry(data);
        setIsLoading(false);
      },
      (err) => {
        console.error("Firestore Listener Error:", err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { telemetry, isLoading, error };
}
