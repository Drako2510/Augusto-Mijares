import { create } from "zustand";

interface CambioPendiente {
  id: string;
  tipo: "ASISTENCIA" | "EVALUACION" | "TAREA";
  accion: "CREAR" | "ACTUALIZAR" | "ELIMINAR";
  datos: Record<string, unknown>;
  timestamp: Date;
}

interface EdicionState {
  modoEdicion: boolean;
  claveValidada: boolean;
  materiaId: string | null;
  anio: string | null;
  seccion: string | null;
  cambiosPendientes: CambioPendiente[];
  tieneCambios: boolean;

  activarEdicion: (materiaId: string, anio: string, seccion: string) => void;
  desactivarEdicion: () => void;
  agregarCambio: (cambio: CambioPendiente) => void;
  limpiarCambios: () => void;
  marcarGuardado: () => void;
  tieneCambiosSinGuardar: () => boolean;
}

export const useEdicionStore = create<EdicionState>((set, get) => ({
  modoEdicion: false,
  claveValidada: false,
  materiaId: null,
  anio: null,
  seccion: null,
  cambiosPendientes: [],
  tieneCambios: false,

  activarEdicion: (materiaId, anio, seccion) =>
    set({
      modoEdicion: true,
      claveValidada: true,
      materiaId,
      anio,
      seccion,
      cambiosPendientes: [],
      tieneCambios: false,
    }),

  desactivarEdicion: () =>
    set({
      modoEdicion: false,
      claveValidada: false,
      materiaId: null,
      anio: null,
      seccion: null,
      cambiosPendientes: [],
      tieneCambios: false,
    }),

  agregarCambio: (cambio) =>
    set((state) => ({
      cambiosPendientes: [...state.cambiosPendientes, cambio],
      tieneCambios: true,
    })),

  limpiarCambios: () =>
    set({ cambiosPendientes: [], tieneCambios: false }),

  marcarGuardado: () =>
    set({ cambiosPendientes: [], tieneCambios: false }),

  tieneCambiosSinGuardar: () =>
    get().tieneCambios && get().cambiosPendientes.length > 0,
}));
