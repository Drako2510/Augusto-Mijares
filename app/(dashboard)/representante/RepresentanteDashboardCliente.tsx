"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "@/hooks/useSession";
import { useNotificacionesRepresentante } from "@/hooks/useNotificacionesRepresentante";
import { useEstudianteDashboard } from "@/hooks/useEstudianteDashboard";
import { EstudianteCard } from "@/components/representante/EstudianteCard";
import { NotificacionCard } from "@/components/representante/NotificacionCard";
import { HorarioRepresentanteModal } from "@/components/representante/HorarioRepresentanteModal";
import { PagoMensualidadModal } from "@/components/representante/PagoMensualidadModal";

interface HijoInfo {
  id: string;
  nombre: string;
  anio: string;
  seccion: string;
}

interface Props {
  hijos: HijoInfo[];
}

export function RepresentanteDashboardCliente({ hijos }: Props) {
  const { user } = useSession();
  const {
    notificaciones,
    noLeidas,
    conectado,
    marcarLeida,
    cantidadNoLeidas,
    marcarTodasLeidas,
  } = useNotificacionesRepresentante();

  const [selectedId, setSelectedId] = useState<string>(hijos[0]?.id ?? "");
  const { data, loading, refetch } = useEstudianteDashboard(selectedId);
  const [mostrarHorario, setMostrarHorario] = useState(false);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [mostrarPago, setMostrarPago] = useState(false);

  const selectedHijo = hijos.find((h) => h.id === selectedId);

  // Notificación flotante (aparece 5 segundos, solo nuevas)
  const [floatingMsg, setFloatingMsg] = useState<string | null>(null);
  const shownIds = useRef<Set<string>>(new Set());
  const initialLoad = useRef(true);

  useEffect(() => {
    // En la carga inicial, registrar todos los IDs existentes (no mostrar toast)
    if (initialLoad.current) {
      noLeidas.forEach((n) => shownIds.current.add(n.id));
      initialLoad.current = false;
      return;
    }
    // Solo mostrar toast para notificaciones realmente nuevas
    const nuevas = noLeidas.filter((n) => !shownIds.current.has(n.id));
    if (nuevas.length > 0) {
      nuevas.forEach((n) => shownIds.current.add(n.id));
      setFloatingMsg(nuevas[0].titulo || nuevas[0].mensaje);
      const timer = setTimeout(() => setFloatingMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [noLeidas]);

  return (
    <div>
      {/* Notificación flotante */}
      {floatingMsg && (
        <div className="fixed top-20 right-4 z-50 max-w-sm animate-slideDown bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-4 py-3 flex items-start gap-3">
          <span className="text-lg">🔔</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{floatingMsg}</p>
          </div>
          <button onClick={() => setFloatingMsg(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">✕</button>
        </div>
      )}

      {/* Modal de Pago de Mensualidad */}
      {mostrarPago && selectedHijo && (
        <PagoMensualidadModal
          estudianteId={selectedHijo.id}
          estudianteNombre={selectedHijo.nombre}
          estudianteAnio={selectedHijo.anio}
          estudianteSeccion={selectedHijo.seccion}
          onClose={() => setMostrarPago(false)}
        />
      )}

      {/* Modal de Horario */}
      {mostrarHorario && selectedHijo && (
        <HorarioRepresentanteModal
          anio={selectedHijo.anio}
          seccion={selectedHijo.seccion}
          onClose={() => setMostrarHorario(false)}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 sm:text-3xl">
            👋 Hola, {user?.nombre || "Representante"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
            {conectado ? (
              <span className="text-green-600">🟢 Conectado en tiempo real</span>
            ) : (
              <span className="text-red-600">🔴 Reconectando...</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Ver Horario */}
          <button
            onClick={() => setMostrarHorario(true)}
            disabled={!selectedHijo}
            className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/30 px-3 py-2 text-sm font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors disabled:opacity-50"
            title="Ver horario de clases"
          >
            📅 <span className="hidden sm:inline">Ver Horario</span>
          </button>

          {/* Pago de Mensualidad */}
          <button
            onClick={() => setMostrarPago(true)}
            disabled={!selectedHijo}
            className="inline-flex items-center gap-1.5 rounded-full border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30 px-3 py-2 text-sm font-semibold text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50"
            title="Pago de mensualidad"
          >
            💰 <span className="hidden sm:inline">Pago de Mensualidad</span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => refetch()}
            className="rounded-full border border-gray-200 dark:border-gray-700 p-2 hover:bg-gray-100 dark:bg-gray-800 transition"
            title="Actualizar datos"
          >
            <span className="text-lg">🔄</span>
          </button>

          {/* Campana */}
          <button
            onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
            className="relative"
          >
            <span className="text-2xl">🔔</span>
            {cantidadNoLeidas > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white animate-pulse">
                {cantidadNoLeidas > 9 ? "9+" : cantidadNoLeidas}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Selector de hijo */}
      {hijos.length > 0 && (
        <div className="mb-6">
          <label className="mb-1 block text-sm font-semibold text-gray-600 dark:text-gray-300">
            👨‍🎓 Seleccionar hijo
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full sm:w-64 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            {hijos.map((h) => (
              <option key={h.id} value={h.id}>
                {h.nombre} — {h.anio} &quot;{h.seccion}&quot;
              </option>
            ))}
          </select>
        </div>
      )}

      {hijos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-12 text-center">
          <span className="text-4xl">📭</span>
          <p className="mt-3 text-gray-500 dark:text-gray-400 dark:text-gray-500">
            No tienes hijos registrados en el sistema.
          </p>
        </div>
      ) : (
        <div>
          {/* Contenido principal: EstudianteCard */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            </div>
          ) : selectedHijo ? (
            <EstudianteCard
              estudiante={selectedHijo}
              asistencia={data.asistencia}
              evaluaciones={data.evaluaciones}
              tareas={data.tareas}
              loading={loading}
            />
          ) : null}

          {/* Modal de notificaciones (campana) */}
          {mostrarNotificaciones && (
            <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-20" onClick={() => setMostrarNotificaciones(false)}>
              <div
                className="w-full max-w-sm max-h-[70vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 animate-slideUp"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                  <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    🔔 Notificaciones
                  </h3>
                  <div className="flex items-center gap-2">
                    {cantidadNoLeidas > 0 && (
                      <button onClick={marcarTodasLeidas} className="text-xs font-medium text-blue-500 hover:text-blue-700 dark:text-blue-300">
                        Marcar todas leídas
                      </button>
                    )}
                    <button onClick={() => setMostrarNotificaciones(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  {notificaciones.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">No hay notificaciones</p>
                  ) : (
                    notificaciones.slice(0, 20).map((n) => (
                      <NotificacionCard
                        key={n.id}
                        notificacion={n as any}
                        onLeer={() => marcarLeida(n.id)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
