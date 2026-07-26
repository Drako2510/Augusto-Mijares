"use client";

import { useState, useEffect } from "react";

interface EstudianteHijo {
  id: string;
  nombre: string;
  anio: string;
  seccion: string;
}

interface UseHijosResult {
  hijos: EstudianteHijo[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook que obtiene los hijos (estudiantes) de un representante.
 * Consulta /api/hijos o usa localStorage como fallback.
 */
export function useHijos(usuarioId?: string): UseHijosResult {
  const [state, setState] = useState<UseHijosResult>({
    hijos: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!usuarioId) {
      setState({ hijos: [], loading: false, error: null });
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/hijos?usuarioId=${usuarioId}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setState({ hijos: data.hijos ?? [], loading: false, error: null });
          }
          return;
        }
      } catch {
        // Fallback a localStorage
      }

      // Fallback
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(`hijos_${usuarioId}`);
          if (!cancelled) {
            setState({
              hijos: raw ? JSON.parse(raw) : [],
              loading: false,
              error: null,
            });
          }
        } catch {
          if (!cancelled) setState({ hijos: [], loading: false, error: null });
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [usuarioId]);

  return state;
}
