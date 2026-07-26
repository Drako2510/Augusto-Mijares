"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface EstudianteItem {
  id: string;
  nombre: string;
  nota: number | null;
  observacion: string;
}

interface Props {
  evaluacionTitulo: string;
  materiaId: string;
  anio: string;
  seccion: string;
  onClose: () => void;
}

export function RegistroNotasModal({ evaluacionTitulo, materiaId, anio, seccion, onClose }: Props) {
  const [estudiantes, setEstudiantes] = useState<EstudianteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/directivo/estudiantes-por-seccion?anio=${encodeURIComponent(anio)}&seccion=${encodeURIComponent(seccion)}`)
      .then((r) => r.json())
      .then(async (d) => {
        const lista = (d.estudiantes || []).map((e: any) => ({ id: e.id, nombre: e.nombre, nota: null as number | null, observacion: "" }));
        // Cargar notas existentes
        try {
          const res = await fetch(`/api/calificaciones?estudianteId=&materiaId=${materiaId}`);
          if (res.ok) {
            const json = await res.json();
            const notas = json.calificaciones || [];
            for (const est of lista) {
              const existente = notas.find((n: any) => n.estudianteId === est.id);
              if (existente) { est.nota = existente.nota; est.observacion = existente.observacion || ""; }
            }
          }
        } catch {}
        setEstudiantes(lista);
        setLoading(false);
      });
  }, [materiaId, anio, seccion]);

  const actualizarNota = (idx: number, valor: string) => {
    const v = valor === "" ? null : Number(valor);
    if (v !== null && (v < 0 || v > 20)) return;
    setEstudiantes((prev) => prev.map((e, i) => i === idx ? { ...e, nota: v } : e));
  };

  const handleGuardar = async () => {
    const validas = estudiantes.filter((e) => e.nota !== null);
    if (validas.length === 0) { toast.error("Ingresa al menos una nota"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/calificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluacionId: "directa", materiaId, anio, seccion,
          notas: validas.map((e) => ({ estudianteId: e.id, nota: e.nota, observacion: e.observacion })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${data.guardadas} notas guardadas`);
        onClose();
      } else {
        toast.error(data.error || "Error al guardar");
      }
    } catch { toast.error("Error de conexión"); }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 p-5">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">📝 Registrar Notas</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{evaluacionTitulo} · {anio} &quot;{seccion}&quot;</p>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" /></div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {estudiantes.map((est, i) => (
                <div key={est.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                  <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{est.nombre}</span>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    step={0.5}
                    value={est.nota ?? ""}
                    onChange={(e) => actualizarNota(i, e.target.value)}
                    placeholder="0-20"
                    className="w-20 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-center text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-400">/20</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/50">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={handleGuardar} disabled={saving || loading} className="btn-primary flex-1">
            {saving ? "Guardando..." : "💾 Guardar Notas"}
          </button>
        </div>
      </div>
    </div>
  );
}
