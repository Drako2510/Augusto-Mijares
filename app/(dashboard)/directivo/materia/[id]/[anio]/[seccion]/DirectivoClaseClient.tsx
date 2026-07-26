"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Anio, Materia, Seccion } from "@/data/seed";
import Breadcrumb from "@/components/Breadcrumb";
import AsistenciaTable from "@/components/AsistenciaTable";
import HistorialNotificaciones from "@/components/HistorialNotificaciones";
import CalendarioEvaluaciones from "@/components/CalendarioEvaluaciones";
import TareaForm from "@/components/TareaForm";
import { VerificadorClaveSecreta } from "@/components/directivo/VerificadorClaveSecreta";
import { useAsistencia } from "@/hooks/useAsistencia";
import { useNotificaciones } from "@/hooks/useNotificaciones";
import { useEvaluaciones } from "@/hooks/useEvaluaciones";
import { useClaveSecreta } from "@/hooks/useClaveSecreta";
import { useAppStore } from "@/store/useAppStore";
import toast from "react-hot-toast";

interface Props {
  materia: Materia;
  anio: Anio;
  seccion: Seccion;
  estudiantes: { id: string; nombre: string }[];
  asistenciasHoy: Record<string, string>;
}

const ESTADO_BADGE: Record<string, string> = {
  presente: "bg-green-100 text-green-700",
  ausente: "bg-red-100 text-red-700",
  tarde: "bg-amber-100 text-amber-700",
  justificado: "bg-blue-100 text-blue-700",
};

const ESTADO_LABEL: Record<string, string> = {
  presente: "✅ Presente",
  ausente: "❌ Ausente",
  tarde: "⏰ Tarde",
  justificado: "📝 Justificado",
};

