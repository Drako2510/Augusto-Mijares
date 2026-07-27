"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface EstudianteItem {
  id: string;
  nombre: string;
  seleccionado: boolean;
}

export function PasarAnioButton() {
  const [mostrarModal, setMostrarModal] = useState(false);
  const [modo, setModo] = useState<"inicio" | "personalizado" | "lista">("inicio");
  const [anio, setAnio] = useState("");
  const [seccion, setSeccion] = useState("");
  const [estudiantes, setEstudiantes] = useState<EstudianteItem[]>([]);
  const [loading, setLoading] = useState(false);

  const anios = ["1ro", "2do", "3ro", "4to", "5to"];
  const secciones = ["A", "B", "C", "D"];

  const cargarEstudiantes = async (a: string, s: string) => {
    try {
      const res = await fetch(`/api/directivo/estudiantes-por-seccion?anio=${encodeURIComponent(a)}&seccion=${encodeURIComponent(s)}`);
      const data = await res.json();
      setEstudiantes((data.estudiantes ?? []).map((e: any) => ({ id: e.id, nombre: e.nombre, seleccionado: true })));
    } catch { /* silencioso */ }
  };

  const toggleEstudiante = (id: string) => {
    setEstudiantes((prev) => prev.map((e) => (e.id === id ? { ...e, seleccionado: !e.seleccionado } : e)));
  };
  const seleccionarTodos = () => setEstudiantes((prev) => prev.map((e) => ({ ...e, seleccionado: true })));
  const deseleccionarTodos = () => setEstudiantes((prev) => prev.map((e) => ({ ...e, seleccionado: false })));
  const seleccionados = estudiantes.filter((e) => e.seleccionado);

  // Pasar TODOS los estudiantes de todos los años
  const handlePasarTodos = async () => {
    setLoading(true);
    try {
      // Procesar de 5to hacia abajo para no sobrescribir
      const orden = ["5to", "4to", "3ro", "2do", "1ro"];
      let total = 0;
      for (const a of orden) {
        for (const s of secciones) {
          const res = await fetch("/api/directivo/pasar-anio", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ anio: a, seccion: s, todos: true }),
          });
          const data = await res.json();
          if (data.success) total += data.pasados ?? 0;
        }
      }
      toast.success(`🎓 ${total} estudiantes promovidos correctamente`);
      setMostrarModal(false);
    } catch {
      toast.error("Error al pasar de año");
    } finally {
      setLoading(false);
    }
  };

  const handlePasarPersonalizado = async () => {
    if (seleccionados.length === 0) {
      toast.error("Selecciona al menos un estudiante");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/directivo/pasar-anio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anio, seccion,
          estudianteIds: seleccionados.map((e) => e.id),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message ?? "Estudiantes promovidos");
        setMostrarModal(false);
      } else {
        toast.error(data.error ?? "Error al pasar de año");
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
        onClick={() => { setMostrarModal(true); setModo("inicio"); }}
        className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-amber-700 hover:shadow-lg transition-all"
      >
        🎓 Pasar de Año
      </button>

      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-scaleIn">
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40 text-xl">🎓</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {modo === "inicio" ? "Pasar de Año" : modo === "personalizado" ? "Seleccionar Curso" : `Pasar de ${anio} "${seccion}"`}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {modo === "inicio" ? "Promover estudiantes al siguiente año" : "Elige año y sección para personalizar"}
                  </p>
                </div>
              </div>
              <button onClick={() => setMostrarModal(false)} className="rounded-full p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition">✕</button>
            </div>

            <div className="p-6 space-y-4">
              {modo === "inicio" && (
                <>
                  <button onClick={handlePasarTodos} disabled={loading}
                    className="w-full rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-left hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors disabled:opacity-50">
                    <p className="font-bold text-amber-700 dark:text-amber-300">🚀 Pasar Todos de Año</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">1ro→2do, 2do→3ro, 3ro→4to, 4to→5to, 5to→egreso. Todas las secciones.</p>
                  </button>
                  <button onClick={() => setModo("personalizado")}
                    className="w-full rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 text-left hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                    <p className="font-bold text-blue-700 dark:text-blue-300">✏️ Pasar de Forma Personalizada</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Elige año, sección y selecciona manualmente quiénes pasan</p>
                  </button>
                </>
              )}

              {modo === "personalizado" && (
                <>
                  <button onClick={() => setModo("inicio")} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors">⬅️ Volver</button>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">📅 Año</label>
                      <select value={anio} onChange={(e) => setAnio(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500">
                        <option value="">Seleccionar año...</option>
                        {anios.map((a) => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-300">🏫 Sección</label>
                      <select value={seccion} onChange={(e) => setSeccion(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500">
                        <option value="">Seleccionar sección...</option>
                        {secciones.map((s) => <option key={s} value={s}>&quot;{s}&quot;</option>)}
                      </select>
                    </div>
                  </div>
                  <button onClick={async () => { await cargarEstudiantes(anio, seccion); setModo("lista"); }}
                    disabled={!anio || !seccion}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    📋 Ver Lista de Estudiantes
                  </button>
                </>
              )}

              {modo === "lista" && (
                <>
                  <button onClick={() => { setModo("personalizado"); setEstudiantes([]); }} className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 transition-colors">
                    ⬅️ Volver
                  </button>
                  <div className="flex gap-2">
                    <button onClick={seleccionarTodos} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">Seleccionar todos</button>
                    <button onClick={deseleccionarTodos} className="text-xs font-semibold text-gray-400 dark:text-gray-500 hover:underline">Deseleccionar todos</button>
                    <span className="text-xs text-gray-400 ml-auto">{seleccionados.length}/{estudiantes.length}</span>
                  </div>
                  <div className="max-h-[250px] overflow-y-auto space-y-1">
                    {estudiantes.map((e) => (
                      <label key={e.id}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                          e.seleccionado ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20" : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                        }`}>
                        <input type="checkbox" checked={e.seleccionado} onChange={() => toggleEstudiante(e.id)}
                          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                        <span className={`text-sm font-medium ${e.seleccionado ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300 line-through"}`}>
                          {e.nombre}
                        </span>
                      </label>
                    ))}
                  </div>
                  <button onClick={handlePasarPersonalizado} disabled={loading || seleccionados.length === 0}
                    className="w-full rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors">
                    {loading ? "Procesando..." : `🎓 Pasar de Año (${seleccionados.length} estudiante${seleccionados.length !== 1 ? "s" : ""})`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
