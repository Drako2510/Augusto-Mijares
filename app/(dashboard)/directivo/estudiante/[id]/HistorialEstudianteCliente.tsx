"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

// ─── Tipos ───────────────────────────────────────────────────
interface RepresentanteInfo {
  nombre: string;
  email: string;
}

interface EstudianteInfo {
  id: string;
  nombre: string;
  anio: string;
  seccion: string;
  representante: RepresentanteInfo | null;
}

interface AsistenciaItem {
  id: string;
  fecha: string;
  materiaNombre: string;
  materiaIcono: string;
  estado: string;
}

interface EvaluacionItem {
  id: string;
  fecha: string;
  titulo: string;
  calificacion: number;
  tipo: string;
  materiaNombre: string;
  materiaIcono: string;
}

interface PromedioMateria {
  materiaId: string;
  materiaNombre: string;
  icono: string;
  cantidad: number;
  notas: number[];
  promedio: number;
}

interface TareaItem {
  id: string;
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  materiaNombre: string;
  materiaIcono: string;
}

interface CalificacionItem {
  id: string;
  nota: number;
  observacion: string | null;
  tituloEvaluacion: string;
  fecha: string;
  materiaNombre: string;
  materiaIcono: string;
}

interface Props {
  estudiante: EstudianteInfo;
  asistencias: AsistenciaItem[];
  evaluaciones: EvaluacionItem[];
  promedioGeneral: number;
  promediosPorMateria: PromedioMateria[];
  calificaciones: CalificacionItem[];
  tareas: TareaItem[];
}

const OPCIONES_DIAS = [
  { value: 15, label: "15 días" },
  { value: 30, label: "30 días" },
  { value: 60, label: "60 días" },
  { value: 90, label: "90 días" },
  { value: 180, label: "180 días" },
  { value: 0, label: "Todas" },
];

const ESTADO_BADGE: Record<string, string> = {
  presente: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  ausente: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  tarde: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  justificado: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
};

const ESTADO_LABEL: Record<string, string> = {
  presente: "✅ Presente",
  ausente: "❌ Ausente",
  tarde: "⏰ Tarde",
  justificado: "📝 Justificado",
};

