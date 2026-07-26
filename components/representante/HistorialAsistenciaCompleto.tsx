"use client";

import { useState, useEffect } from "react";

interface RegistroDia {
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
  registros: RegistroDia[];
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

interface MateriaOption {
  id: string;
  nombre: string;
  icono: string;
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface Props {
  estudianteId: string;
}

export function HistorialAsistenciaCompleto({ estudianteId }: Props) {
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [anio, setAnio] = useState(now.getFullYear());
  const [materiaId, setMateriaId] = useState("");
  const [historial, setHistorial] = useState<DiaHistorial[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [materias, setMaterias] = useState<MateriaOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!estudianteId) return;
    setLoading(true);
    const params = new URLSearchParams({
      estudianteId,
      mes: String(mes),
      anio: String(anio),
      ...(materiaId ? { materiaId } : {}),
    });
    fetch(`/api/asistencia/historial?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setHistorial(d.historial ?? []);
        setResumen(d.resumen ?? null);
        setMaterias(d.materias ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [estudianteId, mes, anio, materiaId]);

  const mesAnterior = () => {
    if (mes === 1) { setMes(12); setAnio(anio - 1); }
    else setMes(mes - 1);
  };
  const mesSiguiente = () => {
    if (mes === 12) { setMes(1); setAnio(anio + 1); }
    else setMes(mes + 1);
  };

  return (
    <div className="space-y-4">
      {/* Controles de navegación */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={mesAnterior} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-100 dark:bg-gray-800 transition">◀</button>
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200 min-w-[120px] text-center">
            {MESES[mes - 1]} {anio}
          </span>
          <button onClick={mesSiguiente} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-100 dark:bg-gray-800 transition">▶</button>
        </div>
        <select
          value={materiaId}
          onChange={(e) => setMateriaId(e.target.value)}
          className="rounded-lg border px-3 py-1.5 text-sm"
        >
          <option value="">Todas las materias</option>
          {materias.map((m) => (
            <option key={m.id} value={m.id}>{m.icono} {m.nombre}</option>
          ))}
        </select>
      </div>

      {/* Resumen estadístico */}
      {resumen && (
        <div className="grid grid-cols-5 gap-2 text-center">
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-2">
            <p className="text-lg font-extrabold text-blue-600">{resumen.porcentaje}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Asistencia</p>
          </div>
          <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-2">
            <p className="text-lg font-extrabold text-green-600">{resumen.presentes}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">✅ Presentes</p>
          </div>
          <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-2">
            <p className="text-lg font-extrabold text-red-600">{resumen.ausentes}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">❌ Ausentes</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-2">
            <p className="text-lg font-extrabold text-amber-600">{resumen.tardes}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">⏰ Tardes</p>
          </div>
          <div className="rounded-lg bg-purple-50 p-2">
            <p className="text-lg font-extrabold text-purple-600">{resumen.justificados}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">📝 Justif.</p>
          </div>
        </div>
      )}

      {/* Tabla del historial */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
        </div>
      ) : historial.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">Sin registros en este mes</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">Día</th>
                {historial[0]?.registros.map((r) => (
                  <th key={r.materiaId} className="px-2 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">
                    {r.icono}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {historial.map((dia) => (
                <tr key={dia.fecha} className="hover:bg-gray-50 dark:bg-gray-800">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="font-medium text-gray-700 dark:text-gray-200">{dia.dia}</span>
                    <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">{dia.diaSemana}</span>
                  </td>
                  {dia.registros.map((r) => (
                    <td key={r.materiaId} className="px-2 py-2 text-center" title={r.observacion ?? undefined}>
                      {r.estado === "presente" ? "✅" :
                       r.estado === "ausente" ? "❌" :
                       r.estado === "tarde" ? "⏰" :
                       r.estado === "justificado" ? "📝" : "🟡"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
        <span>✅ Presente</span>
        <span>❌ Ausente</span>
        <span>⏰ Tarde</span>
        <span>📝 Justificado</span>
        <span>🟡 Sin registro</span>
      </div>
    </div>
  );
}
