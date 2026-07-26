"use client";

import { useCallback, useEffect, useState } from "react";
import { buildStorageKey, readFromStorage, writeToStorage } from "@/utils/localStorage";
import { generarId } from "@/utils/formatters";

export interface Evaluacion {
  id: string;
  fechaISO: string;
  titulo: string;
  descripcion?: string;
  metodo?: string;
  calificacion?: number;
}

/**
 * Maneja el calendario de evaluaciones de una sección.
 * - localStorage como fallback.
 * - Llama a la API para guardar en BD + notificar representantes.
 */
export function useEvaluaciones(
  materiaId: string,
  anioId: string,
  seccionId: string,
  materiaNombre?: string
) {
  const storageKey = buildStorageKey("evaluaciones", materiaId, anioId, seccionId);
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);

  const syncFromAPI = useCallback(() => {
    fetch(`/api/evaluaciones?materiaId=${materiaId}&anio=${anioId}&seccion=${seccionId}`)
      .then((r) => r.json())
      .then((data) => {
        const delApi: Evaluacion[] = (data.evaluaciones || []).map((ev: any) => ({
          id: ev.id,
          fechaISO: ev.fecha?.slice(0, 10) || "",
          titulo: ev.titulo,
          descripcion: ev.descripcion || undefined,
          metodo: ev.tipo || "examen",
          calificacion: ev.calificacion,
        }));
        setEvaluaciones(delApi);
        writeToStorage(storageKey, delApi);
      })
      .catch(() => {});
  }, [materiaId, anioId, seccionId, storageKey]);

  useEffect(() => {
    syncFromAPI();
    const handler = () => syncFromAPI();
    window.addEventListener("dashboard:refresh", handler);
    return () => window.removeEventListener("dashboard:refresh", handler);
  }, [syncFromAPI]);

  const agregarEvaluacion = useCallback(
    (fechaISO: string, titulo: string, descripcion?: string, metodo?: string) => {
      const nueva: Evaluacion = {
        id: generarId(),
        fechaISO,
        titulo,
        descripcion,
        metodo,
      };

      setEvaluaciones((prev) => {
        const actualizado = [...prev, nueva].sort((a, b) =>
          a.fechaISO.localeCompare(b.fechaISO)
        );
        writeToStorage(storageKey, actualizado);
        return actualizado;
      });

      // Disparar evento para actualizar cuadro de honor y dashboards
      window.dispatchEvent(new CustomEvent("dashboard:refresh"));

      // Guardar en API + notificar a todos los representantes de la sección
      fetch("/api/notificaciones/evento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "EVALUACION",
          materiaId,
          titulo: `📝 Nueva Evaluación: ${titulo}`,
          mensaje: `Se ha programado la evaluación "${titulo}" para el ${fechaISO} en ${materiaNombre || materiaId} - ${anioId} "${seccionId}".`,
          data: {
            anio: anioId,
            seccion: seccionId,
            evaluacionTitulo: titulo,
            fecha: fechaISO,
            descripcion: descripcion || "",
          },
        }),
      }).catch(() => {});

      // También guardar en la API de evaluaciones con anio/seccion
      fetch("/api/evaluaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materiaId,
          anio: anioId,
          seccion: seccionId,
          tipo: metodo || "examen",
          titulo,
          calificacion: 0,
          estudianteId: null,
          fecha: fechaISO, // fecha programada, no la de creación
        }),
      }).catch(() => {});
    },
    [storageKey, materiaId, anioId, seccionId, materiaNombre]
  );

  const editarEvaluacion = useCallback(
    (id: string, fechaISO: string, titulo: string, descripcion?: string, metodo?: string) => {
      setEvaluaciones((prev) => {
        const actualizado = prev.map((ev) =>
          ev.id === id ? { ...ev, fechaISO, titulo, descripcion, metodo } : ev
        );
        writeToStorage(storageKey, actualizado);
        return actualizado;
      });
      // Sincronizar con la BD
      fetch("/api/evaluaciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, titulo, descripcion, tipo: metodo || "examen", fecha: fechaISO }),
      }).catch(() => {});
      window.dispatchEvent(new CustomEvent("dashboard:refresh"));
    },
    [storageKey]
  );

  const eliminarEvaluacion = useCallback(
    (id: string) => {
      setEvaluaciones((prev) => {
        const actualizado = prev.filter((ev) => ev.id !== id);
        writeToStorage(storageKey, actualizado);
        return actualizado;
      });

      // Disparar evento para actualizar cuadro de honor
      window.dispatchEvent(new CustomEvent("dashboard:refresh"));

      // Intentar eliminar de la API
      fetch("/api/evaluaciones", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, materiaId, anio: anioId, seccion: seccionId }),
      }).catch(() => {});
    },
    [storageKey, materiaId, anioId, seccionId]
  );

  return { evaluaciones, agregarEvaluacion, eliminarEvaluacion, editarEvaluacion };
}
