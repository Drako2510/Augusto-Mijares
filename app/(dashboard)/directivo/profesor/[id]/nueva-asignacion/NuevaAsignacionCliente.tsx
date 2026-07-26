"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

// ─── Tipos ───────────────────────────────────────────────────
interface MateriaOption {
  id: string;
  nombre: string;
  icono: string;
}

interface AnioOption {
  id: string;
  nombre: string;
}

interface SeccionOption {
  id: string;
  nombre: string;
}

interface Props {
  profesorId: string;
  profesorNombre: string;
  materias: MateriaOption[];
  anios: AnioOption[];
  secciones: SeccionOption[];
}

// ─── Componente ──────────────────────────────────────────────
export function NuevaAsignacionCliente({
  profesorId,
  profesorNombre,
  materias,
  anios,
  secciones,
}: Props) {
  const router = useRouter();
  const [materiaId, setMateriaId] = useState("");
  const [anio, setAnio] = useState("");
  const [seccion, setSeccion] = useState("");
  const [passwordConfirmacion, setPasswordConfirmacion] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    // Validación
    const errors: Record<string, string> = {};
    if (!materiaId) errors.materia = "Selecciona una materia";
    if (!anio) errors.anio = "Selecciona un año";
    if (!seccion) errors.seccion = "Selecciona una sección";
    if (!passwordConfirmacion.trim())
      errors.password = "Ingresa tu contraseña para confirmar";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `/api/directivo/profesor/${profesorId}/asignacion`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            materiaId,
            anio,
            seccion,
            passwordConfirmacion: passwordConfirmacion,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        toast.success(data.message ?? "Asignación creada correctamente ✅");
        router.push(`/directivo/profesor/${profesorId}`);
        router.refresh();
      } else {
        setError(data.error ?? "Error al crear la asignación");
      }
    } catch {
      setError("Error de conexión. Intente de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-lg px-4 py-10 sm:px-6 lg:px-8">
      {/* Navegación */}
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
        <Link
          href="/directivo"
          className="hover:text-blue-600 transition-colors"
        >
          Panel Directivo
        </Link>
        <span>/</span>
        <Link
          href={`/directivo/profesor/${profesorId}`}
          className="hover:text-blue-600 transition-colors"
        >
          {profesorNombre}
        </Link>
        <span>/</span>
        <span className="font-semibold text-gray-700 dark:text-gray-200">Nueva Asignación</span>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm dark:shadow-gray-900/30">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-2xl">
            📚
          </div>
          <h1 className="text-xl font-extrabold text-gray-800 dark:text-gray-100">
            Nueva Asignación
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
            Agregar materia a <strong>{profesorNombre}</strong>
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm font-semibold text-red-600">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Materia */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              📖 Materia
            </label>
            <select
              value={materiaId}
              onChange={(e) => {
                setMateriaId(e.target.value);
                setFieldErrors((prev) => ({ ...prev, materia: "" }));
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleccionar materia...</option>
              {materias.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.icono} {m.nombre}
                </option>
              ))}
            </select>
            {fieldErrors.materia && (
              <p className="mt-1 text-xs text-red-500">⚠️ {fieldErrors.materia}</p>
            )}
          </div>

          {/* Año y Sección en 2 columnas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                📅 Año
              </label>
              <select
                value={anio}
                onChange={(e) => {
                  setAnio(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, anio: "" }));
                }}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar año...</option>
                {anios.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </select>
              {fieldErrors.anio && (
                <p className="mt-1 text-xs text-red-500">⚠️ {fieldErrors.anio}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                🏫 Sección
              </label>
              <select
                value={seccion}
                onChange={(e) => {
                  setSeccion(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, seccion: "" }));
                }}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Seleccionar sección...</option>
                {secciones.map((s) => (
                  <option key={s.id} value={s.id}>
                    &quot;{s.nombre}&quot;
                  </option>
                ))}
              </select>
              {fieldErrors.seccion && (
                <p className="mt-1 text-xs text-red-500">
                  ⚠️ {fieldErrors.seccion}
                </p>
              )}
            </div>
          </div>

          {/* Contraseña de confirmación */}
          <div>
            <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">
              🔒 Contraseña de confirmación
            </label>
            <input
              type="password"
              value={passwordConfirmacion}
              onChange={(e) => {
                setPasswordConfirmacion(e.target.value);
                setFieldErrors((prev) => ({ ...prev, password: "" }));
              }}
              placeholder="Ingresa tu contraseña de directivo"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="current-password"
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Como medida de seguridad, ingresa tu contraseña para confirmar la
              asignación.
            </p>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-500">
                ⚠️ {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <Link
              href={`/directivo/profesor/${profesorId}`}
              className="btn-secondary flex-1 text-center"
            >
              ⬅️ Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className={`btn-primary flex-1 ${loading ? "loading" : ""}`}
            >
              <div className="spinner" />
              <span className="btn-text">
                {loading ? "Guardando..." : "✅ Guardar Asignación"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
