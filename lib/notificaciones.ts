import { prisma } from "@/lib/prisma";
import { emitirEvento } from "@/lib/eventos";

type TipoNotificacion = "ASISTENCIA" | "EVALUACION" | "TAREA" | "SISTEMA";

interface CrearNotificacionParams {
  usuarioId: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  estudianteId?: string;
  materiaId?: string;
  creadoPor?: string;
  data?: Record<string, unknown>;
}

/**
 * Crea una notificación para un representante específico.
 */
async function crearNotificacion(params: CrearNotificacionParams): Promise<void> {
  try {
    await prisma.notificacion.create({
      data: {
        usuarioId: params.usuarioId,
        tipo: params.tipo,
        titulo: params.titulo,
        mensaje: params.mensaje,
        estudianteId: params.estudianteId ?? null,
        materiaId: params.materiaId ?? null,
        creadoPor: params.creadoPor ?? null,
        data: params.data ? JSON.stringify(params.data) : null,
        enCola: false,
        enviado: false, // El SSE lo marca como true al enviar
      },
    });
  } catch {
    // Silencioso: no bloquear la operación principal
  }
}

/**
 * Notifica a los representantes de un estudiante específico.
 * Uso: marcar asistencia, crear evaluación para un estudiante.
 */
export async function notificarRepresentantes(
  estudianteId: string,
  tipo: TipoNotificacion,
  titulo: string,
  mensaje: string,
  creadoPor?: string
): Promise<void> {
  try {
    const relaciones = await prisma.representanteHijo.findMany({
      where: { estudianteId },
      select: { representanteId: true },
    });
    if (relaciones.length === 0) return;

    await Promise.all(
      relaciones.map((r) =>
        crearNotificacion({
          usuarioId: r.representanteId,
          tipo,
          titulo,
          mensaje,
          estudianteId,
          creadoPor,
        })
      )
    );

    // Disparar evento SSE
    emitirEvento(relaciones.map((r) => r.representanteId));
  } catch {
    // Silencioso
  }
}

/**
 * Notifica a TODOS los representantes de una sección.
 * Uso: nueva tarea para toda la clase.
 */
export async function notificarRepresentantesDeSeccion(
  anio: string,
  seccion: string,
  tipo: TipoNotificacion,
  titulo: string,
  mensaje: string,
  materiaId?: string,
  creadoPor?: string
): Promise<void> {
  try {
    const estudiantes = await prisma.estudiante.findMany({
      where: { anio, seccion, activo: true },
      select: {
        id: true,
        representantes: { select: { representanteId: true } },
      },
    });

    const reps = new Set<string>();
    for (const est of estudiantes) {
      for (const rel of est.representantes) {
        reps.add(rel.representanteId);
      }
    }
    if (reps.size === 0) return;

    const repArray = Array.from(reps);
    await Promise.all(
      repArray.map((usuarioId) =>
        crearNotificacion({
          usuarioId,
          tipo,
          titulo,
          mensaje,
          materiaId,
          creadoPor,
        })
      )
    );

    // Disparar evento SSE
    emitirEvento(repArray);
  } catch {
    // Silencioso
  }
}

/**
 * Marca una notificación como leída.
 */
export async function marcarComoLeida(notificacionId: string): Promise<void> {
  try {
    await prisma.notificacion.update({
      where: { id: notificacionId },
      data: { leida: true },
    });
  } catch {
    // Silencioso
  }
}

/**
 * Obtiene notificaciones no leídas de un usuario.
 */
export async function getNotificacionesNoLeidas(usuarioId: string) {
  return prisma.notificacion.findMany({
    where: { usuarioId, leida: false },
    orderBy: { fecha: "desc" },
    take: 20,
  });
}

/**
 * Cuenta notificaciones no leídas.
 */
export async function contarNoLeidas(usuarioId: string): Promise<number> {
  return prisma.notificacion.count({ where: { usuarioId, leida: false } });
}
