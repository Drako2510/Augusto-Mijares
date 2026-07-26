"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface EvaluacionItem {
  id: string;
  titulo: string;
  fecha: string;
  tipo: string;
}

interface EstudianteNota {
  id: string;
  nombre: string;
  nota: number | null;
}

interface Props {
  materiaId: string;
  materiaNombre: string;
  anio: string;
  seccion: string;
  onClose: () => void;
}

export function CalificacionesModal({ materiaId, materiaNombre, anio, seccion, onClose }: Props) {
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionItem[]>([]);
  const [selectedEval, setSelectedEval] = useState<EvaluacionItem | null>(null);
  const [estudiantes, setEstudiantes] = useState<EstudianteNota[]>([]);
  const [loadingEvals, setLoadingEvals] = useState(true);
  const [loadingNotas, setLoadingNotas] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editandoEval, setEditandoEval] = useState<EvaluacionItem | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editTipo, setEditTipo] = useState("");
  const [editFecha, setEditFecha] = useState("");
  // Autorización para modificar notas existentes
  const [mostrarAuth, setMostrarAuth] = useState(false);
  const [passwordAuth, setPasswordAuth] = useState("");
  const [authError, setAuthError] = useState("");
  const [pendingSave, setPendingSave] = useState<(() => void) | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/evaluaciones?materiaId=${materiaId}&anio=${anio}&seccion=${seccion}`);
        if (res.ok) {
          const data = await res.json();
          setEvaluaciones(data.evaluaciones || []);
        }
      } catch {}
      setLoadingEvals(false);
    };
    load();
  }, [materiaId, anio, seccion]);

  const cargarNotas = async (evalId: string) => {
    setLoadingNotas(true);
    try {
      const [estRes, notasRes] = await Promise.all([
        fetch(`/api/directivo/estudiantes-por-seccion?anio=${encodeURIComponent(anio)}&seccion=${encodeURIComponent(seccion)}`),
        fetch(`/api/calificaciones?materiaId=${materiaId}`),
      ]);
      const estData = await estRes.json();
      const notasData = await notasRes.json();
      const notas = notasData.calificaciones || [];

      setEstudiantes((estData.estudiantes || []).map((e: any) => {
        const existente = notas.find((n: any) => n.estudianteId === e.id && n.evaluacionId === evalId);
        return { id: e.id, nombre: e.nombre, nota: existente ? existente.nota : null };
      }));
    } catch {}
    setLoadingNotas(false);
  };

  const seleccionarEvaluacion = (ev: EvaluacionItem) => {
    setSelectedEval(ev);
    cargarNotas(ev.id);
  };

  const abrirEditar = (ev: EvaluacionItem) => {
    setEditandoEval(ev);
    setEditTitulo(ev.titulo);
    setEditDescripcion("");
    setEditTipo(ev.tipo);
    setEditFecha(ev.fecha.split("T")[0]);
  };

  const handleGuardarEdicion = async () => {
    if (!editandoEval || !editTitulo.trim()) return;
    try {
      const res = await fetch("/api/evaluaciones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editandoEval.id, titulo: editTitulo.trim(), descripcion: editDescripcion.trim(), tipo: editTipo, fecha: editFecha }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Evaluación actualizada ✏️");
        setEditandoEval(null);
        // Refrescar lista
        const res2 = await fetch(`/api/evaluaciones?materiaId=${materiaId}&anio=${anio}&seccion=${seccion}`);
        if (res2.ok) setEvaluaciones((await res2.json()).evaluaciones || []);
      } else {
        toast.error(data.error || "Error al actualizar");
      }
    } catch { toast.error("Error de conexión"); }
  };

  const actualizarNota = (idx: number, valor: string) => {
    const v = valor === "" ? null : Number(valor);
    if (v !== null && (v < 0 || v > 20)) return;
    setEstudiantes((prev) => prev.map((e, i) => i === idx ? { ...e, nota: v } : e));
  };

  const ejecutarGuardar = async (passwordConfirmacion?: string) => {
    if (!selectedEval) return;
    const validas = estudiantes.filter((e) => e.nota !== null);
    if (validas.length === 0) { toast.error("Ingresa al menos una nota"); return; }
    setSaving(true);
    try {
      const body: any = {
        evaluacionId: selectedEval.id,
        materiaId, anio, seccion,
        notas: validas.map((e) => ({ estudianteId: e.id, nota: e.nota })),
      };
      if (passwordConfirmacion) body.passwordConfirmacion = passwordConfirmacion;

      const res = await fetch("/api/calificaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        toast.success(`${data.guardadas} notas guardadas`);
        setSelectedEval(null);
      } else if (res.status === 403 || data.error?.includes("autorización") || data.error?.includes("directivo")) {
        // Necesita auth: mostrar modal
        if (!passwordConfirmacion) {
          setMostrarAuth(true);
          setAuthError("");
          setSaving(false);
          return; // No cerrar, esperar auth
        }
        toast.error(data.error || "Contraseña incorrecta");
      } else {
        toast.error(data.error || "Error");
      }
    } catch { toast.error("Error de conexión"); }
    setSaving(false);
    setMostrarAuth(false);
    setPasswordAuth("");
  };

  const handleGuardar = () => {
    ejecutarGuardar();
  };

  const confirmarAuth = () => {
    if (!passwordAuth.trim()) {
      setAuthError("Ingresa la contraseña del directivo");
      return;
    }
    ejecutarGuardar(passwordAuth);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 p-5">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {selectedEval ? `📝 ${selectedEval.titulo}` : "📊 Evaluaciones"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{materiaNombre} · {anio} &quot;{seccion}&quot;</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedEval && (
              <button onClick={() => setSelectedEval(null)} className="text-xs text-gray-400 hover:text-gray-600">
                ⬅️ Volver
              </button>
            )}
            <button onClick={onClose} className="rounded-full p-1 text-gray-400 hover:text-gray-600">✕</button>
          </div>
        </div>

        <div className="p-5">
          {!selectedEval ? (
            /* Lista de evaluaciones */
            loadingEvals ? (
              <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" /></div>
            ) : evaluaciones.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No hay evaluaciones registradas para esta materia.</p>
            ) : (
              <div className="space-y-2">
                {evaluaciones.map((ev) => (
                  <button key={ev.id} onClick={() => seleccionarEvaluacion(ev)}
                    className="w-full text-left rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 dark:text-gray-100">{ev.titulo}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(ev.fecha).toLocaleDateString("es")} · {ev.tipo}
                        </p>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => abrirEditar(ev)}
                          className="rounded-full p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                          ✏️
                        </button>
                        <span className="text-blue-500">→</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )
          ) : (
            /* Registro de notas */
            <div className="space-y-3">
              {loadingNotas ? (
                <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" /></div>
              ) : estudiantes.length === 0 ? (
                <p className="text-center text-gray-400 py-8">No hay estudiantes en esta sección.</p>
              ) : (
                <>
                  <div className="max-h-[50vh] overflow-y-auto space-y-1">
                    {estudiantes.map((est, i) => (
                      <div key={est.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                        <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{est.nombre}</span>
                        <input type="number" min={0} max={20} step={0.5} value={est.nota ?? ""}
                          onChange={(e) => actualizarNota(i, e.target.value)} placeholder="0-20"
                          className="w-20 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-sm text-center text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <span className="text-xs text-gray-400">/20</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleGuardar} disabled={saving} className="btn-primary w-full">
                    {saving ? "Guardando..." : "💾 Guardar Notas"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de autorización del directivo */}
      {mostrarAuth && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => { setMostrarAuth(false); setPasswordAuth(""); }}>
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-xl">🔐</div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Autorización Requerida</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Para modificar notas existentes necesitas la contraseña del directivo.
                  </p>
                  <input type="password" value={passwordAuth} onChange={(e) => { setPasswordAuth(e.target.value); setAuthError(""); }}
                    placeholder="Contraseña del directivo" autoFocus
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 mt-3 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  {authError && <p className="mt-1 text-xs text-red-500">⚠️ {authError}</p>}
                </div>
              </div>
            </div>
            <div className="flex gap-2 border-t border-gray-100 dark:border-gray-800 p-4 bg-gray-50 dark:bg-gray-800">
              <button onClick={() => { setMostrarAuth(false); setPasswordAuth(""); }} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={confirmarAuth} className="btn-primary flex-1">🔓 Autorizar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de editar evaluación */}
      {editandoEval && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setEditandoEval(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 p-5">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">✏️ Editar Evaluación</h3>
              <button onClick={() => setEditandoEval(null)} className="rounded-full p-1 text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleGuardarEdicion(); }} className="p-5 space-y-4">
              <input type="text" required value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)}
                placeholder="Tema de la evaluación"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              <select value={editTipo} onChange={(e) => setEditTipo(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue">
                <option value="">Modalidad</option>
                {["Examen","Exposición","Taller Discutido","Trabajo","Personalizado"].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <textarea value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)}
                placeholder="Descripción opcional" rows={2}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 dark:text-gray-400">📅 Fecha</label>
                <input type="date" value={editFecha} onChange={(e) => setEditFecha(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
                {editFecha && (
                  <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                    📅 {new Date(editFecha + "T00:00:00").toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditandoEval(null)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">✏️ Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
