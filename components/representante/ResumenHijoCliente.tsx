"use client";

import Link from "next/link";
import { useEstudianteDashboard } from "@/hooks/useEstudianteDashboard";

interface HijoInfo {
  id: string;
  nombre: string;
  anio: string;
  seccion: string;
}

interface Props {
  hijos: HijoInfo[];
}

/**
 * Componente que muestra los datos de cada hijo con actualización en tiempo real.
 * Usa useEstudianteData con polling automático (asistencia 30s, eval/tareas 60s).
 * Escucha el evento "dashboard:refresh" para refrescar instantáneamente.
 */
export function ResumenHijoCliente({ hijos }: Props) {
  if (hijos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-12 text-center">
        <span className="text-4xl">📭</span>
        <p className="mt-3 text-gray-500 dark:text-gray-400 dark:text-gray-500">No tienes hijos registrados en el sistema.</p>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Contacta al directivo para que asocie a tu(s) hijo(s) con tu cuenta.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {hijos.map((hijo) => (
        <HijoCard key={hijo.id} hijo={hijo} />
      ))}
    </div>
  );
}

function HijoCard({ hijo }: { hijo: HijoInfo }) {
  const { data, loading } = useEstudianteDashboard(hijo.id);
  const { asistencia, evaluaciones, tareas } = data;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm dark:shadow-gray-900/30">
      {/* Cabecera */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white text-xl font-bold shadow-md dark:shadow-gray-900/40">
            {hijo.nombre.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{hijo.nombre}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
              {hijo.anio} · Sección {hijo.seccion}
            </p>
          </div>
        </div>
        <span className={`h-2 w-2 rounded-full ${loading ? "bg-blue-500 animate-pulse" : "bg-green-400"}`} title={loading ? "Cargando..." : "Actualizado"} />
      </div>

      {/* Grid: Asistencia | Evaluaciones | Tareas */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Asistencia de Hoy */}
        <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
            <span>📊</span> Asistencia de Hoy
          </h3>
          {asistencia.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">Sin registros hoy</p>
          ) : (
            <ul className="space-y-2">
              {asistencia.map((a, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm dark:shadow-gray-900/30">
                  <span className="flex items-center gap-1">
                    <span>{a.icono}</span>
                    <span className="text-gray-600 dark:text-gray-300">{a.materia}</span>
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    a.estado === "presente" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" :
                    a.estado === "ausente" ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" :
                    "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  }`}>
                    {a.estado === "presente" ? "✅ Presente" : a.estado === "ausente" ? "❌ Ausente" : a.estado}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Próximas Evaluaciones */}
        <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
            <span>📅</span> Próximas Evaluaciones
          </h3>
          {evaluaciones.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">Sin evaluaciones</p>
          ) : (
            <ul className="space-y-2">
              {evaluaciones.map((ev) => (
                <li key={ev.id} className="rounded-lg bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm dark:shadow-gray-900/30">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-200">{ev.titulo}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      ev.calificacion >= 7 ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" :
                      ev.calificacion >= 5 ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                    }`}>{ev.calificacion}/10</span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                    {ev.icono} {ev.materia} · {new Date(ev.fecha).toLocaleDateString("es")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Tareas Pendientes */}
        <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-200">
            <span>📨</span> Tareas Pendientes
          </h3>
          {tareas.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic">Sin tareas pendientes</p>
          ) : (
            <ul className="space-y-2">
              {tareas.map((t) => (
                <li key={t.id} className="rounded-lg bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm dark:shadow-gray-900/30">
                  <p className="font-medium text-gray-700 dark:text-gray-200">{t.titulo}</p>
                  {t.descripcion && <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-0.5">{t.descripcion}</p>}
                  <p className="mt-0.5 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
                    <span>{t.icono} {t.materia}</span>
                    <span className="text-amber-600 font-medium">
                      📆 {new Date(t.fechaEntrega).toLocaleDateString("es")}
                    </span>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Acceso al dashboard completo */}
      <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
        <Link
          href={`/materia/matematicas/${hijo.anio}/${hijo.seccion}/dashboard`}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          🔗 Ver dashboard completo de {hijo.nombre.split(" ")[0]} →
        </Link>
      </div>
    </div>
  );
}
