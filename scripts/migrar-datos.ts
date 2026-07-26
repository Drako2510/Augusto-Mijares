/**
 * Script de migración browser-side: lee datos de localStorage y los envía
 * al endpoint /api/migrar para insertarlos en la BD.
 *
 * Se ejecuta desde el navegador (NO desde Node). Lo llama MigracionBanner.
 *
 * Estrategia híbrida:
 * - Si el usuario está logueado → migrar a BD.
 * - Mantiene copia en localStorage como respaldo (no se borra).
 */

export interface DatosLocalStorage {
  asistencias: Record<string, unknown[]>;
  evaluaciones: Record<string, unknown[]>;
  tareas: Record<string, unknown[]>;
  notificaciones: Record<string, unknown[]>;
}

const MATERIAS = ["matematicas", "lengua", "ciencias", "historia", "ingles"];
const ANIOS = ["1ro", "2do", "3ro", "4to", "5to"];
const SECCIONES = ["A", "B", "C", "D"];

function buildKey(prefix: string, materia: string, anio: string, seccion: string) {
  return `${prefix}_${materia}_${anio}_${seccion}`;
}

/** Lee todos los datos relevantes de localStorage */
export function leerDatosLocalStorage(): DatosLocalStorage {
  const asistencias: Record<string, unknown[]> = {};
  const evaluaciones: Record<string, unknown[]> = {};
  const tareas: Record<string, unknown[]> = {};
  const notificaciones: Record<string, unknown[]> = {};

  for (const materia of MATERIAS) {
    for (const anio of ANIOS) {
      for (const seccion of SECCIONES) {
        const keyAsis = buildKey("asistencias", materia, anio, seccion);
        const keyEval = buildKey("evaluaciones", materia, anio, seccion);
        const keyTareas = buildKey("tareas", materia, anio, seccion);
        const keyNotif = buildKey("historial_notificaciones", materia, anio, seccion);

        try {
          const raw = localStorage.getItem(keyAsis);
          if (raw) asistencias[keyAsis] = JSON.parse(raw);
        } catch {}
        try {
          const raw = localStorage.getItem(keyEval);
          if (raw) evaluaciones[keyEval] = JSON.parse(raw);
        } catch {}
        try {
          const raw = localStorage.getItem(keyTareas);
          if (raw) tareas[keyTareas] = JSON.parse(raw);
        } catch {}
        try {
          const raw = localStorage.getItem(keyNotif);
          if (raw) notificaciones[keyNotif] = JSON.parse(raw);
        } catch {}
      }
    }
  }

  return { asistencias, evaluaciones, tareas, notificaciones };
}

/** Envía los datos a la API de migración */
export async function migrarABd(datos: DatosLocalStorage): Promise<{
  success: boolean;
  total: number;
  message?: string;
}> {
  const res = await fetch("/api/migrar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });

  const data = await res.json();
  return data;
}

/** Marca como migrado en localStorage */
export function marcarComoMigrado(): void {
  localStorage.setItem("datos_migrados", "true");
  localStorage.setItem("fecha_migracion", new Date().toISOString());
}

/** Verifica si los datos ya fueron migrados */
export function yaMigrado(): boolean {
  return localStorage.getItem("datos_migrados") === "true";
}

/** Verifica si hay datos para migrar */
export function hayDatosParaMigrar(): boolean {
  const datos = leerDatosLocalStorage();
  return (
    Object.keys(datos.asistencias).length > 0 ||
    Object.keys(datos.evaluaciones).length > 0 ||
    Object.keys(datos.tareas).length > 0 ||
    Object.keys(datos.notificaciones).length > 0
  );
}
