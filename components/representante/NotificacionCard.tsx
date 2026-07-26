"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface NotificacionData {
  presente?: boolean;
  fecha?: string;
  descripcion?: string;
  fechaEntrega?: string;
  evaluacionTitulo?: string;
  [key: string]: unknown;
}

interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  estudiante?: { nombre: string; anio?: string; seccion?: string } | null;
  materia?: { nombre: string; icono?: string } | null;
  data?: NotificacionData | null;
}

interface Props {
  notificacion: Notificacion;
  onLeer: () => void;
}

export function NotificacionCard({ notificacion, onLeer }: Props) {
  const { tipo, titulo, mensaje, fecha, leida, estudiante, materia, data } = notificacion;

  const getIcono = () => {
    switch (tipo) {
      case "ASISTENCIA":
        return data?.presente ? "✅" : "❌";
      case "EVALUACION":
        return "📝";
      case "TAREA":
        return "📚";
      default:
        return "📢";
    }
  };

  const getColor = () => {
    switch (tipo) {
      case "ASISTENCIA":
        return data?.presente ? "border-green-500" : "border-red-500";
      case "EVALUACION":
        return "border-orange-500";
      case "TAREA":
        return "border-blue-500";
      default:
        return "border-gray-500";
    }
  };

  let tiempoRelativo = "";
  try {
    tiempoRelativo = formatDistanceToNow(new Date(fecha), {
      addSuffix: true,
      locale: es,
    });
  } catch {
    tiempoRelativo = new Date(fecha).toLocaleString("es");
  }

  return (
    <div
      onClick={onLeer}
      className={`border-l-4 ${getColor()} bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm dark:shadow-gray-900/30 transition-all hover:shadow-md dark:shadow-gray-900/40 cursor-pointer ${
        !leida ? "bg-blue-50 dark:bg-blue-900/30" : ""
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getIcono()}</span>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{titulo}</h3>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">
          {tiempoRelativo}
        </span>
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-200 mt-1">{mensaje}</p>

      {(estudiante || materia) && (
        <div className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-2 flex gap-4">
          {estudiante && (
            <span>
              👨‍🎓 {estudiante.nombre}
            </span>
          )}
          {materia && (
            <span>
              📚 {materia.icono} {materia.nombre}
            </span>
          )}
        </div>
      )}

      {!leida && (
        <div className="mt-2 flex justify-end">
          <span className="text-xs text-blue-600 font-medium">• Nuevo</span>
        </div>
      )}
    </div>
  );
}
