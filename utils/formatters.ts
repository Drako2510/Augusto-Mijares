import { format } from "date-fns";
import { es } from "date-fns/locale";

/** Formatea una hora legible en español, ej: 14:35 */
export function formatearHora(fecha: Date = new Date()): string {
  return format(fecha, "HH:mm", { locale: es });
}

/** Formatea una fecha legible en español, ej: 12 de julio de 2026 */
export function formatearFechaLarga(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return format(d, "d 'de' MMMM 'de' yyyy", { locale: es });
}

/** Formatea una fecha corta, ej: 12/07/2026 */
export function formatearFechaCorta(fecha: Date | string): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return format(d, "dd/MM/yyyy", { locale: es });
}

/** Genera un id único simple basado en timestamp + azar. */
export function generarId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
