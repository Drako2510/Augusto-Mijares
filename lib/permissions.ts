/**
 * Sistema de permisos RBAC (Role-Based Access Control).
 *
 * Cada función verifica en BD si el usuario tiene el permiso requerido.
 * - PROFESOR: solo su materia/año/sección asignada.
 * - REPRESENTANTE: solo lectura de sus hijos.
 * - DIRECTIVO: acceso total; edición requiere clave secreta.
 */

import { prisma } from "@/lib/prisma";

// ─── Tipos ────────────────────────────────────────────────────
export type Rol = "profesor" | "representante" | "directivo";

export interface VerificacionPermiso {
  permitido: boolean;
  motivo?: string;
}

// ─── PROFESOR ─────────────────────────────────────────────────
export const ProfesorPermisos = {
  /** ¿Puede ver esta materia? */
  async canViewMateria(usuarioId: string, materiaId: string): Promise<boolean> {
    const asignacion = await prisma.profesorMateria.findFirst({
      where: { usuarioId, materiaId, activo: true },
    });
    return asignacion !== null;
  },

  /** ¿Puede editar (asistencia, evaluaciones, tareas) esta materia/año/sección? */
  async canEdit(
    usuarioId: string,
    materiaId: string,
    anio: string,
    seccion: string
  ): Promise<VerificacionPermiso> {
    const asignacion = await prisma.profesorMateria.findFirst({
      where: { usuarioId, materiaId, anio, seccion, activo: true },
    });
    if (!asignacion) {
      return { permitido: false, motivo: "No tienes asignada esta sección" };
    }
    return { permitido: true };
  },

  /** Lista las materias/años/secciones asignadas a este profesor */
  async getAsignaciones(usuarioId: string) {
    return prisma.profesorMateria.findMany({
      where: { usuarioId, activo: true },
      include: { materia: true },
      orderBy: [{ anio: "asc" }, { seccion: "asc" }],
    });
  },
};

// ─── REPRESENTANTE ────────────────────────────────────────────
export const RepresentantePermisos = {
  /** ¿Puede ver a este estudiante? */
  async canViewEstudiante(
    usuarioId: string,
    estudianteId: string
  ): Promise<boolean> {
    const relacion = await prisma.representanteHijo.findFirst({
      where: { representanteId: usuarioId, estudianteId },
    });
    return relacion !== null;
  },

  /** Lista los hijos (estudiantes) de este representante */
  async getHijos(usuarioId: string) {
    return prisma.representanteHijo.findMany({
      where: { representanteId: usuarioId },
      include: { estudiante: true },
    });
  },

  /** El representante NUNCA puede editar */
  canEdit(): VerificacionPermiso {
    return { permitido: false, motivo: "Los representantes solo tienen acceso de lectura" };
  },
};

// ─── DIRECTIVO ────────────────────────────────────────────────
export const DirectivoPermisos = {
  /** El directivo puede ver todo */
  canView(): true {
    return true;
  },

  /** El directivo puede editar si proporciona la clave secreta correcta */
  async canEdit(
    materiaId: string,
    anio: string,
    seccion: string,
    claveSecreta: string
  ): Promise<VerificacionPermiso> {
    const asignacion = await prisma.profesorMateria.findFirst({
      where: { materiaId, anio, seccion, activo: true },
    });

    if (!asignacion) {
      return { permitido: false, motivo: "No existe asignación para esta sección" };
    }

    if (asignacion.claveSecreta !== claveSecreta) {
      return { permitido: false, motivo: "Clave secreta incorrecta" };
    }

    return { permitido: true };
  },

  /** Verifica si existe una clave para esta sección (sin revelarla) */
  async tieneClave(materiaId: string, anio: string, seccion: string): Promise<boolean> {
    const asignacion = await prisma.profesorMateria.findFirst({
      where: { materiaId, anio, seccion, activo: true },
    });
    return asignacion !== null && asignacion.claveSecreta.length > 0;
  },

  /** Lista TODAS las asignaciones (materia/año/sección) */
  async getAllAsignaciones() {
    return prisma.profesorMateria.findMany({
      where: { activo: true },
      include: { materia: true, usuario: { select: { nombre: true, email: true } } },
      orderBy: [{ materiaId: "asc" }, { anio: "asc" }, { seccion: "asc" }],
    });
  },
};

// ─── Helper unificado ─────────────────────────────────────────
/**
 * Verifica permisos según el rol del usuario.
 * Útil para API routes y server components.
 */
export async function verificarPermiso(params: {
  userId: string;
  rol: Rol;
  accion: "ver" | "editar";
  materiaId: string;
  anio: string;
  seccion: string;
  claveSecreta?: string;
}): Promise<VerificacionPermiso> {
  const { userId, rol, accion, materiaId, anio, seccion, claveSecreta } = params;

  switch (rol) {
    case "profesor": {
      if (accion === "ver") {
        const puedeVer = await ProfesorPermisos.canViewMateria(userId, materiaId);
        return puedeVer
          ? { permitido: true }
          : { permitido: false, motivo: "No tienes acceso a esta materia" };
      }
      return ProfesorPermisos.canEdit(userId, materiaId, anio, seccion);
    }

    case "representante": {
      if (accion === "editar") {
        return RepresentantePermisos.canEdit();
      }
      // Para "ver", el representante necesita que el estudiante esté en esa sección
      // Se verifica por separado con canViewEstudiante
      return { permitido: true }; // La verificación fina se hace en el hook
    }

    case "directivo": {
      if (accion === "ver") return { permitido: true };
      if (!claveSecreta) {
        return { permitido: false, motivo: "Se requiere clave secreta para editar" };
      }
      return DirectivoPermisos.canEdit(materiaId, anio, seccion, claveSecreta);
    }

    default:
      return { permitido: false, motivo: "Rol no reconocido" };
  }
}
