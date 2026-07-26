"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FiX, FiChevronLeft, FiChevronRight, FiCheckCircle, FiXCircle, FiMinusCircle } from "react-icons/fi";

interface Props {
  estudianteId: string;
  estudianteNombre: string;
  onClose: () => void;
}

interface RegistroMateria {
  materiaId: string;
  materia: string;
  icono: string;
  estado: string;
  observacion?: string | null;
}

interface DiaHistorial {
  fecha: string;
  dia: number;
  diaSemana: string;
  registros: RegistroMateria[];
}

interface Resumen {
  mes: number;
  anio: number;
  totalDias: number;
  diasConRegistro: number;
  porcentaje: number;
  registros: number;
  presentes: number;
  ausentes: number;
  tardes: number;
  justificados: number;
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function HistorialAsistenciaModal({ estudianteId, estudianteNombre, onClose }: Props) {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());
  const [historial, setHistorial] = useState<DiaHistorial[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ estudianteId, mes: String(mes), anio: String(anio) });
    fetch(`/api/asistencia/historial?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setHistorial(d.historial ?? []);
        setResumen(d.resumen ?? null);
      })
      .catch(() => setError("Error al cargar"))
      .finally(() => setLoading(false));
  }, [estudianteId, mes, anio]);

  const mesAnterior = () => {
    if (mes === 1) { setMes(12); setAnio((a) => a - 1); }
    else setMes((m) => m - 1);
  };
  const mesSiguiente = () => {
    if (mes === 12) { setMes(1); setAnio((a) => a + 1); }
    else setMes((m) => m + 1);
  };

  const getDiaColor = (registros: RegistroMateria[]) => {
    const estados = registros.map((r) => r.estado);
    if (estados.every((e) => e === "sin_marcar")) return "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800";
    if (estados.some((e) => e === "ausente")) return "border-red-400 bg-red-50 dark:bg-red-900/30";
    if (estados.some((e) => e === "tarde")) return "border-amber-400 bg-amber-50";
    return "border-green-400 bg-green-50 dark:bg-green-900/30";
  };

  const getDiaIcono = (registros: RegistroMateria[]) => {
    const estados = registros.map((r) => r.estado);
    if (estados.every((e) => e === "sin_marcar")) return <FiMinusCircle className="h-5 w-5 text-gray-400 dark:text-gray-500" />;
    if (estados.some((e) => e === "ausente")) return <FiXCircle className="h-5 w-5 text-red-600" />;
    return <FiCheckCircle className="h-5 w-5 text-green-600" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm py-8 px-2 sm:px-4" onClick={onClose}>
      <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 p-6">
          <div>
            <h2 className="text-xl font-extrabold text-gray-800 dark:text-gray-100">📊 Historial de Asistencia</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{estudianteNombre}</p>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            </div>
          ) : error ? (
            <p className="py-8 text-center text-red-500">❌ {error}</p>
          ) : (
            <>
              {/* KPIs */}
              {resumen && (
                <div className="mb-6 grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
                  <Kpi value={`${resumen.porcentaje}%`} label="Asistencia" color="blue" />
                  <Kpi value={resumen.presentes} label="✅ Presentes" color="green" />
                  <Kpi value={resumen.ausentes} label="❌ Ausentes" color="red" />
                  <Kpi value={resumen.tardes} label="⏰ Tardes" color="amber" />
                  <Kpi value={resumen.justificados} label="📝 Justif." color="purple" />
                </div>
              )}

              {/* Navegación */}
              <div className="mb-4 flex items-center justify-between">
                <button onClick={mesAnterior} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-100 dark:bg-gray-800">
                  <FiChevronLeft className="inline h-4 w-4" /> Anterior
                </button>
                <h3 className="text-base font-bold text-gray-700 dark:text-gray-200">
                  {MESES[mes - 1]} {anio}
                </h3>
                <button onClick={mesSiguiente} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-100 dark:bg-gray-800">
                  Siguiente <FiChevronRight className="inline h-4 w-4" />
                </button>
              </div>

              {/* Lista de días */}
              {historial.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">Sin registros en este mes</p>
              ) : (
                <div className="space-y-2">
                  {historial.map((dia) => (
                    <div
                      key={dia.fecha}
                      className={`rounded-lg border-l-4 p-4 transition hover:shadow-sm dark:shadow-gray-900/30 ${getDiaColor(dia.registros)}`}
                    >
                      <div className="mb-2 flex items-center gap-3">
                        {getDiaIcono(dia.registros)}
                        <div>
                          <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                            {dia.diaSemana} {dia.dia}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                        {dia.registros.map((r) => (
                          <div
                            key={r.materiaId}
                            className={`rounded-lg px-2 py-1.5 text-xs ${
                              r.estado === "presente" ? "bg-green-100 dark:bg-green-900/40 text-green-800" :
                              r.estado === "ausente" ? "bg-red-100 dark:bg-red-900/40 text-red-800" :
                              r.estado === "tarde" ? "bg-amber-100 text-amber-800" :
                              r.estado === "justificado" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-800" :
                              "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            <span className="mr-1">{r.icono}</span>
                            {r.materia}
                            {r.estado === "presente" && " ✅"}
                            {r.estado === "ausente" && " ❌"}
                            {r.estado === "tarde" && " ⏰"}
                            {r.estado === "justificado" && " 📝"}
                            {r.observacion && (
                              <span className="block text-gray-500 dark:text-gray-400 dark:text-gray-500">📝 {r.observacion}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-gray-800 p-4 text-right">
          <button onClick={onClose} className="btn-primary text-sm">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function Kpi({ value, label, color }: { value: string | number; label: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/30", green: "text-green-600 bg-green-50 dark:bg-green-900/30",
    red: "text-red-600 bg-red-50 dark:bg-red-900/30", amber: "text-amber-600 bg-amber-50",
    purple: "text-purple-600 bg-purple-50",
  };
  return (
    <div className={`rounded-xl p-3 text-center ${colors[color] ?? "bg-gray-50 dark:bg-gray-800"}`}>
      <p className="text-lg font-extrabold">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{label}</p>
    </div>
  );
}
