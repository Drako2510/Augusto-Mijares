"use client";

import { useState, useEffect, useCallback } from "react";
import { generarId } from "@/utils/formatters";

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  fechaEntrega: string; // ISO
  materiaId: string;
  createdAt: string;
}

/**
 * Hook para gestionar tareas via API (BD) con fallback a localStorage.
 */
export function useTareas(materiaId: string, anio: string, seccion: string) {
  const storageKey = `tareas_${materiaId}_${anio}_${seccion}`;
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar desde API, con fallback a localStorage
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(
          `/api/tareas?materiaId=${materiaId}&anio=${anio}&seccion=${seccion}`
        );
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            setTareas(data.tareas ?? []);
            setLoading(false);
          }
          return;
        }
      } catch {
        // Fallback a localStorage
      }

      // Fallback
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(storageKey);
          if (!cancelled) {
            setTareas(raw ? JSON.parse(raw) : []);
            setLoading(false);
          }
        } catch {
          if (!cancelled) setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [materiaId, anio, seccion, storageKey]);

  const crearTarea = useCallback(
    async (titulo: string, descripcion: string, fechaEntrega: string) => {
      const nueva: Tarea = {
        id: generarId(),
        titulo,
        descripcion,
        fechaEntrega,
        materiaId,
        createdAt: new Date().toISOString(),
      };

      // Intentar guardar en API primero
      try {
        const res = await fetch("/api/tareas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ materiaId, titulo, descripcion, fechaEntrega, anio, seccion }),
        });
        if (res.ok) {
          const data = await res.json();
          setTareas((prev) => [data.tarea, ...prev]);
          return data.tarea;
        }
      } catch {
        // Fallback a localStorage
      }

      // Fallback localStorage
      setTareas((prev) => {
        const updated = [nueva, ...prev];
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        }
        return updated;
      });
      return nueva;
    },
    [materiaId, anio, seccion, storageKey]
  );

  const eliminarTarea = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/tareas/${id}`, { method: "DELETE" });
      } catch {
        // Fallback
      }

      setTareas((prev) => {
        const updated = prev.filter((t) => t.id !== id);
        if (typeof window !== "undefined") {
          localStorage.setItem(storageKey, JSON.stringify(updated));
        }
        return updated;
      });
    },
    [storageKey]
  );

  return { tareas, loading, crearTarea, eliminarTarea };
}
