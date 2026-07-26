"use client";

import type { NotificacionItem } from "@/hooks/useNotificaciones";
import { FiBell, FiTrash2 } from "react-icons/fi";

interface Props {
  historial: NotificacionItem[];
  onLimpiar: () => void;
}

const iconoPorTipo: Record<NotificacionItem["tipo"], string> = {
  asistencia: "🔔",
  tarea: "📢",
  evaluacion: "📅",
};

export default function HistorialNotificaciones({ historial, onLimpiar }: Props) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm dark:shadow-gray-900/30">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200">
          <FiBell className="h-5 w-5 text-brand-orange" />
          Historial en tiempo real
        </h3>
        {historial.length > 0 && (
          <button
            type="button"
            onClick={onLimpiar}
            className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-brand-red transition-colors"
          >
            <FiTrash2 className="h-3.5 w-3.5" />
            Limpiar
          </button>
        )}
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto max-h-96 pr-1">
        {historial.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">
            Aún no hay notificaciones registradas para esta sección.
          </p>
        ) : (
          historial.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm"
            >
              <div className="flex items-start gap-2">
                <span>{iconoPorTipo[item.tipo]}</span>
                <div className="flex-1">
                  <p className="text-gray-700 dark:text-gray-200">{item.mensaje}</p>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{item.hora}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
