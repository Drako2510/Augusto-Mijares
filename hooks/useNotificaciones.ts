"use client";

import { useCallback, useEffect, useState } from "react";
import { buildStorageKey, readFromStorage, writeToStorage } from "@/utils/localStorage";
import { formatearHora, generarId } from "@/utils/formatters";

export interface NotificacionItem {
  id: string;
  mensaje: string;
  hora: string;
  timestamp: number;
  tipo: "asistencia" | "tarea" | "evaluacion";
}

/**
 * Maneja el historial de notificaciones simuladas de una sección específica.
 * Persiste en localStorage bajo la clave historial_notificaciones_[materia]_[anio]_[seccion].
 */
export function useNotificaciones(materiaId: string, anioId: string, seccionId: string) {
  const storageKey = buildStorageKey(
    "historial_notificaciones",
    materiaId,
    anioId,
    seccionId
  );

  const [historial, setHistorial] = useState<NotificacionItem[]>([]);

  useEffect(() => {
    setHistorial(readFromStorage<NotificacionItem[]>(storageKey, []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const agregarNotificacion = useCallback(
    (mensaje: string, tipo: NotificacionItem["tipo"] = "asistencia") => {
      setHistorial((prev) => {
        const nueva: NotificacionItem = {
          id: generarId(),
          mensaje,
          hora: formatearHora(),
          timestamp: Date.now(),
          tipo,
        };
        const actualizado = [nueva, ...prev].slice(0, 100);
        writeToStorage(storageKey, actualizado);
        return actualizado;
      });
    },
    [storageKey]
  );

  const limpiarHistorial = useCallback(() => {
    setHistorial([]);
    writeToStorage(storageKey, []);
  }, [storageKey]);

  return { historial, agregarNotificacion, limpiarHistorial };
}
