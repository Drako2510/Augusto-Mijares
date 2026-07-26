"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FiCheckCircle, FiXCircle, FiClock } from "react-icons/fi";

interface AsistenciaItem {
  materia: string;
  icono: string;
  estado: string;
}

interface Props {
  fecha: string;
  asistencias: AsistenciaItem[];
}

export function AsistenciaHoy({ fecha, asistencias }: Props) {
  const fechaDate = new Date(fecha);
  const diaSemana = fechaDate.getDay();
  const esFinDeSemana = diaSemana === 0 || diaSemana === 6;

  if (esFinDeSemana) {
    return (
      <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-6 text-center">
        <div className="text-3xl mb-2">🏖️</div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 dark:text-gray-600">
          {format(fechaDate, "EEEE d 'de' MMMM", { locale: es })}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">Sin clases hoy</p>
      </div>
    );
  }

  const presentes = asistencias.filter((a) => a.estado === "presente").length;
  const ausentes = asistencias.filter((a) => a.estado === "ausente").length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 dark:text-gray-500 flex items-center gap-2">
            <FiClock className="h-4 w-4" />
            Asistencia de Hoy
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {format(fechaDate, "EEEE d 'de' MMMM", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {presentes > 0 && (
            <span className="rounded-full bg-green-100 dark:bg-green-900/40 px-2 py-0.5 text-xs font-semibold text-green-700 dark:text-green-300">
              ✅ {presentes} presente{presentes > 1 ? "s" : ""}
            </span>
          )}
          {ausentes > 0 && (
            <span className="rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-xs font-semibold text-red-700 dark:text-red-300">
              ❌ {ausentes} ausente{ausentes > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {asistencias.length > 0 ? (
        <div className="space-y-2">
          {asistencias.map((a, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-3 hover:bg-gray-100 dark:bg-gray-800 transition"
            >
              <span className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-200">
                <span className="text-lg">{a.icono}</span>
                {a.materia}
              </span>
              <span
                className={`flex items-center gap-1.5 text-sm font-semibold ${
                  a.estado === "presente"
                    ? "text-green-600"
                    : a.estado === "ausente"
                      ? "text-red-600"
                      : "text-gray-500 dark:text-gray-400 dark:text-gray-500"
                }`}
              >
                {a.estado === "presente" ? (
                  <><FiCheckCircle className="h-4 w-4" /> Presente</>
                ) : a.estado === "ausente" ? (
                  <><FiXCircle className="h-4 w-4" /> Ausente</>
                ) : (
                  <><FiClock className="h-4 w-4" /> {a.estado}</>
                )}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500 italic">
          No hay registros de asistencia hoy
        </p>
      )}

      {/* Indicador de actualización automática */}
      <div className="mt-4 flex items-center justify-end gap-1.5 border-t border-gray-100 dark:border-gray-800 pt-3 text-xs text-gray-400 dark:text-gray-500">
        <span>🕐</span>
        <span>Actualización automática a medianoche</span>
      </div>
    </div>
  );
}