function formatearFecha(iso: string, largo?: boolean) {
  try {
    return new Date(iso).toLocaleDateString("es", {
      weekday: largo ? "short" : undefined,
      day: "numeric",
      month: largo ? "short" : "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ─── Componente ──────────────────────────────────────────────
export function HistorialEstudianteCliente({
  estudiante,
  asistencias,
  evaluaciones,
  promedioGeneral,
  promediosPorMateria,
  calificaciones,
  tareas,
}: Props) {
  const router = useRouter();
  const [diasFiltro, setDiasFiltro] = useState(30);

  // Dar de baja
  const [mostrarBaja, setMostrarBaja] = useState(false);
  const [passwordBaja, setPasswordBaja] = useState("");
  const [passwordBajaError, setPasswordBajaError] = useState("");
  const [bajaLoading, setBajaLoading] = useState(false);

  // Actualización en tiempo real
  useEffect(() => {
    // Polling cada 30s
    const interval = setInterval(() => router.refresh(), 30000);
    // Evento de refresco instantáneo
    const handler = () => router.refresh();
    window.addEventListener("dashboard:refresh", handler);
    return () => {
      clearInterval(interval);
      window.removeEventListener("dashboard:refresh", handler);
    };
  }, [router]);

  const handleDarDeBaja = async () => {
    setPasswordBajaError("");

    if (!passwordBaja.trim()) {
      setPasswordBajaError("Debes ingresar tu contraseña para confirmar");
      return;
    }

    setBajaLoading(true);
    try {
      const res = await fetch(`/api/directivo/estudiante/${estudiante.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activo: false,
          passwordConfirmacion: passwordBaja,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Estudiante dado de baja correctamente 🗑️");
        router.push("/directivo");
        router.refresh();
      } else {
        toast.error(data.error ?? "Error al dar de baja");
        setPasswordBajaError(data.error ?? "Contraseña incorrecta");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setBajaLoading(false);
    }
  };

  // Filtrar asistencias por rango de días
  const asistenciasFiltradas = useMemo(() => {
    if (diasFiltro === 0) return asistencias;
    const limite = new Date();
    limite.setDate(limite.getDate() - diasFiltro);
    limite.setHours(0, 0, 0, 0);
    return asistencias.filter((a) => new Date(a.fecha) >= limite);
  }, [asistencias, diasFiltro]);

  const totalDias = asistenciasFiltradas.length || 1;
  const diasPresente = asistenciasFiltradas.filter(
    (a) => a.estado === "presente"
  ).length;
  const porcentajeAsistencia = Math.round((diasPresente / totalDias) * 100);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Modal de confirmación Dar de Baja */}
      {mostrarBaja && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-slideUp">
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                  <span className="text-xl">⚠️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    ¿Dar de baja al estudiante?
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Esta acción desactivará a{" "}
                    <strong>{estudiante.nombre}</strong>. El estudiante no
                    aparecerá en las listas ni podrá registrar asistencias.
                  </p>
                  <div className="mt-4">
                    <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                      🔒 Ingresa tu contraseña para confirmar
                    </label>
                    <input
                      type="password"
                      value={passwordBaja}
                      onChange={(e) => {
                        setPasswordBaja(e.target.value);
                        setPasswordBajaError("");
                      }}
                      placeholder="Tu contraseña de directivo"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                      autoFocus
                    />
                    {passwordBajaError && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        ⚠️ {passwordBajaError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800">
              <button
                onClick={() => {
                  setMostrarBaja(false);
                  setPasswordBaja("");
                  setPasswordBajaError("");
                }}
                disabled={bajaLoading}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleDarDeBaja}
                disabled={bajaLoading}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all ${
                  bajaLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {bajaLoading ? "Procesando..." : "🗑️ Confirmar Baja"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navegación */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Link
          href="/directivo"
          className="hover:text-blue-600 transition-colors"
        >
          Panel Directivo
        </Link>
        <span>/</span>
        <span className="font-semibold text-gray-700 dark:text-gray-200">
          Historial del Estudiante
        </span>
      </div>

      {/* Cabecera */}
      <div className="mb-8 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm dark:shadow-gray-900/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white text-xl font-bold shadow-md">
              {estudiante.nombre.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-800 dark:text-gray-100">
                📋 Historial de: {estudiante.nombre}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                📚 {estudiante.anio} &quot;{estudiante.seccion}&quot;
                {estudiante.representante && (
                  <>
                    {" · "}👨‍👧 Representante:{" "}
                    {estudiante.representante.nombre} (
                    {estudiante.representante.email})
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMostrarBaja(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              🗑️ Dar de Baja
            </button>
            <Link href="/directivo" className="btn-secondary text-sm">
              ⬅️ Volver
            </Link>
          </div>
        </div>
      </div>

      {/* ── Resumen Académico (KPIs) ── */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-center shadow-sm dark:shadow-gray-900/30">
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400">
            {porcentajeAsistencia}%
          </p>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Asistencia
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {diasPresente}/{totalDias} días
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-center shadow-sm dark:shadow-gray-900/30">
          <p className="text-2xl font-extrabold text-green-600 dark:text-green-400">
            {promedioGeneral}
          </p>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Promedio
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {evaluaciones.length} evaluaciones
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-center shadow-sm dark:shadow-gray-900/30">
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            {tareas.length}
          </p>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Tareas Pendientes
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            por entregar
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-center shadow-sm dark:shadow-gray-900/30">
          <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
            {evaluaciones.length}
          </p>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Evaluaciones
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            realizadas
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* ── Asistencias ── */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">
              📅 Asistencias
            </h2>
            <select
              value={diasFiltro}
              onChange={(e) => setDiasFiltro(Number(e.target.value))}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {OPCIONES_DIAS.map((op) => (
                <option key={op.value} value={op.value}>
                  Últimas: {op.label}
                </option>
              ))}
            </select>
          </div>
          {asistenciasFiltradas.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              Sin registros de asistencia en este período
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-2">Fecha</th>
                  <th className="px-5 py-2">Materia</th>
                  <th className="px-5 py-2">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {asistenciasFiltradas.map((a) => (
                  <tr
                    key={a.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-5 py-2 text-gray-600 dark:text-gray-300 text-xs">
                      {formatearFecha(a.fecha, true)}
                    </td>
                    <td className="px-5 py-2 text-gray-700 dark:text-gray-200">
                      {a.materiaIcono} {a.materiaNombre}
                    </td>
                    <td className="px-5 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          ESTADO_BADGE[a.estado] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {ESTADO_LABEL[a.estado] ?? a.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Promedio por Materia ── */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-5 py-3">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">
              📊 Promedio por Materia
            </h2>
          </div>
          {promediosPorMateria.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              Sin evaluaciones registradas para calcular promedio
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-5 py-2">Materia</th>
                    <th className="px-5 py-2 text-center">Evaluaciones</th>
                    <th className="px-5 py-2">Notas</th>
                    <th className="px-5 py-2 text-center">Promedio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {promediosPorMateria.map((m) => (
                    <tr
                      key={m.materiaId}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-5 py-2 font-medium text-gray-700 dark:text-gray-200">
                        {m.icono} {m.materiaNombre}
                      </td>
                      <td className="px-5 py-2 text-center text-gray-500 dark:text-gray-400">
                        {m.cantidad}
                      </td>
                      <td className="px-5 py-2">
                        <div className="flex flex-wrap gap-1">
                          {m.notas.map((nota, i) => (
                            <span
                              key={i}
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                                nota >= 7
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                  : nota >= 5
                                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                    : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                              }`}
                            >
                              {nota}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-2 text-center">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            m.promedio >= 14
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                              : m.promedio >= 10
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                          }`}
                        >
                          {m.promedio}/20
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Evaluaciones ── */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-5 py-3">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">
              📝 Evaluaciones
            </h2>
          </div>
          {evaluaciones.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              Sin evaluaciones registradas
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-2">Fecha</th>
                  <th className="px-5 py-2">Materia</th>
                  <th className="px-5 py-2">Título</th>
                  <th className="px-5 py-2 text-center">Modalidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {evaluaciones.map((ev) => (
                  <tr
                    key={ev.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-5 py-2 text-gray-600 dark:text-gray-300 text-xs">
                      {formatearFecha(ev.fecha)}
                    </td>
                    <td className="px-5 py-2 text-gray-700 dark:text-gray-200">
                      {ev.materiaIcono} {ev.materiaNombre}
                    </td>
                    <td className="px-5 py-2 font-medium text-gray-800 dark:text-gray-100">
                      {ev.titulo}
                    </td>
                    <td className="px-5 py-2 text-center">
                      <span className="rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        {ev.tipo || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Calificaciones ── */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-5 py-3">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">📝 Calificaciones</h2>
          </div>
          {calificaciones.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              Sin calificaciones registradas
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-2">Materia</th>
                  <th className="px-5 py-2">Evaluación</th>
                  <th className="px-5 py-2 text-center">Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {calificaciones.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-5 py-2 text-gray-700 dark:text-gray-200">
                      {c.materiaIcono} {c.materiaNombre}
                    </td>
                    <td className="px-5 py-2 text-xs text-gray-500 dark:text-gray-400">
                      {c.tituloEvaluacion}
                    </td>
                    <td className="px-5 py-2 text-center">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        c.nota >= 14 ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" :
                        c.nota >= 10 ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" :
                        "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                      }`}>{c.nota}/20</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Tareas Pendientes ── */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-5 py-3">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">
              📄 Tareas Pendientes
            </h2>
          </div>
          {tareas.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
              Sin tareas pendientes
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-2">Materia</th>
                  <th className="px-5 py-2">Título</th>
                  <th className="px-5 py-2">Descripción</th>
                  <th className="px-5 py-2 text-center">Entrega</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {tareas.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-5 py-2 text-gray-700 dark:text-gray-200">
                      {t.materiaIcono} {t.materiaNombre}
                    </td>
                    <td className="px-5 py-2 font-medium text-gray-800 dark:text-gray-100">
                      {t.titulo}
                    </td>
                    <td className="px-5 py-2 text-gray-500 dark:text-gray-400 text-xs max-w-xs truncate">
                      {t.descripcion || "—"}
                    </td>
                    <td className="px-5 py-2 text-center">
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                        📆 {formatearFecha(t.fechaEntrega)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
