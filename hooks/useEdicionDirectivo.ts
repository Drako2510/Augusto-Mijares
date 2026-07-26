"use client";

import { useState, useEffect, useCallback } from "react";
import { useEdicionStore } from "@/store/useEdicionStore";

interface UseEdicionDirectivoProps {
  materiaId: string;
  anio: string;
  seccion: string;
}

export function useEdicionDirectivo({ materiaId, anio, seccion }: UseEdicionDirectivoProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    modoEdicion,
    claveValidada,
    tieneCambiosSinGuardar,
    cambiosPendientes,
    activarEdicion,
    desactivarEdicion,
    limpiarCambios,
    marcarGuardado,
    agregarCambio,
  } = useEdicionStore();

  // Forzar re-render cuando cambia el estado de edición
  const [renderKey, setRenderKey] = useState(0);
  useEffect(() => {
    setRenderKey((prev) => prev + 1);
  }, [modoEdicion, claveValidada]);

  // Validar clave secreta
  const validarClave = useCallback(
    async (clave: string) => {
      setIsValidating(true);
      setError(null);

      try {
        const res = await fetch("/api/directivo/validar-clave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ materiaId, anio, seccion, clave }),
        });

        const data = await res.json();

        if (data.success) {
          activarEdicion(materiaId, anio, seccion);
          setRenderKey((prev) => prev + 1);

          // Guardar en sessionStorage
          sessionStorage.setItem(`clave_${materiaId}_${anio}_${seccion}`, data.token ?? "true");
          const expira = Date.now() + 30 * 60 * 1000;
          sessionStorage.setItem(`clave_expira_${materiaId}_${anio}_${seccion}`, String(expira));

          return true;
        } else {
          setError(data.error || "Clave incorrecta");
          return false;
        }
      } catch {
        setError("Error al validar clave");
        return false;
      } finally {
        setIsValidating(false);
      }
    },
    [materiaId, anio, seccion, activarEdicion]
  );

  // Salir del modo edición
  const salirEdicion = useCallback(() => {
    if (tieneCambiosSinGuardar()) return "tieneCambios";
    desactivarEdicion();
    setRenderKey((prev) => prev + 1);
    return "ok";
  }, [tieneCambiosSinGuardar, desactivarEdicion]);

  // Guardar cambios en lote
  const guardarCambios = useCallback(async () => {
    setIsValidating(true);
    try {
      const asistencias = cambiosPendientes.filter((c) => c.tipo === "ASISTENCIA");
      if (asistencias.length > 0) {
        await fetch("/api/asistencia/batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ asistencias: asistencias.map((a) => a.datos), materiaId, anio, seccion }),
        });
      }

      const evaluaciones = cambiosPendientes.filter((c) => c.tipo === "EVALUACION");
      for (const ev of evaluaciones) {
        await fetch("/api/evaluaciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ev.datos),
        });
      }

      const tareas = cambiosPendientes.filter((c) => c.tipo === "TAREA");
      for (const t of tareas) {
        await fetch("/api/tareas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(t.datos),
        });
      }

      marcarGuardado();
      setRenderKey((prev) => prev + 1);
      window.dispatchEvent(new CustomEvent("dashboard:refresh"));
      return true;
    } catch {
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [cambiosPendientes, materiaId, anio, seccion, marcarGuardado]);

  const descartarCambios = useCallback(() => {
    limpiarCambios();
    setRenderKey((prev) => prev + 1);
  }, [limpiarCambios]);

  return {
    modoEdicion,
    claveValidada,
    tieneCambiosSinGuardar,
    cambiosPendientes,
    renderKey,
    isValidating,
    error,
    validarClave,
    salirEdicion,
    guardarCambios,
    descartarCambios,
    agregarCambio,
    setRenderKey,
  };
}
