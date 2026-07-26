"use client";

import { useNotificacionesRepresentante } from "@/hooks/useNotificacionesRepresentante";

const ICONOS: Record<string, string> = {
  ASISTENCIA: "📊",
  EVALUACION: "📝",
  TAREA: "📨",
  SISTEMA: "ℹ️",
};

/**
 * Componente de notificaciones en tiempo real.
 * Usa useNotificacionesRepresentante (SSE + REST).
 * Muestra badge de no leídas, indicador de conexión, y lista scrollable.
 */
export function NotificacionesEnVivo() {
  const {
    notificaciones,
    noLeidas,
    conectado,
    marcarLeida,
    marcarTodasLeidas,
    cantidadNoLeidas,
  } = useNotificacionesRepresentante();

  if (notificaciones.length === 0) {
    return (
      <div className="mb-8 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 shadow-sm text-center">
        <p className="text-sm text-gray-400">🔔 No hay notificaciones</p>
        <p className="text-xs text-gray-300 mt-1">
          {conectado ? "🟢 Esperando nuevas notificaciones..." : "🔴 Reconectando..."}
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 shadow-sm">
      {/* Cabecera */}
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-bold text-blue-700">🔔 Notificaciones</h3>

        {cantidadNoLeidas > 0 && (
          <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-red-500 px-1.5 text-xs font-bold text-white animate-bounce-in">
            {cantidadNoLeidas}
          </span>
        )}

        {cantidadNoLeidas > 0 && (
          <button
            onClick={marcarTodasLeidas}
            className="ml-auto text-xs font-medium text-blue-500 hover:text-blue-700 transition-colors"
          >
            Marcar todas leídas
          </button>
        )}

        <span className="ml-auto flex items-center gap-1 text-xs font-normal">
          <span
            className={`h-2 w-2 rounded-full ${conectado ? "bg-green-500 animate-pulse" : "bg-red-400"}`}
          />
          <span className="text-blue-400">{conectado ? "En vivo" : "Reconectando..."}</span>
        </span>
      </div>

      {/* Lista */}
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {notificaciones.map((n) => (
          <div
            key={n.id}
            onClick={() => !n.leida && marcarLeida(n.id)}
            className={`flex items-start gap-2 rounded-lg px-3 py-2 text-sm shadow-sm transition-all cursor-pointer ${
              n.leida
                ? "bg-white/60"
                : "bg-white border-l-2 border-blue-500 hover:bg-blue-50"
            }`}
          >
            <span className="mt-0.5">{ICONOS[n.tipo] ?? "📌"}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700 truncate">
                  {n.titulo}
                </span>
                {!n.leida && (
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-gray-500">{n.mensaje}</p>
              {n.estudiante && (
                <p className="text-xs text-gray-400 mt-0.5">
                  👨‍🎓 {n.estudiante.nombre}
                  {n.materia && <> · {n.materia.nombre}</>}
                </p>
              )}
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {new Date(n.fecha).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
