"use client";

import { useState, useEffect, useCallback } from "react";
import {
  leerDatosLocalStorage,
  migrarABd,
  marcarComoMigrado,
  yaMigrado,
  hayDatosParaMigrar,
} from "@/scripts/migrar-datos";

/**
 * Banner que aparece si hay datos en localStorage sin migrar.
 * Muestra un botón para migrarlos a la BD.
 */
export function MigracionBanner() {
  const [visible, setVisible] = useState(false);
  const [migrando, setMigrando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Solo mostrar si no se ha migrado y hay datos
    if (!yaMigrado() && hayDatosParaMigrar()) {
      setVisible(true);
    }
  }, []);

  const migrar = useCallback(async () => {
    setMigrando(true);
    setError(null);
    setResultado(null);

    try {
      const datos = leerDatosLocalStorage();
      const res = await migrarABd(datos);

      if (res.success) {
        marcarComoMigrado();
        setResultado(res.message ?? `✅ ${res.total} registros migrados.`);
        setTimeout(() => setVisible(false), 3000);
      } else {
        setError(res.message ?? "Error al migrar");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setMigrando(false);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slideUp border-t border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-4 shadow-lg dark:shadow-gray-900/50">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💾</span>
          <div>
            <p className="text-sm font-bold text-amber-800">
              Datos sin migrar detectados
            </p>
            <p className="text-xs text-amber-600">
              Tienes datos en el almacenamiento local. Migralos a la base de datos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {resultado ? (
            <span className="text-sm font-semibold text-green-600">
              {resultado}
            </span>
          ) : error ? (
            <span className="text-sm font-semibold text-red-600">{error}</span>
          ) : null}

          <button
            onClick={migrar}
            disabled={migrando || !!resultado}
            className={`btn-primary text-sm ${migrando ? "loading" : ""}`}
          >
            <div className="spinner" />
            <span className="btn-text">
              {migrando ? "Migrando..." : "🔄 Migrar Datos"}
            </span>
          </button>

          <button
            onClick={() => setVisible(false)}
            className="rounded-full p-2 text-amber-400 hover:text-amber-600 hover:bg-amber-100 transition-colors"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
