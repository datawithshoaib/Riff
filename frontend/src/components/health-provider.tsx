"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api } from "@/lib/api";
import type { HealthResponse } from "@/lib/types";

type HealthState = {
  health: HealthResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const HealthContext = createContext<HealthState | null>(null);

export function HealthProvider({ children }: { children: React.ReactNode }) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await api.health();
      setHealth(next);
      setError(null);
    } catch (err) {
      setHealth(null);
      setError(err instanceof Error ? err.message : "The API is unreachable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    api
      .health()
      .then((next) => {
        if (cancelled) return;
        setHealth(next);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setHealth(null);
        setError(err instanceof Error ? err.message : "The API is unreachable.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ health, loading, error, refresh }),
    [health, loading, error, refresh],
  );

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
}

export function useHealth(): HealthState {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error("useHealth must be used inside HealthProvider");
  }
  return context;
}
