"use client";

import { useState, useEffect, useCallback } from "react";

interface AsistenciaItem {
  materia: string;
  icono: string;
  estado: string;
  fecha: string;
}

interface EvaluacionItem {
  id: string;
  titulo: string;
  fecha: string;
  materia: string;
  icono: string;
  calificacion: number;
}

interface TareaItem {
  id: string;
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  materia: string;
  icono: string;
}

interface DashboardData {
  asistencia: AsistenciaItem[];
  evaluaciones: EvaluacionItem[];
  tareas: TareaItem[];
}

interface UseEstudianteDashboardResult {
  data: DashboardData;
  loading: boolean;
  refetch: () => void;
}

/**
 * Hook combinado que obtiene todos los datos del dashboard para un estudiante
 * en una sola llamada a /api/dashboard/estudiante.
 * Polling cada 30s + refresco instantáneo vía SSE.
 */
export function useEstudianteDashboard(
  estudianteId: string
): UseEstudianteDashboardResult {
  const [data, setData] = useState<DashboardData>({
    asistencia: [],
    evaluaciones: [],
    tareas: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!estudianteId) return;
    try {
      const res = await fetch(
        `/api/dashboard/estudiante?estudianteId=${estudianteId}`
      );
      if (res.ok) {
        const json = await res.json();
        setData({
          asistencia: json.asistencia ?? [],
          evaluaciones: json.evaluaciones ?? [],
          tareas: json.tareas ?? [],
        });
      }
    } catch {
      // Silencioso
    } finally {
      setLoading(false);
    }
  }, [estudianteId]);

  // Carga inicial + polling 30s
  useEffect(() => {
    if (!estudianteId) return;
    setLoading(true);
    fetchData().finally(() => setLoading(false));
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [estudianteId, fetchData]);

  // Refresco instantáneo vía SSE
  useEffect(() => {
    if (!estudianteId) return;
    const handler = () => fetchData();
    window.addEventListener("dashboard:refresh", handler);
    return () => window.removeEventListener("dashboard:refresh", handler);
  }, [estudianteId, fetchData]);

  return { data, loading, refetch: fetchData };
}
