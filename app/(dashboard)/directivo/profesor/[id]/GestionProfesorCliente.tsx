"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

// ─── Tipos ───────────────────────────────────────────────────
interface MateriaMini {
  id: string;
  nombre: string;
  icono: string;
}

interface AsignacionProfesor {
  id: string;
  materiaId: string;
  materia: MateriaMini;
  anio: string;
  seccion: string;
  claveSecreta: string;
}

interface ProfesorData {
  id: string;
  nombre: string;
  email: string;
  activo: boolean;
}

interface Props {
  profesor: ProfesorData;
  asignaciones: AsignacionProfesor[];
}

// ─── Componente ──────────────────────────────────────────────
export function GestionProfesorCliente({ profesor, asignaciones }: Props) {
  const router = useRouter();
  const [bajaLoading, setBajaLoading] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [passwordConfirmacion, setPasswordConfirmacion] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // KPIs
  const aniosUnicos = new Set(asignaciones.map((a) => a.anio)).size;
  const seccionesUnicas = new Set(
    asignaciones.map((a) => `${a.anio}_${a.seccion}`)
  ).size;

  const handleDarDeBaja = async () => {
    setPasswordError("");

    if (!passwordConfirmacion.trim()) {
      setPasswordError("Debes ingresar tu contraseña para confirmar");
      return;
    }

    setBajaLoading(true);
    try {
      const res = await fetch(`/api/directivo/profesor/${profesor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activo: false,
          passwordConfirmacion: passwordConfirmacion,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Profesor dado de baja correctamente 🗑️");
        router.push("/directivo");
        router.refresh();
      } else {
        toast.error(data.error ?? "Error al dar de baja al profesor");
        setPasswordError(data.error ?? "Contraseña incorrecta");
      }
    } catch {
      toast.error("Error de conexión al dar de baja al profesor");
    } finally {
      setBajaLoading(false);
      if (!passwordError) {
        setMostrarConfirmacion(false);
        setPasswordConfirmacion("");
      }
    }
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Modal de confirmación */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-scaleIn">
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                  <span className="text-xl">⚠️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    ¿Dar de baja al profesor?
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">
                    Esta acción desactivará a{" "}
                    <strong>{profesor.nombre}</strong> y todas sus asignaciones.
                    El profesor no podrá acceder al sistema.
                  </p>
                  {/* Campo de contraseña para confirmar */}
                  <div className="mt-4">
                    <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300 dark:text-gray-600">
                      🔒 Ingresa tu contraseña para confirmar
                    </label>
                    <input
                      type="password"
                      value={passwordConfirmacion}
                      onChange={(e) => {
                        setPasswordConfirmacion(e.target.value);
                        setPasswordError("");
                      }}
                      placeholder="Tu contraseña de directivo"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      autoFocus
                    />
                    {passwordError && (
                      <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                        ⚠️ {passwordError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800">
              <button
                onClick={() => {
                  setMostrarConfirmacion(false);
                  setPasswordConfirmacion("");
                  setPasswordError("");
                }}
                disabled={bajaLoading}
                className="btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleDarDeBaja}
                disabled={bajaLoading}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold text-white shadow-sm dark:shadow-gray-900/30 transition-all ${
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
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
        <Link
          href="/directivo"
          className="hover:text-blue-600 transition-colors"
        >
          Panel Directivo
        </Link>
        <span>/</span>
        <span className="font-semibold text-gray-700 dark:text-gray-200">{profesor.nombre}</span>
      </div>

      {/* Card de información del profesor */}
      <div className="mb-8 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm dark:shadow-gray-900/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white text-xl font-bold shadow-md dark:shadow-gray-900/40">
              {profesor.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-800 dark:text-gray-100">
                👨‍🏫 {profesor.nombre}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{profesor.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                profesor.activo
                  ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                  : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
              }`}
            >
              {profesor.activo ? "✅ Activo" : "❌ Inactivo"}
            </span>
            <Link href="/directivo" className="btn-secondary text-sm">
              ⬅️ Volver
            </Link>
          </div>
        </div>

        {/* Botón Dar de Baja (solo si está activo) */}
        {profesor.activo && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setMostrarConfirmacion(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 dark:bg-red-900/40 transition-colors"
            >
              🗑️ Dar de Baja
            </button>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-center shadow-sm dark:shadow-gray-900/30">
          <p className="text-2xl font-extrabold text-blue-600">
            {asignaciones.length}
          </p>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Materias Asignadas
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-center shadow-sm dark:shadow-gray-900/30">
          <p className="text-2xl font-extrabold text-green-600">
            {aniosUnicos}
          </p>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Años Distintos
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 text-center shadow-sm dark:shadow-gray-900/30">
          <p className="text-2xl font-extrabold text-purple-600">
            {seccionesUnicas}
          </p>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wide">
            Secciones
          </p>
        </div>
      </div>

      {/* Asignaciones */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200">
          📚 Asignaciones del Profesor
        </h2>
        <Link
          href={`/directivo/profesor/${profesor.id}/nueva-asignacion`}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md dark:shadow-gray-900/40 hover:bg-blue-700 hover:shadow-lg dark:shadow-gray-900/50 transition-all"
        >
          ➕ Nueva Asignación
        </Link>
      </div>

      {asignaciones.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-12 text-center">
          <span className="text-4xl">📭</span>
          <p className="mt-3 text-gray-500 dark:text-gray-400 dark:text-gray-500">
            Este profesor no tiene materias asignadas.
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Asígnale una materia para comenzar.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-900/30">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-left text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 dark:text-gray-500">
              <tr>
                <th className="px-5 py-3">Materia</th>
                <th className="px-5 py-3">Año</th>
                <th className="px-5 py-3 text-center">Sección</th>
                <th className="px-5 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {asignaciones.map((a) => (
                <tr
                  key={a.id}
                  className="hover:bg-gray-50 dark:bg-gray-800 transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-100">
                    <span className="mr-2">{a.materia.icono}</span>
                    {a.materia.nombre}
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-300 dark:text-gray-600">{a.anio}</td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-300 dark:text-gray-600">
                    &quot;{a.seccion}&quot;
                  </td>
                  <td className="px-5 py-3 text-center">
                    <Link
                      href={`/directivo/materia/${a.materiaId}/${a.anio}/${a.seccion}`}
                      className="inline-flex items-center gap-1 rounded-full bg-purple-50 dark:bg-purple-900/30 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 transition-all hover:bg-purple-100 dark:hover:bg-purple-900/40 hover:shadow-sm dark:shadow-gray-900/30"
                    >
                      🔍 Ver Clase
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
