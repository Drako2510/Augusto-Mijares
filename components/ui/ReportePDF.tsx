"use client";

import { toast } from "@/components/ui/Toast";

interface Props {
  nombreEstudiante: string;
  anio: string;
  seccion: string;
  asistencias: number;
  promedio: number;
  tareasPendientes: number;
  evaluacionesRealizadas: number;
}

/**
 * Botón que genera un PDF simple del historial del estudiante.
 * Usa window.print() como solución sin dependencias externas.
 */
export function ReportePDF({
  nombreEstudiante,
  anio,
  seccion,
  asistencias,
  promedio,
  tareasPendientes,
  evaluacionesRealizadas,
}: Props) {
  const imprimir = () => {
    const contenido = `
      <html>
      <head><title>Historial - ${nombreEstudiante}</title>
      <style>
        body { font-family: sans-serif; padding: 40px; max-width: 800px; margin: auto; }
        h1 { color: #1f2937; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f3f4f6; text-align: left; padding: 8px 12px; }
        td { padding: 8px 12px; border-top: 1px solid #e5e7eb; }
        .kpi { display: inline-block; margin: 10px 20px 10px 0; text-align: center; }
        .kpi-value { font-size: 24px; font-weight: bold; color: #2563eb; }
        .kpi-label { font-size: 12px; color: #6b7280; }
      </style></head>
      <body>
        <h1>📋 Historial de: ${nombreEstudiante}</h1>
        <p>📚 ${anio} "${seccion}" — Asistencia Plus</p>
        <div style="margin: 20px 0;">
          <div class="kpi"><div class="kpi-value">${asistencias}%</div><div class="kpi-label">Asistencia</div></div>
          <div class="kpi"><div class="kpi-value">${promedio}</div><div class="kpi-label">Promedio</div></div>
          <div class="kpi"><div class="kpi-value">${tareasPendientes}</div><div class="kpi-label">Tareas Pend.</div></div>
          <div class="kpi"><div class="kpi-value">${evaluacionesRealizadas}</div><div class="kpi-label">Evaluaciones</div></div>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 40px;">
          Generado por Asistencia Plus — ${new Date().toLocaleDateString("es")}
        </p>
      </body></html>
    `;
    const ventana = window.open("", "_blank");
    if (ventana) {
      ventana.document.write(contenido);
      ventana.document.close();
      ventana.print();
    } else {
      toast("Permite ventanas emergentes para imprimir", "error");
    }
  };

  return (
    <button
      onClick={imprimir}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 transition-all hover:bg-gray-100 dark:bg-gray-800 hover:border-gray-300 dark:border-gray-600"
    >
      🖨️ Imprimir / Descargar PDF
    </button>
  );
}
