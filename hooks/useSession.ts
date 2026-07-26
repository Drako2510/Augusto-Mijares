"use client";

import { useEffect, useState, useCallback } from "react";

interface User {
  id: string;
  email: string;
  nombre: string;
  rol: string;
}

interface SessionState {
  user: User | null;
  loading: boolean;
}

/**
 * Hook que consulta /api/auth/session y mantiene el usuario en estado.
 * Se refresca al montar y también se puede invalidar manualmente.
 */
export function useSession() {
  const [state, setState] = useState<SessionState>({ user: null, loading: true });

  const fetchSession = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setState({ user: data.user ?? null, loading: false });
    } catch {
      setState({ user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return { ...state, refetch: fetchSession };
}