export function DirectivoClaseClient({ materia, anio, seccion, estudiantes, asistenciasHoy }: Props) {
  const router = useRouter();
  const setContexto = useAppStore((s) => s.setContexto);
  const { modoEdicion, cerrarEdicion, validarClave } = useClaveSecreta({
    materiaId: materia.id,
    anio: anio.id,
    seccion: seccion.id,
  });
  const [mostrarVerificador, setMostrarVerificador] = useState(false);
  const [cambiosPendientes, setCambiosPendientes] = useState(false);
  const [guardado, setGuardado] = useState(false);

  // ── Advertencia al salir sin guardar ──────────────────────
  useEffect(() => {
    if (!cambiosPendientes) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [cambiosPendientes]);

  // Reset cambios al desmontar modo edición
  useEffect(() => {
    if (!modoEdicion) {
      setCambiosPendientes(false);
      setGuardado(false);
    }
  }, [modoEdicion]);

  useEffect(() => {
    setContexto(materia.id, anio.id, seccion.id);
  }, [materia.id, anio.id, seccion.id, setContexto]);

  const nombresEstudiantes = estudiantes.map((e) => e.nombre);

  const { historial, agregarNotificacion, limpiarHistorial } = useNotificaciones(
    materia.id, anio.id, seccion.id
  );

  const { asistencia, marcarAsistencia, contadores } = useAsistencia(
    materia.id, anio.id, seccion.id, nombresEstudiantes,
    (estudiante, estado) => {
      if (!modoEdicion) return;
      const etiquetas: Record<string, string> = {
        presente: "marcado como Presente ✅",
        ausente: "marcado como Ausente ❌",
        tarde: "marcado como Tarde ⏰",
        justificado: "marcado como Justificado 📝",
        sin_marcar: "desmarcado",
      };
      agregarNotificacion(
        `${estudiante} fue ${etiquetas[estado]} en ${materia.nombre} - ${anio.nombre} "${seccion.nombre}".`,
        "asistencia"
      );
    }
  );

  const { evaluaciones, agregarEvaluacion, eliminarEvaluacion } = useEvaluaciones(
    materia.id, anio.id, seccion.id
  );

  const marcarCambio = useCallback(() => {
    setCambiosPendientes(true);
    setGuardado(false);
  }, []);

  const handleAgregarEvaluacion = useCallback(
    (fechaISO: string, titulo: string, descripcion?: string, metodo?: string) => {
      if (!modoEdicion) { setMostrarVerificador(true); return; }
      agregarEvaluacion(fechaISO, titulo, descripcion, metodo);
      marcarCambio();
      toast.success("Evaluación agregada 📅");
    },
    [modoEdicion, agregarEvaluacion, marcarCambio]
  );

  const handleMarcar = useCallback(
    (estudiante: string, estado: Parameters<typeof marcarAsistencia>[1]) => {
      if (!modoEdicion) { setMostrarVerificador(true); return; }
      marcarAsistencia(estudiante, estado);
      marcarCambio();
    },
    [modoEdicion, marcarAsistencia, marcarCambio]
  );

  const handleEnviarTarea = useCallback(
    async (data: { titulo: string; descripcion: string; fechaEntrega: string }) => {
      if (!modoEdicion) { setMostrarVerificador(true); return; }

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
      marcarCambio();
      toast.success("Tarea enviada a los representantes 📨");
    },
    [modoEdicion, materia.id, materia.nombre, anio.id, anio.nombre, seccion.id, seccion.nombre, agregarNotificacion, marcarCambio]
  );

  const handleGuardar = useCallback(() => {
    setCambiosPendientes(false);
    setGuardado(true);
    toast.success("✅ Cambios guardados exitosamente", { duration: 4000 });
    // Disparar evento para que el representante vea los cambios
    window.dispatchEvent(new CustomEvent("dashboard:refresh"));
  }, []);

  const handleSalirSinGuardar = () => {
    if (cambiosPendientes) {
      const confirmar = window.confirm(
        "⚠️ Tienes cambios sin guardar.\n\n¿Deseas descartar los cambios y salir del modo edición?"
      );
      if (!confirmar) return;
    }
    cerrarEdicion();
    setCambiosPendientes(false);
    toast("Modo edición desactivado", { icon: "🔒" });
  };

  return (
    <>
      {mostrarVerificador && (
        <VerificadorClaveSecreta
          materiaId={materia.id}
          anio={anio.id}
          seccion={seccion.id}
          materiaNombre={materia.nombre}
          onSuccess={() => { setMostrarVerificador(false); toast.success("Modo edición activado 🔓"); }}
          onCancel={() => setMostrarVerificador(false)}
          onValidate={validarClave}
        />
      )}

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: "Panel Directivo", href: "/directivo" },
            { label: materia.nombre },
            { label: `${anio.nombre} "${seccion.nombre}"` },
          ]}
        />

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800 sm:text-3xl">
              {materia.icono} {materia.nombre} · {anio.nombre} · Sección {seccion.nombre}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {modoEdicion
                ? "🔓 Modo Edición Activado — Puedes modificar asistencia, evaluaciones y tareas."
                : "👁️ Modo Solo Lectura — Ingresa la clave secreta para habilitar la edición."}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {modoEdicion ? (
              <>
                <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-700">
                  🔓 Edición Activa
                </span>
                {cambiosPendientes && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 animate-pulse">
                    ⚠️ Cambios sin guardar
                  </span>
                )}
                {guardado && !cambiosPendientes && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                    ✅ Guardado
                  </span>
                )}
                {/* Botón Guardar */}
                <button
                  onClick={handleGuardar}
                  disabled={!cambiosPendientes}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                    cambiosPendientes
                      ? "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  💾 Guardar Cambios
                </button>
                {/* Botón Salir del modo edición */}
                <button
                  onClick={handleSalirSinGuardar}
                  className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
                >
                  🔒 Salir del Modo Edición
                </button>
              </>
            ) : (
              <button
                onClick={() => setMostrarVerificador(true)}
                className="btn-primary text-sm"
              >
                🔑 Ingresar Clave Secreta para Editar
              </button>
            )}
          </div>
        </div>

        {/* ── Lista de Estudiantes ── */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
            <h2 className="text-sm font-bold text-gray-700">👨‍🎓 Estudiantes ({estudiantes.length})</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {estudiantes.map((est, idx) => {
              const estadoHoy = asistenciasHoy[est.id] ?? "sin_marcar";
              return (
                <div key={est.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-gray-400 w-6">{idx + 1}.</span>
                    <span className="text-sm font-medium text-gray-800">{est.nombre}</span>
                    {estadoHoy !== "sin_marcar" && estadoHoy in ESTADO_BADGE && (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ESTADO_BADGE[estadoHoy]}`}>
                        {ESTADO_LABEL[estadoHoy]}
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/directivo/estudiante/${est.id}`}
                    className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition-all hover:bg-purple-100 hover:shadow-sm"
                  >
                    📊 Ver Historial
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Controles de Edición (solo visibles con clave) ── */}
        {modoEdicion && (
          <>
            <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-700">🛠️ Controles de Edición</h2>
              <div className="flex gap-2 flex-wrap">
                <span className="rounded-full bg-brand-green/10 px-3 py-1 text-xs font-bold text-brand-green">{contadores.presentes} P</span>
                <span className="rounded-full bg-brand-red/10 px-3 py-1 text-xs font-bold text-brand-red">{contadores.ausentes} A</span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">{contadores.tardes} T</span>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">{contadores.justificados} J</span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">{contadores.sinMarcar} sin marcar</span>
              </div>
            </header>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <section className="space-y-6 xl:col-span-2">
                <div>
                  <h3 className="mb-3 text-base font-bold text-gray-700">✅ Registro de Asistencia</h3>
                  <AsistenciaTable estudiantes={nombresEstudiantes} asistencia={asistencia} onMarcar={handleMarcar}
                    onJustificarDias={(est, dias) => {
                      if (!modoEdicion) { setMostrarVerificador(true); return; }
                      marcarAsistencia(est, "justificado");
                      agregarNotificacion(`${est} fue justificado por ${dias} día${dias > 1 ? "s" : ""} 📝 en ${materia.nombre} - ${anio.nombre} "${seccion.nombre}".`, "asistencia");
                      marcarCambio();
                      toast.success(`${est} justificado por ${dias} día${dias > 1 ? "s" : ""}`);
                    }}
                  />
                </div>
                <div>
                  <h3 className="mb-3 text-base font-bold text-gray-700">📅 Calendario de Evaluaciones</h3>
                  <CalendarioEvaluaciones evaluaciones={evaluaciones} onAgregar={handleAgregarEvaluacion}
                    onEliminar={(id) => { if (!modoEdicion) { setMostrarVerificador(true); return; } eliminarEvaluacion(id); marcarCambio(); }} />
                </div>
                <div>
                  <h3 className="mb-3 text-base font-bold text-gray-700">📨 Notificación de Tareas</h3>
                  <TareaForm onEnviar={handleEnviarTarea} />
                </div>
              </section>
              <aside className="xl:col-span-1">
                <div className="xl:sticky xl:top-6">
                  <h3 className="mb-3 text-base font-bold text-gray-700">🔔 Notificaciones</h3>
                  <HistorialNotificaciones historial={historial} onLimpiar={limpiarHistorial} />
                </div>
              </aside>
            </div>
          </>
        )}

        {/* Mensaje cuando no hay clave */}
        {!modoEdicion && (
          <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-8 text-center">
            <span className="text-4xl">🔒</span>
            <p className="mt-3 text-sm font-medium text-amber-700">Los controles de edición están bloqueados.</p>
            <p className="text-xs text-amber-500">Ingresa la clave secreta para desbloquear la edición de asistencia, evaluaciones y tareas.</p>
            <button onClick={() => setMostrarVerificador(true)} className="btn-primary mt-4">
              🔑 Ingresar Clave Secreta
            </button>
          </div>
        )}
      </main>
    </>
  );
}
