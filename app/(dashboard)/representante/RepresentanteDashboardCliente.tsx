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
  const [mostrarPago, setMostrarPago] = useState(false);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);

  const selectedHijo = hijos.find((h) => h.id === selectedId);

  // Listen for sidebar events
  useEffect(() => {
    const onHorario = () => setMostrarHorario(true);
    const onPago = () => setMostrarPago(true);
    window.addEventListener("rep:verHorario", onHorario);
    window.addEventListener("rep:pagoMensualidad", onPago);
    return () => {
      window.removeEventListener("rep:verHorario", onHorario);
      window.removeEventListener("rep:pagoMensualidad", onPago);
    };
  }, []);

  // Floating notification toast
  const [floatingMsg, setFloatingMsg] = useState<string | null>(null);
  const shownIds = useRef<Set<string>>(new Set());
  const initialLoad = useRef(true);

  useEffect(() => {
    if (initialLoad.current) {
      noLeidas.forEach((n) => shownIds.current.add(n.id));
      initialLoad.current = false;
      return;
    }
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
        <div className="fixed top-4 right-4 z-50 max-w-xs animate-slideDown bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-4 py-3 flex items-start gap-3">
          <span className="text-lg">🔔</span>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{floatingMsg}</p>
          <button onClick={() => setFloatingMsg(null)} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {/* Modals */}
      {mostrarHorario && selectedHijo && (
        <HorarioRepresentanteModal anio={selectedHijo.anio} seccion={selectedHijo.seccion} onClose={() => setMostrarHorario(false)} />
      )}
      {mostrarPago && selectedHijo && (
        <PagoMensualidadModal estudianteId={selectedHijo.id} estudianteNombre={selectedHijo.nombre} estudianteAnio={selectedHijo.anio} estudianteSeccion={selectedHijo.seccion} onClose={() => setMostrarPago(false)} />
      )}

      {/* Header */}
      <div className="mb-4 xl:mb-8 xl:flex xl:justify-center xl:px-6">
        <div className="xl:w-full xl:max-w-3xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl xl:text-3xl font-extrabold text-gray-800 dark:text-gray-100">
              👋 Hola, {user?.nombre?.split(" ")[0] || "Representante"}
            </h1>
            <p className="text-xs sm:text-sm xl:text-base text-gray-500 dark:text-gray-400">
              {conectado ? "🟢 Conectado" : "🔴 Reconectando..."}
            </p>
          </div>

          {/* Campana + Refresh */}
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="rounded-full p-2 xl:p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition" title="Actualizar">
              <span className="text-lg xl:text-xl">🔄</span>
            </button>
            <button onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)} className="relative p-2 xl:p-3">
              <span className="text-2xl xl:text-3xl">🔔</span>
              {cantidadNoLeidas > 0 && (
                <span className="absolute top-0 right-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                  {cantidadNoLeidas > 9 ? "9+" : cantidadNoLeidas}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {hijos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-12 text-center">
          <span className="text-4xl">📭</span>
          <p className="mt-3 text-gray-500 dark:text-gray-400">No tienes hijos registrados en el sistema.</p>
        </div>
      ) : (
        <div>
          {loading ? (
            <div className="flex justify-center py-20"><div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" /></div>
          ) : selectedHijo ? (
            <div className="xl:flex xl:justify-center xl:px-6">
              <div className="xl:w-full xl:max-w-3xl">
                {/* Selector de hijo centrado sobre la card */}
                <div className="mb-4">
                  <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}
                    className="w-full rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-3 xl:text-base text-sm font-medium text-gray-700 dark:text-gray-200 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                    {hijos.map((h) => (
                      <option key={h.id} value={h.id}>{h.nombre} — {h.anio} &quot;{h.seccion}&quot;</option>
                    ))}
                  </select>
                </div>
                <EstudianteCard estudiante={selectedHijo} asistencia={data.asistencia} evaluaciones={data.evaluaciones} tareas={data.tareas} loading={loading} />
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Modal notificaciones */}
      {mostrarNotificaciones && (
        <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pt-16" onClick={() => setMostrarNotificaciones(false)}>
          <div className="w-full max-w-sm max-h-[70vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-700 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-800 dark:text-gray-100">🔔 Notificaciones</h3>
              <div className="flex items-center gap-2">
                {cantidadNoLeidas > 0 && (
                  <button onClick={marcarTodasLeidas} className="text-xs font-medium text-blue-500">Marcar todas</button>
                )}
                <button onClick={() => setMostrarNotificaciones(false)} className="text-gray-400">✕</button>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {notificaciones.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No hay notificaciones</p>
              ) : (
                notificaciones.slice(0, 20).map((n) => (
                  <NotificacionCard key={n.id} notificacion={n as any} onLeer={() => marcarLeida(n.id)} />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
