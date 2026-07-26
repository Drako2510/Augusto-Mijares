"use client";

import { useState } from "react";
import type { EstadoAsistencia, RegistroAsistencia } from "@/hooks/useAsistencia";

interface Props {
  estudiantes: string[];
  asistencia: RegistroAsistencia;
  onMarcar: (estudiante: string, estado: EstadoAsistencia) => void;
  onJustificarDias?: (estudiante: string, dias: number) => void;
}

const ESTADO_LABEL: Record<string, string> = {
  presente: "✅ Presente",
  ausente: "❌ Ausente",
  tarde: "⏰ Tarde",
  justificado: "📝 Justificado",
  sin_marcar: "⬜ Sin marcar",
};

const ESTADO_BADGE: Record<string, string> = {
  presente: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300",
  ausente: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  tarde: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  justificado: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300",
  sin_marcar: "bg-gray-100 dark:bg-gray-800 text-gray-500",
};

function EstadoBadge({ estado }: { estado: EstadoAsistencia }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_BADGE[estado]}`}>
      {ESTADO_LABEL[estado]}
    </span>
  );
}

export default function AsistenciaTable({
  estudiantes,
  asistencia,
  onMarcar,
  onJustificarDias,
}: Props) {
  const [justificarEst, setJustificarEst] = useState<string | null>(null);
  const [justificarDias, setJustificarDias] = useState(1);

  const handleJustificar = () => {
    if (justificarEst && justificarDias > 0) {
      if (onJustificarDias) {
        onJustificarDias(justificarEst, justificarDias);
      } else {
        onMarcar(justificarEst, "justificado");
      }
      setJustificarEst(null);
      setJustificarDias(1);
    }
  };

  return (
    <>
      {/* Modal justificado */}
      {justificarEst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-slideUp">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                📝 Justificar Ausencia
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Estudiante: <strong>{justificarEst}</strong>
              </p>
              <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                📅 Cantidad de días justificados
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={justificarDias}
                onChange={(e) => setJustificarDias(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3 border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800">
              <button onClick={() => setJustificarEst(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={handleJustificar} className="btn-primary flex-1">✅ Justificar {justificarDias} día{justificarDias > 1 ? "s" : ""}</button>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-900/30">
        <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-3 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Estudiante</th>
              <th className="px-2 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">✅</th>
              <th className="px-2 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">❌</th>
              <th className="px-2 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">⏰</th>
              <th className="px-2 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">📝</th>
              <th className="px-3 py-3 text-center font-semibold text-gray-600 dark:text-gray-300">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {estudiantes.map((nombre) => {
              const estado = asistencia[nombre] ?? "sin_marcar";
              return (
                <tr key={nombre} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-3 py-2.5 font-medium text-gray-700 dark:text-gray-200 text-xs">{nombre}</td>
                  <td className="px-1 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => onMarcar(nombre, "presente")}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        estado === "presente"
                          ? "bg-green-500 text-white shadow"
                          : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40"
                      }`}
                    >P</button>
                  </td>
                  <td className="px-1 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => onMarcar(nombre, "ausente")}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        estado === "ausente"
                          ? "bg-red-500 text-white shadow"
                          : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
                      }`}
                    >A</button>
                  </td>
                  <td className="px-1 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => onMarcar(nombre, "tarde")}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        estado === "tarde"
                          ? "bg-amber-500 text-white shadow"
                          : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                      }`}
                    >T</button>
                  </td>
                  <td className="px-1 py-2.5 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (estado === "justificado") {
                          onMarcar(nombre, "sin_marcar");
                        } else {
                          setJustificarEst(nombre);
                        }
                      }}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        estado === "justificado"
                          ? "bg-blue-500 text-white shadow"
                          : "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                      }`}
                    >J</button>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <EstadoBadge estado={estado} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
