"use client";

import { useMemo, useState, useEffect } from "react";
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format,
  isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek, subMonths,
  differenceInDays, getDay,
} from "date-fns";
import { es } from "date-fns/locale";
import { FiChevronLeft, FiChevronRight, FiPlusCircle, FiTrash2, FiEdit2 } from "react-icons/fi";
import type { Evaluacion } from "@/hooks/useEvaluaciones";
import { formatearFechaLarga } from "@/utils/formatters";

function normalizar(texto: string) {
  return texto.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
}

interface Props {
  evaluaciones: Evaluacion[];
  onAgregar: (fechaISO: string, titulo: string, descripcion?: string, metodo?: string) => void;
  onEliminar: (id: string) => void;
  onEditar?: (id: string, fechaISO: string, titulo: string, descripcion?: string, metodo?: string) => void;
  materiaNombre?: string;
  materiaId?: string;
  anio?: string;
  seccion?: string;
  puedeEliminar?: boolean;
}

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const METODOS = ["Examen", "Exposición", "Taller Discutido", "Trabajo", "Personalizado"];

export default function CalendarioEvaluaciones({ evaluaciones, onAgregar, onEliminar, onEditar, materiaNombre, materiaId, anio, seccion, puedeEliminar = true }: Props) {
  const [mesActual, setMesActual] = useState(new Date());
  const [diasDeClase, setDiasDeClase] = useState<Set<number>>(new Set());

  // Detectar qué días de la semana el profesor da clase en esta sección
  useEffect(() => {
    if (!materiaNombre || !anio || !seccion) return;

    const fetchHorario = async () => {
      try {
        const res = await fetch(`/api/horarios?anio=${encodeURIComponent(anio)}&seccion=${encodeURIComponent(seccion)}&_t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        const horario = json.horarios?.[0];
        if (!horario) { setDiasDeClase(new Set()); return; }

        const headers: string[] = horario.data.headers.map((h: any) =>
          typeof h === "string" ? h : h.value || ""
        );
        const diasMap: Record<string, number> = {
          lunes: 1, lun: 1, martes: 2, mar: 2,
          miercoles: 3, miércoles: 3, mier: 3, mie: 3, mié: 3,
          jueves: 4, jue: 4, viernes: 5, vie: 5,
        };
        const diasConClase = new Set<number>();

        for (const row of horario.data.rows) {
          for (let ci = 1; ci < headers.length; ci++) {
            const rawCell = row[ci];
            const cell = typeof rawCell === "string" ? rawCell : (rawCell as any)?.value || "";
            const v = normalizar(cell);
            const m = normalizar(materiaNombre);
            if (cell && (v.includes(m) || m.includes(v))) {
              const diaNombre = normalizar(headers[ci] || "");
              for (const [nombre, num] of Object.entries(diasMap)) {
                if (diaNombre.includes(nombre) || nombre.includes(diaNombre)) {
                  diasConClase.add(num);
                }
              }
            }
          }
        }
        setDiasDeClase(diasConClase);
      } catch { /* silencioso */ }
    };

    fetchHorario();
    // Actualización en tiempo real: polling 30s + evento instantáneo
    const interval = setInterval(fetchHorario, 30000);
    const handler = () => fetchHorario();
    window.addEventListener("dashboard:refresh", handler);
    return () => {
      clearInterval(interval);
      window.removeEventListener("dashboard:refresh", handler);
    };
  }, [materiaNombre, anio, seccion]);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [metodo, setMetodo] = useState("");
  const [metodoCustom, setMetodoCustom] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const diasDelCalendario = useMemo(() => {
    const inicioMes = startOfMonth(mesActual);
    const finMes = endOfMonth(mesActual);
    const inicioSemana = startOfWeek(inicioMes, { weekStartsOn: 1 });
    const finSemana = endOfWeek(finMes, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: inicioSemana, end: finSemana });
  }, [mesActual]);

  const evaluacionesPorFecha = useMemo(() => {
    const mapa = new Map<string, Evaluacion[]>();
    evaluaciones.forEach((ev) => {
      const lista = mapa.get(ev.fechaISO) ?? [];
      lista.push(ev);
      mapa.set(ev.fechaISO, lista);
    });
    return mapa;
  }, [evaluaciones]);

  // Fechas con evaluaciones ya realizadas (tienen nota)
  const realizadas = useMemo(() => {
    const set = new Set<string>();
    evaluaciones.forEach((ev) => {
      if (ev.calificacion && (typeof ev.calificacion === "number" ? ev.calificacion > 0 : true)) {
        set.add(ev.fechaISO);
      }
    });
    return set;
  }, [evaluaciones]);

  const proximaEval = useMemo(() => {
    const hoyISO = format(new Date(), "yyyy-MM-dd");
    const futuras = evaluaciones
      .filter((ev) => ev.fechaISO >= hoyISO)
      .sort((a, b) => a.fechaISO.localeCompare(b.fechaISO));
    return futuras[0] || null;
  }, [evaluaciones]);

  const diasParaProxima = proximaEval
    ? differenceInDays(new Date(proximaEval.fechaISO + "T00:00:00"), new Date())
    : null;

  const evalsDelDia = diaSeleccionado ? evaluacionesPorFecha.get(diaSeleccionado) || [] : [];

  function abrirForm(ev?: Evaluacion) {
    if (ev) {
      setEditandoId(ev.id);
      setTitulo(ev.titulo);
      setDescripcion(ev.descripcion || "");
      const m = ev.metodo || "";
      if (METODOS.includes(m)) { setMetodo(m); setMetodoCustom(""); }
      else if (m) { setMetodo("Personalizado"); setMetodoCustom(m); }
      else { setMetodo(""); setMetodoCustom(""); }
    } else {
      setEditandoId(null);
      setTitulo("");
      setDescripcion("");
      setMetodo("");
      setMetodoCustom("");
    }
    setMostrarForm(true);
  }

  function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!diaSeleccionado || !titulo.trim() || !metodo) return;
    const metodoFinal = metodo === "Personalizado" ? metodoCustom.trim() : metodo;
    if (!metodoFinal) return;
    if (editandoId && onEditar) {
      onEditar(editandoId, diaSeleccionado, titulo.trim(), descripcion.trim() || undefined, metodoFinal);
    } else {
      onAgregar(diaSeleccionado, titulo.trim(), descripcion.trim() || undefined, metodoFinal);
    }
    setMostrarForm(false);
    setEditandoId(null);
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm dark:shadow-gray-900/30">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => setMesActual((m) => subMonths(m, 1))} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <FiChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="font-bold text-gray-700 dark:text-gray-200 capitalize">
          {format(mesActual, "MMMM yyyy", { locale: es })}
        </h3>
        <button type="button" onClick={() => setMesActual((m) => addMonths(m, 1))} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <FiChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-400 dark:text-gray-500">
        {DIAS_SEMANA.map((d) => <div key={d} className="py-1">{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {diasDelCalendario.map((dia) => {
          const iso = format(dia, "yyyy-MM-dd");
          const tiene = evaluacionesPorFecha.has(iso);
          const realizada = realizadas.has(iso);
          const enMes = isSameMonth(dia, mesActual);
          const sel = diaSeleccionado === iso;
          return (
            <button key={iso} type="button" onClick={() => { setDiaSeleccionado(iso); setMostrarForm(false); }}
              className={`relative flex h-11 flex-col items-center justify-center rounded-lg text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue ${
                enMes ? "text-gray-700 dark:text-gray-200" : "text-gray-300 dark:text-gray-600"
              } ${
                sel ? "bg-brand-blue text-white font-bold" :
                isToday(dia) ? "bg-brand-blue/10 font-bold text-brand-blue" :
                "hover:bg-gray-100 dark:hover:bg-gray-800"
              } ${
                diasDeClase.has(getDay(dia)) && enMes && !sel
                  ? "ring-2 ring-green-400 dark:ring-green-500 ring-offset-1 bg-green-50 dark:bg-green-900/30 font-bold text-green-700 dark:text-green-300 shadow-sm"
                  : ""
              }`}>
              {format(dia, "d")}
              {diasDeClase.has(getDay(dia)) && enMes && !sel && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[8px]">📚</span>
              )}
              {tiene && (
                <span className={`absolute bottom-1 h-2 w-2 rounded-full ${
                  sel ? "bg-white" :
                  realizada ? "bg-green-500" : "bg-brand-orange"
                }`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Modal del día seleccionado */}
      {diaSeleccionado && !mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setDiaSeleccionado(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-xl">📅</div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {formatearFechaLarga(diaSeleccionado)}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {evalsDelDia.length} evaluación{evalsDelDia.length !== 1 ? "es" : ""}
                  </p>
                </div>
              </div>
              <button onClick={() => setDiaSeleccionado(null)} className="rounded-full p-1 text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-5 space-y-3">
              {evalsDelDia.length > 0 && (
                <div className="space-y-2">
                  {evalsDelDia.map((ev) => (
                    <div key={ev.id} className="flex items-start justify-between rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 text-sm">
                      <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-200">{ev.titulo}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {ev.metodo && `${ev.metodo} · `}{ev.descripcion || "Sin descripción"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {onEditar && (
                          <button onClick={() => abrirForm(ev)}
                            className="rounded p-1 text-gray-300 dark:text-gray-600 hover:text-brand-blue hover:bg-brand-blue/10 transition-colors">
                            <FiEdit2 className="h-4 w-4" />
                          </button>
                        )}
                        {puedeEliminar && (
                          <button onClick={() => onEliminar(ev.id)}
                            className="rounded p-1 text-gray-300 dark:text-gray-600 hover:text-brand-red hover:bg-brand-red/10 transition-colors">
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {evalsDelDia.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No hay evaluaciones para este día.</p>
              )}

              <button onClick={() => abrirForm()}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
                <FiPlusCircle className="h-4 w-4" /> Agregar Evaluación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal flotante para agregar/editar evaluación */}
      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setMostrarForm(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 text-xl">
                  {editandoId ? "✏️" : "📝"}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {editandoId ? "Editar Evaluación" : "Nueva Evaluación"}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {diaSeleccionado && formatearFechaLarga(diaSeleccionado)}
                  </p>
                </div>
              </div>
              <button onClick={() => setMostrarForm(false)} className="rounded-full p-1 text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleGuardar} className="p-5 space-y-4">
              <input type="text" required value={titulo} onChange={(e) => setTitulo(e.target.value)}
                placeholder="Tema de la evaluación"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              <select value={metodo} onChange={(e) => setMetodo(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue">
                <option value="">Modalidad</option>
                {METODOS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              {metodo === "Personalizado" && (
                <input type="text" required value={metodoCustom} onChange={(e) => setMetodoCustom(e.target.value)}
                  placeholder="Escribe la modalidad personalizada"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              )}
              <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción opcional" rows={2}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue" />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setMostrarForm(false)}
                  className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" className="btn-primary flex-1">
                  {editandoId ? "✏️ Actualizar" : "📝 Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Próxima evaluación */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
        {proximaEval ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            📅 Próxima evaluación: <strong>{proximaEval.titulo}</strong> — {formatearFechaLarga(proximaEval.fechaISO)}
            {diasParaProxima !== null && (
              <span className="ml-1 text-brand-blue font-bold">
                (faltan {diasParaProxima} día{diasParaProxima !== 1 ? "s" : ""})
              </span>
            )}
          </p>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">No hay evaluaciones programadas.</p>
        )}
      </div>
    </div>
  );
}
