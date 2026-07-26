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

interface EstudianteData {
  asistencia: AsistenciaItem[];
  evaluaciones: EvaluacionItem[];
  tareas: TareaItem[];
  loading: boolean;
  refetchAll: () => void;
}

/**
 * Hook que obtiene datos del estudiante (asistencia, evaluaciones, tareas)
 * con polling automático. Reemplaza a React Query para evitar dependencias extra.
 */
export function useEstudianteData(estudianteId: string): EstudianteData {
  const [asistencia, setAsistencia] = useState<AsistenciaItem[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionItem[]>([]);
  const [tareas, setTareas] = useState<TareaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAsistencia = useCallback(async () => {
    try {
      const res = await fetch(`/api/asistencia/hoy?estudianteId=${estudianteId}`);
      if (res.ok) {
        const data = await res.json();
        setAsistencia(data.asistencias ?? []);
      }
    } catch { /* fallback silencioso */ }
  }, [estudianteId]);

  const fetchEvaluaciones = useCallback(async () => {
    try {
      const res = await fetch(`/api/evaluaciones/proximas?estudianteId=${estudianteId}`);
      if (res.ok) {
        const data = await res.json();
        setEvaluaciones(data.evaluaciones ?? []);
      }
    } catch { /* fallback */ }
  }, [estudianteId]);

  const fetchTareas = useCallback(async () => {
    try {
      const res = await fetch(`/api/tareas/pendientes?estudianteId=${estudianteId}`);
      if (res.ok) {
        const data = await res.json();
        setTareas(data.tareas ?? []);
      }
    } catch { /* fallback */ }
  }, [estudianteId]);

  const refetchAll = useCallback(async () => {
    await Promise.all([fetchAsistencia(), fetchEvaluaciones(), fetchTareas()]);
  }, [fetchAsistencia, fetchEvaluaciones, fetchTareas]);

  // Carga inicial
  useEffect(() => {
    if (!estudianteId) return;
    setLoading(true);
    refetchAll().finally(() => setLoading(false));
  }, [estudianteId, refetchAll]);

  // Polling: asistencia cada 30s, evaluaciones y tareas cada 60s
  useEffect(() => {
    if (!estudianteId) return;
    const i1 = setInterval(fetchAsistencia, 30000);
    const i2 = setInterval(fetchEvaluaciones, 60000);
    const i3 = setInterval(fetchTareas, 60000);
    return () => { clearInterval(i1); clearInterval(i2); clearInterval(i3); };
  }, [estudianteId, fetchAsistencia, fetchEvaluaciones, fetchTareas]);

  return { asistencia, evaluaciones, tareas, loading, refetchAll };
}
