"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { Anio, Materia, Seccion } from "@/data/seed";
import Breadcrumb from "@/components/Breadcrumb";
import AsistenciaTable from "@/components/AsistenciaTable";
import HistorialNotificaciones from "@/components/HistorialNotificaciones";
import CalendarioEvaluaciones from "@/components/CalendarioEvaluaciones";
import TareaForm from "@/components/TareaForm";
import { GenerarClaveButton } from "@/components/profesor/GenerarClaveButton";
import { useAsistencia } from "@/hooks/useAsistencia";
import { useNotificaciones } from "@/hooks/useNotificaciones";
import { useEvaluaciones } from "@/hooks/useEvaluaciones";
import { useAppStore } from "@/store/useAppStore";
import { formatearFechaLarga } from "@/utils/formatters";
import { CalificacionesModal } from "@/components/profesor/CalificacionesModal";

interface Props {
  materia: Materia;
  anio: Anio;
  seccion: Seccion;
  estudiantesIniciales: string[];
  estudianteMap?: Record<string, string>; // nombre → id para API
}

export default function DashboardClient({
  materia,
  anio,
  seccion,
  estudiantesIniciales,
  estudianteMap,
}: Props) {
  const setContexto = useAppStore((s) => s.setContexto);
  const router = useRouter();
  const [mostrarAsistencia, setMostrarAsistencia] = useState(false);

  // Refrescar cada 3 segundos para mantener datos sincronizados
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 3000);
    return () => clearInterval(interval);
  }, [router]);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [mostrarCalificaciones, setMostrarCalificaciones] = useState(false);

  useEffect(() => {
    setContexto(materia.id, anio.id, seccion.id);
  }, [materia.id, anio.id, seccion.id, setContexto]);

  const { historial, agregarNotificacion, limpiarHistorial } = useNotificaciones(
    materia.id,
    anio.id,
    seccion.id
  );

  const { asistencia, marcarAsistencia, contadores } = useAsistencia(
    materia.id,
    anio.id,
    seccion.id,
    estudiantesIniciales,
    (estudiante, estado) => {
      const etiquetas: Record<string, string> = {
        presente: "marcado como Presente ✅",
        ausente: "marcado como Ausente ❌",
        tarde: "marcado como Tarde ⏰",
        justificado: "marcado como Justificado 📝",
        sin_marcar: "desmarcado",
      };
      agregarNotificacion(
        `${estudiante} fue ${etiquetas[estado] ?? estado} en ${materia.nombre} - ${anio.nombre} "${seccion.nombre}".`,
        "asistencia"
      );
    },
    estudianteMap
  );

  const { evaluaciones, agregarEvaluacion, eliminarEvaluacion, editarEvaluacion } = useEvaluaciones(
    materia.id,
    anio.id,
    seccion.id
  );

  function handleAgregarEvaluacion(
    fechaISO: string,
    titulo: string,
    descripcion?: string,
    metodo?: string
  ) {
    agregarEvaluacion(fechaISO, titulo, descripcion, metodo);
    agregarNotificacion(
      `📅 Nueva evaluación: ${titulo}${metodo ? ` (${metodo})` : ""} en ${materia.nombre} - ${anio.nombre} "${seccion.nombre}" (${formatearFechaLarga(fechaISO)}).`,
      "evaluacion"
    );
    toast.success("Evaluación agregada al calendario 📅");
  }

  function handleEditarEvaluacion(
    id: string,
    fechaISO: string,
    titulo: string,
    descripcion?: string,
    metodo?: string
  ) {
    editarEvaluacion(id, fechaISO, titulo, descripcion, metodo);
    toast.success("Evaluación actualizada ✏️");
  }

  const handleJustificarDias = (estudiante: string, dias: number) => {
    marcarAsistencia(estudiante, "justificado");
    agregarNotificacion(
      `${estudiante} fue justificado por ${dias} día${dias > 1 ? "s" : ""} 📝 en ${materia.nombre} - ${anio.nombre} "${seccion.nombre}".`,
      "asistencia"
    );
    toast.success(`${estudiante} justificado por ${dias} día${dias > 1 ? "s" : ""}`);
  };

  async function handleEnviarTarea(data: {
    titulo: string;
    descripcion: string;
    fechaEntrega: string;
  }) {
    // 1. Guardar en base de datos
    try {
      const res = await fetch("/api/tareas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materiaId: materia.id,
          anio: anio.id,
          seccion: seccion.id,
          titulo: data.titulo,
          descripcion: data.descripcion,
          fechaEntrega: data.fechaEntrega,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error("Error al guardar la tarea en el sistema");
      }
    } catch {
      toast.error("Error de conexión al guardar la tarea");
    }

    // 2. Agregar a notificaciones locales
    const mensaje = `📢 Nueva tarea en ${materia.nombre} - ${anio.nombre} "${seccion.nombre}": "${data.titulo}". Entrega: ${data.fechaEntrega}. ${data.descripcion}`;
    agregarNotificacion(mensaje, "tarea");
    toast.success("Tarea enviada a los representantes 📨");
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb
        items={[
          { label: materia.nombre, href: `/materia/${materia.id}` },
          { label: anio.nombre, href: `/materia/${materia.id}/${anio.id}` },
          { label: `Sección ${seccion.nombre}` },
        ]}
      />

      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 sm:text-3xl">
            {materia.icono} {materia.nombre} · {anio.nombre} · Sección{" "}
            {seccion.nombre}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
            Panel de asistencia, calendario de evaluaciones y tareas.
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <button
            onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
            className="relative rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            title="Notificaciones"
          >
            <span className="text-xl">🔔</span>
            {historial.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {historial.length > 9 ? "9+" : historial.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setMostrarCalificaciones(true)}
            className="inline-flex items-center gap-2 rounded-full bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-green-700 hover:shadow-lg transition-all"
          >
            📊 Evaluaciones
          </button>
          <GenerarClaveButton
            materiaId={materia.id}
            anio={anio.id}
            seccion={seccion.id}
            materiaNombre={materia.nombre}
          />
        </div>
      </header>

      <div>
        <section className="space-y-6">
          {/* Botón Registro de Asistencia */}
          <button
            onClick={() => setMostrarAsistencia(true)}
            className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm dark:shadow-gray-900/30 transition-all hover:shadow-lg dark:hover:shadow-gray-900/50 hover:-translate-y-1 hover:border-green-300 dark:hover:border-green-700 text-left"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/40 text-3xl">
                ✅
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Registro de Asistencia</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pasar lista y marcar asistencia de los estudiantes</p>
                <div className="flex gap-2 mt-2">
                  <span className="rounded-full bg-green-100 dark:bg-green-900/40 px-2 py-0.5 text-xs font-bold text-green-700 dark:text-green-300">{contadores.presentes} P</span>
                  <span className="rounded-full bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-xs font-bold text-red-700 dark:text-red-300">{contadores.ausentes} A</span>
                  <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">{contadores.tardes} T</span>
                  <span className="rounded-full bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300">{contadores.justificados} J</span>
                  <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-bold text-gray-500 dark:text-gray-400">{contadores.sinMarcar} sin marcar</span>
                </div>
              </div>
            </div>
          </button>

          {/* Modal de Asistencia */}
          {mostrarAsistencia && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setMostrarAsistencia(false)}>
              <div className="w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl animate-scaleIn" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/40 text-xl">✅</div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Registro de Asistencia</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{materia.nombre} · {anio.nombre} · Sección {seccion.nombre}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{contadores.presentes} P</span>
                    <span className="text-xs text-gray-400">{contadores.ausentes} A</span>
                    <span className="text-xs text-gray-400">{contadores.tardes} T</span>
                    <span className="text-xs text-gray-400">{contadores.justificados} J</span>
                    <button onClick={() => setMostrarAsistencia(false)} className="rounded-full p-1 text-gray-400 hover:text-gray-600 ml-2">✕</button>
                  </div>
                </div>
                <div className="p-6">
                  <AsistenciaTable
                    estudiantes={estudiantesIniciales}
                    asistencia={asistencia}
                    onMarcar={marcarAsistencia}
                    onJustificarDias={handleJustificarDias}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-3 text-lg font-bold text-gray-700 dark:text-gray-200">
              📅 Calendario de Evaluaciones
            </h2>
            <CalendarioEvaluaciones
              evaluaciones={evaluaciones}
              onAgregar={handleAgregarEvaluacion}
              onEliminar={eliminarEvaluacion}
              onEditar={handleEditarEvaluacion}
              materiaNombre={materia.nombre}
              materiaId={materia.id}
              anio={anio.id}
              seccion={seccion.id}
              puedeEliminar={false}
            />
          </div>

          <div>
            <h2 className="mb-3 text-lg font-bold text-gray-700 dark:text-gray-200">
              📨 Notificación Masiva de Tareas
            </h2>
            <TareaForm
              onEnviar={handleEnviarTarea}
            />
          </div>
        </section>
      </div>

      {/* Modal de Calificaciones */}
      {mostrarCalificaciones && (
        <CalificacionesModal
          materiaId={materia.id}
          materiaNombre={materia.nombre}
          anio={anio.id}
          seccion={seccion.id}
          onClose={() => setMostrarCalificaciones(false)}
        />
      )}

      {/* Modal de Notificaciones */}
      {mostrarNotificaciones && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-20" onClick={() => setMostrarNotificaciones(false)}>
          <div
            className="w-full max-w-sm max-h-[70vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                🔔 Notificaciones
              </h3>
              <div className="flex items-center gap-2">
                {historial.length > 0 && (
                  <button onClick={limpiarHistorial} className="text-xs font-medium text-blue-500 hover:text-blue-700">
                    Limpiar
                  </button>
                )}
                <button onClick={() => setMostrarNotificaciones(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </div>
            <div className="p-3">
              <HistorialNotificaciones
                historial={historial}
                onLimpiar={limpiarHistorial}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
