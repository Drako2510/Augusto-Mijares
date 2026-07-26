"use client";

import { useState, useRef } from "react";
import { toast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

interface Props {
  materiaId: string;
  anio: string;
  seccion: string;
  materiaNombre: string;
}

/**
 * Botón que el profesor usa para generar una clave temporal de 5 minutos
 * y 1 solo uso. La clave se la da al directivo para desbloquear edición.
 */
export function GenerarClaveButton({ materiaId, anio, seccion, materiaNombre }: Props) {
  const [loading, setLoading] = useState(false);
  const [claveGenerada, setClaveGenerada] = useState<string | null>(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  const generar = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profesor/generar-clave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ materiaId, anio, seccion }),
      });

      const data = await res.json();
      if (!data.success) {
        toast(data.error ?? "Error al generar clave", "error");
        return;
      }

      setClaveGenerada(data.clave);
      setMostrarModal(true);
      toast("Clave temporal generada. Válida por 5 minutos.", "success");
    } catch {
      toast("Error de conexión", "error");
    } finally {
      setLoading(false);
    }
  };

  const copiarAlPortapapeles = () => {
    if (claveGenerada) {
      navigator.clipboard.writeText(claveGenerada).then(() => {
        toast("Clave copiada al portapapeles 📋", "success");
      }).catch(() => {});
    }
  };

  return (
    <>
      <button
        onClick={generar}
        disabled={loading}
        className={`inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-300 transition-all hover:bg-blue-100 dark:bg-blue-900/40 hover:shadow-sm dark:shadow-gray-900/30 ${loading ? "opacity-50" : ""}`}
        title="Generar clave temporal para el directivo"
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 dark:border-blue-800 border-t-blue-600" />
        ) : (
          <span>🔑</span>
        )}
        Generar Clave para Directivo
      </button>

      <Modal open={mostrarModal} onClose={() => setMostrarModal(false)} title="🔑 Clave Temporal Generada">
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
            Comparte esta clave con el directivo para <strong>{materiaNombre}</strong> · {anio} &quot;{seccion}&quot;
          </p>

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-5">
            <p className="text-xs font-semibold uppercase text-amber-600 tracking-wide mb-2">
              🔑 Clave Temporal
            </p>
            <p className="text-3xl font-mono font-extrabold text-amber-800 tracking-widest select-all">
              {claveGenerada}
            </p>
            <p className="mt-2 text-xs text-amber-500">
              ⏰ Válida por <strong>5 minutos</strong> · 🔂 <strong>1 solo uso</strong>
            </p>
          </div>

          <div className="flex gap-2 justify-center">
            <button onClick={copiarAlPortapapeles} className="btn-secondary text-sm">
              📋 Copiar
            </button>
            <button onClick={() => setMostrarModal(false)} className="btn-primary text-sm">
              ✅ Listo
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
