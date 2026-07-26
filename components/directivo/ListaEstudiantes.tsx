"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { FiCheckCircle, FiXCircle, FiSearch } from "react-icons/fi";
import type { EstadoAsistencia } from "@/hooks/useAsistencia";

interface EstudianteItem {
  id: string;
  nombre: string;
  estadoHoy?: string;
}

interface Props {
  estudiantes: EstudianteItem[];
  asistenciasHoy: Record<string, string>;
  editable?: boolean;
  onMarcarAsistencia?: (estudianteId: string, estado: EstadoAsistencia) => void;
}

const ESTADO_BADGE: Record<string, string> = {
  presente: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  ausente: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  tarde: "bg-amber-100 text-amber-700",
  justificado: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
};

const ESTADO_LABEL: Record<string, string> = {
  presente: "✅ Presente",
  ausente: "❌ Ausente",
  tarde: "⏰ Tarde",
  justificado: "📝 Justificado",
};

export function ListaEstudiantes({
  estudiantes,
  asistenciasHoy,
  editable = false,
  onMarcarAsistencia,
}: Props) {
  const [busqueda, setBusqueda] = useState("");

  const filtrados = useMemo(() => {
    if (!busqueda.trim()) return estudiantes;
    const q = busqueda.toLowerCase();
    return estudiantes.filter((e) => e.nombre.toLowerCase().includes(q));
  }, [estudiantes, busqueda]);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-900/30 overflow-hidden">
      {/* Header con búsqueda */}
      <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">
          👨‍🎓 Estudiantes ({filtrados.length})
        </h2>

        {/* Filtro de búsqueda */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-1.5 pl-9 pr-3 text-xs text-gray-700 dark:text-gray-200 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Lista */}
      {filtrados.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
          {busqueda ? "Sin resultados para tu búsqueda." : "No hay estudiantes en esta sección."}
        </p>
      ) : (
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {filtrados.map((est, idx) => {
            const estadoHoy = asistenciasHoy[est.id] ?? "sin_marcar";
            return (
              <div
                key={est.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 w-6">{idx + 1}.</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{est.nombre}</span>
                  {estadoHoy !== "sin_marcar" && estadoHoy in ESTADO_BADGE && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADO_BADGE[estadoHoy]}`}>
                      {ESTADO_LABEL[estadoHoy]}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Botones de asistencia si está en modo edición */}
                  {editable && onMarcarAsistencia && (
                    <>
                      <button
                        type="button"
                        onClick={() => onMarcarAsistencia(est.id, "presente")}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all duration-200 ${
                          estadoHoy === "presente"
                            ? "border-brand-green bg-brand-green text-white shadow"
                            : "border-brand-green/30 text-brand-green hover:bg-brand-green/10"
                        }`}
                      >
                        <FiCheckCircle className="h-3.5 w-3.5" />
                        Presente
                      </button>
                      <button
                        type="button"
                        onClick={() => onMarcarAsistencia(est.id, "ausente")}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all duration-200 ${
                          estadoHoy === "ausente"
                            ? "border-brand-red bg-brand-red text-white shadow"
                            : "border-brand-red/30 text-brand-red hover:bg-brand-red/10"
                        }`}
                      >
                        <FiXCircle className="h-3.5 w-3.5" />
                        Ausente
                      </button>
                    </>
                  )}

                  {/* Botón Ver Historial */}
                  <Link
                    href={`/directivo/estudiante/${est.id}`}
                    className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 transition-all hover:bg-purple-100 hover:shadow-sm dark:shadow-gray-900/30"
                  >
                    📊 Ver Historial
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
