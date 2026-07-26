"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  HistorialAsistencias,
  HistorialEvaluaciones,
  HistorialTareas,
} from "@/components/directivo/HistorialEstudiante";
import { ReportePDF } from "@/components/ui/ReportePDF";
import { Modal } from "@/components/ui/Modal";

interface Props {
  estudianteId: string;
}

interface HistorialData {
  estudiante: {
    id: string;
    nombre: string;
    anio: string;
    seccion: string;
    fechaNacimiento: string | null;
    activo: boolean;
  };
  asistencias: Array<{
    id: string;
    fecha: string;
    materia: string;
    icono: string;
    estado: string;
  }>;
  evaluaciones: Array<{
    id: string;
    fecha: string;
    materia: string;
    icono: string;
    titulo: string;
    calificacion: number;
  }>;
  tareas: Array<{
    id: string;
    materia: string;
    icono: string;
    titulo: string;
    descripcion: string;
    fechaEntrega: string;
  }>;
}

export function HistorialEstudianteContainer({ estudianteId }: Props) {
  const router = useRouter();
  const [data, setData] = useState<HistorialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const res = await fetch(`/api/directivo/historial-estudiante/${estudianteId}`);
        if (!res.ok) throw new Error("Error al cargar datos");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [estudianteId]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="text-sm text-gray-400">Cargando historial...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <span className="text-4xl">⚠️</span>
          <p className="mt-2 text-gray-500">{error || "No se encontró el estudiante"}</p>
          <button onClick={() => router.back()} className="btn-secondary mt-3 text-sm">
            ⬅️ Volver
          </button>
        </div>
      </div>
    );
  }

  const { estudiante, asistencias, evaluaciones, tareas } = data;

  const totalDias = asistencias.length || 1;
  const diasPresente = asistencias.filter((a) => a.estado === "presente").length;
  const porcentajeAsistencia = Math.round((diasPresente / totalDias) * 100);
  const promedio =
    evaluaciones.length > 0
      ? Math.round(
          (evaluaciones.reduce((s, ev) => s + ev.calificacion, 0) / evaluaciones.length) * 10
        ) / 10
      : 0;

  return (
    <>
      {/* Cabecera */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white text-xl font-bold shadow-md">
              {estudiante.nombre.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-800">
                📋 Historial de: {estudiante.nombre}
              </h1>
              <p className="text-sm text-gray-500">
                📚 {estudiante.anio} &quot;{estudiante.seccion}&quot;
                {estudiante.fechaNacimiento && (
                  <> · 🎂 {new Date(estudiante.fechaNacimiento).toLocaleDateString("es")}</>
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setModalAbierto(true)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100">
              🖨️ Imprimir / PDF
            </button>
            <button onClick={() => router.back()} className="btn-secondary text-sm">
              ⬅️ Volver
            </button>
          </div>
        </div>
      </div>

      {/* ── Resumen KPIs ── */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard value={`${porcentajeAsistencia}%`} label="Asistencia" detail={`${diasPresente}/${totalDias} días`} color="blue" />
        <KpiCard value={String(promedio)} label="Promedio" detail={`${evaluaciones.length} evaluaciones`} color="green" />
        <KpiCard value={String(tareas.length)} label="Tareas Pend." detail="por entregar" color="amber" />
        <KpiCard value={String(evaluaciones.length)} label="Evaluaciones" detail="realizadas" color="purple" />
      </div>

      {/* ── Tablas ── */}
      <div className="space-y-8">
        <Section title="📅 Asistencias (Últimos 30 días)">
          <HistorialAsistencias asistencias={asistencias.map((a) => ({
            ...a,
            fecha: new Date(a.fecha).toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" }),
          }))} />
        </Section>

        <Section title="📝 Evaluaciones">
          <HistorialEvaluaciones evaluaciones={evaluaciones.map((ev) => ({
            ...ev,
            fecha: new Date(ev.fecha).toLocaleDateString("es"),
          }))} />
        </Section>

        <Section title="📄 Tareas Pendientes">
          <HistorialTareas tareas={tareas.map((t) => ({
            ...t,
            fechaEntrega: new Date(t.fechaEntrega).toLocaleDateString("es"),
          }))} />
        </Section>
      </div>

      {/* Modal de impresión */}
      <Modal open={modalAbierto} onClose={() => setModalAbierto(false)} title="🖨️ Imprimir Historial">
        <div className="space-y-4 text-center">
          <p className="text-sm text-gray-500">
            Se abrirá una ventana de impresión con el resumen de {estudiante.nombre}.
          </p>
          <div className="flex justify-center gap-3">
            <ReportePDF
              nombreEstudiante={estudiante.nombre}
              anio={estudiante.anio}
              seccion={estudiante.seccion}
              asistencias={porcentajeAsistencia}
              promedio={promedio}
              tareasPendientes={tareas.length}
              evaluacionesRealizadas={evaluaciones.length}
            />
            <button onClick={() => setModalAbierto(false)} className="btn-secondary text-sm">
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ─── Sub-componentes ─── */

function KpiCard({ value, label, detail, color }: {
  value: string; label: string; detail: string;
  color: "blue" | "green" | "amber" | "purple";
}) {
  const colors: Record<string, string> = {
    blue: "text-blue-600", green: "text-green-600", amber: "text-amber-600", purple: "text-purple-600",
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
      <p className={`text-2xl font-extrabold ${colors[color]}`}>{value}</p>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xs text-gray-400 mt-1">{detail}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
        <h2 className="text-sm font-bold text-gray-700">{title}</h2>
      </div>
      {children}
    </div>
  );
}
