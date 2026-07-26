/**
 * Utilidades para leer y escribir en localStorage de forma segura,
 * evitando errores en renderizado del lado del servidor (SSR).
 */

export function readFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`No se pudo leer la clave "${key}" de localStorage`, error);
    return fallback;
  }
}

export function writeToStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`No se pudo escribir la clave "${key}" en localStorage`, error);
  }
}

/** Construye una clave de almacenamiento segmentada por materia/año/sección. */
export function buildStorageKey(
  prefix: string,
  materiaId: string,
  anioId: string,
  seccionId: string
): string {
  return `${prefix}_${materiaId}_${anioId}_${seccionId}`;
}
