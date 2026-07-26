"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface EstudianteItem {
  id: string;
  nombre: string;
  seleccionado: boolean;
}

interface Props {
  anio: string;
  seccion: string;
}

const SECCIONES = ["A", "B", "C", "D"];

export function CambiarSeccionButton({ anio, seccion }: Props) {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [estudiantes, setEstudiantes] = useState<EstudianteItem[]>([]);
  const [seccionDestino, setSeccionDestino] = useState("");
  const [passwordConfirmacion, setPasswordConfirmacion] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mostrarModal) {
      fetch(`/api/directivo/estudiantes-por-seccion?anio=${encodeURIComponent(anio)}&seccion=${encodeURIComponent(seccion)}`)
        .then((r) => r.json())
        .then((d) => setEstudiantes((d.estudiantes ?? []).map((e: any) => ({ id: e.id, nombre: e.nombre, seleccionado: false }))))
        .catch(() => {});
    }
  }, [mostrarModal, anio, seccion]);

  const toggleEstudiante = (id: string) => {
    setEstudiantes((prev) => prev.map((e) => (e.id === id ? { ...e, seleccionado: !e.seleccionado } : e)));
  };
  const seleccionarTodos = () => setEstudiantes((prev) => prev.map((e) => ({ ...e, seleccionado: true })));
  const deseleccionarTodos = () => setEstudiantes((prev) => prev.map((e) => ({ ...e, seleccionado: false })));
  const seleccionados = estudiantes.filter((e) => e.seleccionado);

  const handleCambiar = async () => {
    setPasswordError("");
    if (!seccionDestino) { toast.error("Selecciona una sección de destino"); return; }
    if (seccionDestino === seccion) { toast.error("La sección de destino debe ser diferente"); return; }
    if (seleccionados.length === 0) { toast.error("Selecciona al menos un estudiante"); return; }
    if (!passwordConfirmacion.trim()) { setPasswordError("Ingresa tu contraseña para confirmar"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/directivo/cambiar-seccion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anio,
          seccionOrigen: seccion,
          seccionDestino,
          estudianteIds: seleccionados.map((e) => e.id),
          passwordConfirmacion,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message ?? "Sección cambiada correctamente");
        setMostrarModal(false);
      } else {
        setPasswordError(data.error ?? "Error al cambiar de sección");
        toast.error(data.error ?? "Error");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => { setMostrarModal(true); setSeccionDestino(""); setPasswordConfirmacion(""); setPasswordError(""); }}
        className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all"
      >
        🔀 Cambiar de Sección
      </button>

      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-slideUp">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-xl">🔀</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Cambiar de Sección</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {anio} &quot;{seccion}&quot; → seleccionar destino
                  </p>
                </div>
              </div>
              <button onClick={() => setMostrarModal(false)} className="rounded-full p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Sección destino */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">🏫 Nueva Sección</label>
                <select
                  value={seccionDestino}
                  onChange={(e) => setSeccionDestino(e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 outline-none focus:border-indigo-500"
                >
                  <option value="">Seleccionar sección de destino...</option>
                  {SECCIONES.filter((s) => s !== seccion).map((s) => (
                    <option key={s} value={s}>&quot;{s}&quot;</option>
                  ))}
                </select>
              </div>

              {/* Lista de estudiantes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">👨‍🎓 Estudiantes a mover</label>
                  <div className="flex gap-2">
                    <button onClick={seleccionarTodos} className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Todos</button>
                    <button onClick={deseleccionarTodos} className="text-xs font-semibold text-gray-400 dark:text-gray-500 hover:underline">Ninguno</button>
                  </div>
                </div>
                <span className="text-xs text-gray-400 mb-2 block">{seleccionados.length}/{estudiantes.length} seleccionados</span>
                <div className="max-h-[200px] overflow-y-auto space-y-1">
                  {estudiantes.map((e) => (
                    <label key={e.id}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                        e.seleccionado ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20" : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                      }`}>
                      <input type="checkbox" checked={e.seleccionado} onChange={() => toggleEstudiante(e.id)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className={`text-sm font-medium ${e.seleccionado ? "text-indigo-700 dark:text-indigo-300" : "text-red-700 dark:text-red-300 line-through"}`}>
                        {e.nombre}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="mb-1 block text-sm font-semibold text-gray-700 dark:text-gray-200">🔒 Contraseña del directivo</label>
                <input
                  type="password"
                  value={passwordConfirmacion}
                  onChange={(e) => { setPasswordConfirmacion(e.target.value); setPasswordError(""); }}
                  placeholder="Ingresa tu contraseña para confirmar"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {passwordError && <p className="mt-1 text-xs text-red-500">⚠️ {passwordError}</p>}
              </div>

              <button
                onClick={handleCambiar}
                disabled={loading || !seccionDestino || seleccionados.length === 0}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Procesando..." : `🔀 Cambiar de Sección (${seleccionados.length} estudiante${seleccionados.length !== 1 ? "s" : ""})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
