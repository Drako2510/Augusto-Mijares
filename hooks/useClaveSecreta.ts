"use client";

import { useState, useEffect, useCallback } from "react";

interface UseClaveSecretaParams {
  materiaId: string;
  anio: string;
  seccion: string;
}

interface UseClaveSecretaResult {
  modoEdicion: boolean;
  token: string | null;
  validarClave: (clave: string) => Promise<boolean>;
  cerrarEdicion: () => void;
}

/**
 * Hook que gestiona el modo edición del directivo mediante clave secreta.
 * - Verifica sessionStorage al montar (token + expiración 30 min).
 * - Expone `validarClave()` que consulta /api/directivo/validar-clave.
 * - Expone `cerrarEdicion()` para salir manualmente del modo edición.
 */
export function useClaveSecreta({
  materiaId,
  anio,
  seccion,
}: UseClaveSecretaParams): UseClaveSecretaResult {
  const storageKey = `clave_${materiaId}_${anio}_${seccion}`;
  const expiraKey = `clave_expira_${materiaId}_${anio}_${seccion}`;

  const [modoEdicion, setModoEdicion] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Verificar al montar
  useEffect(() => {
    const stored = sessionStorage.getItem(storageKey);
    if (!stored) return;

    const expira = sessionStorage.getItem(expiraKey);
    if (expira && Date.now() > Number(expira)) {
      // Expirado
      sessionStorage.removeItem(storageKey);
      sessionStorage.removeItem(expiraKey);
      return;
    }

    setToken(stored);
    setModoEdicion(true);
  }, [storageKey, expiraKey]);

  const validarClave = useCallback(
    async (clave: string): Promise<boolean> => {
      try {
        const res = await fetch("/api/directivo/validar-clave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ materiaId, anio, seccion, clave }),
        });

        const data = await res.json();

        if (!data.success) return false;

        // Guardar token en sessionStorage con expiración
        const nuevoToken = data.token ?? "true";
        sessionStorage.setItem(storageKey, nuevoToken);
        const minutos = Number(process.env.NEXT_PUBLIC_CLAVE_EXPIRACION_MINUTOS) || 30;
        const expira = Date.now() + minutos * 60 * 1000;
        sessionStorage.setItem(expiraKey, String(expira));

        setToken(nuevoToken);
        setModoEdicion(true);
        return true;
      } catch {
        return false;
      }
    },
    [materiaId, anio, seccion, storageKey, expiraKey]
  );

  const cerrarEdicion = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    sessionStorage.removeItem(expiraKey);
    setToken(null);
    setModoEdicion(false);
  }, [storageKey, expiraKey]);

  return { modoEdicion, token, validarClave, cerrarEdicion };
}
