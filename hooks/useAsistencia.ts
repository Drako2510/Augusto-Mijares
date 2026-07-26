"use client";

import { useCallback, useEffect, useState } from "react";
import { buildStorageKey, readFromStorage, writeToStorage } from "@/utils/localStorage";

export type EstadoAsistencia = "presente" | "ausente" | "tarde" | "justificado" | "sin_marcar";

export type RegistroAsistencia = Record<string, EstadoAsistencia>;

/**
 * Maneja el estado de asistencia por estudiante para una sección específica.
 * - Persiste en localStorage como fallback.
 * - Llama a POST /api/asistencia (que también crea notificaciones para representantes).
 * - `estudianteMap`: mapeo nombre → id para las llamadas a la API.
 */
export function useAsistencia(
  materiaId: string,
  anioId: string,
  seccionId: string,
  estudiantes: string[],
  onCambio?: (estudiante: string, estado: EstadoAsistencia) => void,
  estudianteMap?: Record<string, string> // nombre → id
) {
  const storageKey = buildStorageKey("asistencias", materiaId, anioId, seccionId);

  const [asistencia, setAsistencia] = useState<RegistroAsistencia>({});

  useEffect(() => {
    const inicial = readFromStorage<RegistroAsistencia>(storageKey, {});
    const completo: RegistroAsistencia = {};
    estudiantes.forEach((nombre) => {
      completo[nombre] = inicial[nombre] ?? "sin_marcar";
    });
    setAsistencia(completo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const marcarAsistencia = useCallback(
    (estudiante: string, estado: EstadoAsistencia) => {
      setAsistencia((prev) => {
        const estadoActual = prev[estudiante];
        const nuevoEstado: EstadoAsistencia =
          estadoActual === estado ? "sin_marcar" : estado;

        const actualizado = { ...prev, [estudiante]: nuevoEstado };
        // Persistir en localStorage (fallback)
        writeToStorage(storageKey, actualizado);

        // Llamar a la API para guardar en BD + notificar representantes
        const estudianteId = estudianteMap?.[estudiante];
        if (estudianteId && nuevoEstado !== "sin_marcar") {
          fetch("/api/asistencia", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              estudianteId,
              materiaId,
              anio: anioId,
              seccion: seccionId,
              estado: nuevoEstado,
            }),
          }).catch(() => {
            // API falló, pero localStorage ya tiene el dato
          });
        }

        if (onCambio) {
          onCambio(estudiante, nuevoEstado);
        }

        return actualizado;
      });
    },
    [storageKey, onCambio, materiaId, anioId, seccionId, estudianteMap]
  );

  const contadores = {
    presentes: Object.values(asistencia).filter((e) => e === "presente").length,
    ausentes: Object.values(asistencia).filter((e) => e === "ausente").length,
    tardes: Object.values(asistencia).filter((e) => e === "tarde").length,
    justificados: Object.values(asistencia).filter((e) => e === "justificado").length,
    sinMarcar: Object.values(asistencia).filter((e) => e === "sin_marcar").length,
  };

  return { asistencia, marcarAsistencia, contadores };
}
