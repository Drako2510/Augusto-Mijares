import { create } from "zustand";

interface AppState {
  materiaActiva: string | null;
  anioActivo: string | null;
  seccionActiva: string | null;
  setContexto: (materia: string, anio: string, seccion: string) => void;
  limpiarContexto: () => void;
}

/**
 * Store global que mantiene la ruta pedagógica activa (materia > año > sección),
 * evitando tener que pasar props manualmente por cada nivel de navegación.
 */
export const useAppStore = create<AppState>((set) => ({
  materiaActiva: null,
  anioActivo: null,
  seccionActiva: null,
  setContexto: (materia, anio, seccion) =>
    set({ materiaActiva: materia, anioActivo: anio, seccionActiva: seccion }),
  limpiarContexto: () =>
    set({ materiaActiva: null, anioActivo: null, seccionActiva: null }),
}));
