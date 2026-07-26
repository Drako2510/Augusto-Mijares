"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface AsistenciaItem {
  materia: string;
  icono: string;
  estado: string;
}

interface AsistenciaHoyData {
  asistencias: AsistenciaItem[];
}

/**
 * Hook que obtiene las asistencias de hoy con detección automática de medianoche.
 * - Refresca al cambiar el día sin intervención del usuario.
 * - También detecta cuando el usuario vuelve a la pestaña.
 */
export function useAsistenciaHoy(estudianteId: string) {
  const [data, setData] = useState<AsistenciaHoyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fechaActual, setFechaActual] = useState(new Date());
  const lastFetchRef = useRef<string>("");

  const fetchData = useCallback(async () => {
    if (!estudianteId) return;
    try {
      const hoy = new Date();
      const fechaStr = hoy.toISOString().split("T")[0];
      const res = await fetch(`/api/asistencia/hoy?estudianteId=${estudianteId}&fecha=${fechaStr}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        lastFetchRef.current = fechaStr;
      }
    } catch {
      // Silencioso
    } finally {
      setLoading(false);
    }
  }, [estudianteId]);

  // Detección de cambio de día (cada 60s)
  useEffect(() => {
    if (!estudianteId) return;

    const checkDayChange = () => {
      const ahora = new Date();
      const hoy = ahora.toISOString().split("T")[0];

      // Si cambió el día desde el último fetch
      if (hoy !== lastFetchRef.current) {
        setFechaActual(ahora);
        fetchData();
      }
    };

    // Verificar inmediatamente
    checkDayChange();

    // Verificar cada minuto
    const interval = setInterval(checkDayChange, 60000);

    // Detectar cuando el usuario vuelve a la pestaña
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkDayChange();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [estudianteId, fetchData]);

  // Escuchar refresco del dashboard (SSE)
  useEffect(() => {
    if (!estudianteId) return;
    const handler = () => fetchData();
    window.addEventListener("dashboard:refresh", handler);
    return () => window.removeEventListener("dashboard:refresh", handler);
  }, [estudianteId, fetchData]);

  return { data, loading, refetch: fetchData, fechaActual };
}
