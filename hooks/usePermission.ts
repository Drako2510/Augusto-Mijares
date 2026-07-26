"use client";

import { useState, useEffect, useCallback } from "react";
import type { Rol, VerificacionPermiso } from "@/lib/permissions";

interface UsePermissionParams {
  rol?: Rol;
  materiaId: string;
  anio: string;
  seccion: string;
  usuarioId?: string;
}

interface UsePermissionResult {
  hasViewPermission: boolean;
  hasEditPermission: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook que consulta /api/permiso para verificar si el usuario actual
 * tiene permisos de vista y edición sobre una sección específica.
 */
export function usePermission({
  rol,
  materiaId,
  anio,
  seccion,
  usuarioId,
}: UsePermissionParams): UsePermissionResult {
  const [state, setState] = useState<UsePermissionResult>({
    hasViewPermission: false,
    hasEditPermission: false,
    isLoading: true,
    error: null,
  });

  const verificar = useCallback(async () => {
    if (!rol || !usuarioId) {
      setState({
        hasViewPermission: false,
        hasEditPermission: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    // Directivo siempre puede ver
    if (rol === "directivo") {
      setState({
        hasViewPermission: true,
        hasEditPermission: false, // requiere clave
        isLoading: false,
        error: null,
      });
      return;
    }

    // Representante: verificación fina por estudiante
    if (rol === "representante") {
      setState({
        hasViewPermission: true,
        hasEditPermission: false,
        isLoading: false,
        error: null,
      });
      return;
    }

    try {
      const res = await fetch(
        `/api/permiso?materiaId=${materiaId}&anio=${anio}&seccion=${seccion}&usuarioId=${usuarioId}`
      );
      const data: VerificacionPermiso & { canEdit?: boolean } = await res.json();

      setState({
        hasViewPermission: data.permitido,
        hasEditPermission: data.permitido, // profesor puede editar su materia
        isLoading: false,
        error: data.motivo ?? null,
      });
    } catch {
      setState({
        hasViewPermission: false,
        hasEditPermission: false,
        isLoading: false,
        error: "Error al verificar permisos",
      });
    }
  }, [rol, materiaId, anio, seccion, usuarioId]);

  useEffect(() => {
    verificar();
  }, [verificar]);

  return state;
}
