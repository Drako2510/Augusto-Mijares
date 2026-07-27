"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FiCalendar, FiBookOpen, FiClock } from "react-icons/fi";
import { AsistenciaHoy } from "@/components/representante/AsistenciaHoy";
import { HistorialAsistenciaModal } from "@/components/representante/HistorialAsistenciaModal";

interface AsistenciaItem {
  materia: string;
  icono: string;
  estado: string;
  fecha: string;
}

interface EvaluacionItem {
  id: string;
  titulo: string;
  fecha: string;
  materia: string;
  icono: string;
  calificacion: number;
}

interface TareaItem {
  id: string;
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  materia: string;
  icono: string;
}

interface EstudianteInfo {
  id: string;
  nombre: string;
  anio: string;
  seccion: string;
}

interface Props {
  estudiante: EstudianteInfo;
  asistencia: AsistenciaItem[];
  evaluaciones: EvaluacionItem[];
  tareas: TareaItem[];
  loading?: boolean;
}

export function EstudianteCard({
  estudiante,
  asistencia,
  evaluaciones,
  tareas,
  loading,
}: Props) {
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [mostrarNotas, setMostrarNotas] = useState(false);

  // Listen for sidebar events
  useEffect(() => {
    const onNotas = () => setMostrarNotas(true);
    const onHistorial = () => setMostrarHistorial(true);
    window.addEventListener("rep:verNotas", onNotas);
    window.addEventListener("rep:historialAsistencia", onHistorial);
    return () => {
      window.removeEventListener("rep:verNotas", onNotas);
      window.removeEventListener("rep:historialAsistencia", onHistorial);
    };
  }, []);

  const formatearFecha = (fechaStr: string) => {
    try {
      return format(new Date(fechaStr), "d 'de' MMMM", { locale: es });
    } catch {
      return fechaStr;
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-900/30 border border-gray-200 dark:border-gray-700">
      {/* Header */}

      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 sm:px-6 py-3 text-white">

        <p className="text-center text-sm font-semibold text-blue-100 uppercase tracking-[0.2em]">Información Académica</p>

      </div>
      {loading && (
        <div className="h-1 w-full overflow-hidden bg-blue-400">
          <div className="h-full animate-pulse rounded-full bg-white dark:bg-gray-900/60" />
        </div>
      )}

      {/* Cuerpo */}
      <div className="p-6 space-y-6">
        {/* Asistencia de Hoy */}
        <AsistenciaHoy
          fecha={new Date().toISOString()}
          asistencias={asistencia}
        />

        {/* Próximas Evaluaciones */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 dark:text-gray-500">
            <FiCalendar className="h-4 w-4" />
            Próximas Evaluaciones
          </h3>
          {evaluaciones.length > 0 ? (
            <div className="space-y-2">
              {evaluaciones.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{ev.titulo}</span>
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      {ev.icono} {ev.materia} · {formatearFecha(ev.fecha)}
                    </p>
                  </div>
                  <span
                    className={`ml-3 rounded-full px-2.5 py-1 text-xs font-bold flex-shrink-0 ${
                      ev.calificacion >= 7
                        ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                        : ev.calificacion >= 5
                          ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                          : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                    }`}
                  >
                    {ev.calificacion}/10
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500 italic">
              Sin evaluaciones registradas
            </p>
          )}
        </div>

        {/* Tareas Pendientes */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 dark:text-gray-500">
            <FiBookOpen className="h-4 w-4" />
            Tareas Pendientes
          </h3>
          {tareas.length > 0 ? (
            <div className="space-y-2">
              {tareas.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800 px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{t.titulo}</span>
                    {t.descripcion && (
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 line-clamp-1">
                        {t.descripcion}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      {t.icono} {t.materia}
                    </p>
                  </div>
                  <span className="ml-3 flex items-center gap-1 text-sm font-semibold text-amber-600 dark:text-amber-400 flex-shrink-0">
                    <FiClock className="h-4 w-4" />
                    {formatearFecha(t.fechaEntrega)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500 italic">
              Sin tareas pendientes
            </p>
          )}
        </div>
      </div>
      {/* Modal de Notas */}
      {mostrarNotas && (
        <NotasModal
          estudianteId={estudiante.id}
          estudianteNombre={estudiante.nombre}
          onClose={() => setMostrarNotas(false)}
        />
      )}

      {/* Modal de Historial */}
      {mostrarHistorial && (
        <HistorialAsistenciaModal
          estudianteId={estudiante.id}
          estudianteNombre={estudiante.nombre}
          onClose={() => setMostrarHistorial(false)}
        />
      )}
    </div>
  );
}

function NotasModal({
  estudianteId,
  estudianteNombre,
  onClose,
}: {
  estudianteId: string;
  estudianteNombre: string;
  onClose: () => void;
}) {
  const [notaDetalle, setNotaDetalle] = useState<{ valor: number; evaluacion: string; materia: string } | null>(null);
  const [data, setData] = useState<{
    materias: { materia: string; icono: string; notas: number[]; cantidad: number; promedio: number }[];
    promedioGeneral: number;
    total: number;
    maxEvaluaciones: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reportes/notas?estudianteId=${estudianteId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [estudianteId]);

  const nivel = (n: number) => n >= 14 ? "verde" : n >= 10 ? "ambar" : "rojo";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-xl">📝</div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Notas de {estudianteNombre}</h3>
              {data && <p className="text-sm text-gray-500 dark:text-gray-400">Promedio general: <strong>{data.promedioGeneral}/20</strong> · {data.total} evaluaciones</p>}
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition">✕</button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12"><div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" /></div>
          ) : !data || data.materias.length === 0 ? (
            <p className="text-center text-gray-400 dark:text-gray-500 py-8">Sin materias registradas</p>
          ) : (
            <div className="space-y-3">
              {/* KPIs */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{data.promedioGeneral}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Promedio</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{data.total}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Notas</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {data.materias.filter((m: any) => m.promedio >= 10).length}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Aprobadas</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-red-600 dark:text-red-400">
                    {data.materias.filter((m: any) => m.promedio < 10 && m.cantidad > 0).length}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Reprobadas</p>
                </div>
              </div>

              {data.materias.map((m) => {
                const slots = Math.max(data.maxEvaluaciones, m.notas.length);
                return (
                  <div key={m.materia} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-800 dark:text-gray-100">{m.icono} {m.materia}</h4>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        m.promedio >= 14 ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" :
                        m.promedio >= 10 ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" :
                        m.cantidad > 0 ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" :
                        "bg-gray-100 dark:bg-gray-700 text-gray-500"
                      }`}>
                        {m.cantidad > 0 ? `Promedio: ${m.promedio}/20` : "Sin notas"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {m.notas.map((n: any, i: number) => {
                        const valor = typeof n === "number" ? n : n?.valor;
                        const titulo = typeof n === "object" ? n?.evaluacion : "";
                        return (
                          <span key={i}
                            onClick={() => valor != null && setNotaDetalle({ valor, evaluacion: titulo || `Nota ${i + 1}`, materia: m.materia })}
                            title={titulo || `Nota ${i + 1}`}
                            className={`inline-flex items-center justify-center min-w-[36px] h-9 px-2 rounded-full text-xs font-bold cursor-pointer transition-transform hover:scale-110 ${
                              valor != null
                                ? valor >= 14 ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" :
                                  valor >= 10 ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" :
                                  "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600 border border-dashed border-gray-300 dark:border-gray-600"
                            }`}>
                            {valor != null ? valor : ""}
                          </span>
                        );
                      })}
                      {/* Slots vacíos para completar 5 */}
                      {Array.from({ length: Math.max(0, (data.maxEvaluaciones || 5) - m.notas.length) }, (_, i) => (
                        <span key={`empty-${i}`} className="inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600 border border-dashed border-gray-300 dark:border-gray-600" />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Popup de detalle de nota */}
        {notaDetalle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => setNotaDetalle(null)}>
            <div className="w-64 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg p-4 text-center animate-scaleIn" onClick={(e) => e.stopPropagation()}>
              <p className="text-xs text-gray-400">{notaDetalle.materia}</p>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-100 mt-0.5">{notaDetalle.evaluacion}</p>
              <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">{notaDetalle.valor}/20</p>
              <button onClick={() => setNotaDetalle(null)} className="mt-2 text-xs text-gray-400 hover:text-gray-600">Cerrar</button>
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800/50">
          <button onClick={onClose} className="btn-secondary w-full">Cerrar</button>
        </div>
      </div>
    </div>
  );
}
