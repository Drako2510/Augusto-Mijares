export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dashboard/estudiante?estudianteId=...
 * Retorna todos los datos del dashboard del representante para un estudiante:
 * asistencias de hoy, próximas evaluaciones y tareas pendientes.
 * Todo en una sola llamada.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const estudianteId = searchParams.get("estudianteId");

  if (!estudianteId) {
    return NextResponse.json({ error: "estudianteId requerido" }, { status: 400 });
  }

  // Solo representantes (y directivos) pueden acceder
  if (session.rol === "profesor") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Representante: verificar parentesco con el estudiante
  if (session.rol === "representante") {
    const relacion = await prisma.representanteHijo.findFirst({
      where: { representanteId: session.userId, estudianteId },
    });
    if (!relacion) {
      return NextResponse.json({ error: "No tienes acceso a este estudiante" }, { status: 403 });
    }
  }

  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    // Obtener el estudiante para saber su año y sección
    const estudiante = await prisma.estudiante.findUnique({
      where: { id: estudianteId },
      select: { anio: true, seccion: true },
    });
    const anioEst = estudiante?.anio ?? "";
    const seccionEst = estudiante?.seccion ?? "";

    // Obtener todo en paralelo
    const [asistencias, evaluaciones, tareas] = await Promise.all([
      // Asistencias de hoy
      prisma.asistencia.findMany({
        where: { estudianteId, fecha: { gte: hoy, lt: manana } },
        include: { materia: { select: { nombre: true, icono: true } } },
        orderBy: { fecha: "desc" },
      }),

      // Evaluaciones: del estudiante O de su sección, solo futuras, excluyendo ya calificadas
      prisma.evaluacion.findMany({
        where: {
          AND: [
            {
              OR: [
                { estudianteId },
                { anio: anioEst, seccion: seccionEst },
              ],
            },
            { fecha: { gte: hoy } },
            // Excluir evaluaciones que ya tienen calificación para este estudiante
            {
              NOT: {
                calificaciones: {
                  some: { estudianteId, nota: { gt: 0 } },
                },
              },
            },
          ],
        },
        include: { materia: { select: { nombre: true, icono: true } } },
        orderBy: { fecha: "asc" },
        take: 10,
      }),

      // Tareas: de la sección del estudiante + fecha futura
      prisma.tarea.findMany({
        where: {
          OR: [
            { anio: anioEst, seccion: seccionEst, fechaEntrega: { gte: hoy } },
            { anio: null, seccion: null, fechaEntrega: { gte: hoy } },
          ],
        },
        include: { materia: { select: { nombre: true, icono: true } } },
        orderBy: { fechaEntrega: "asc" },
        take: 10,
      }),
    ]);

    return NextResponse.json({
      asistencia: asistencias.map((a) => ({
        materia: a.materia.nombre,
        icono: a.materia.icono,
        estado: a.estado,
        fecha: a.fecha.toISOString(),
      })),
      evaluaciones: evaluaciones.map((ev) => ({
        id: ev.id,
        titulo: ev.titulo,
        fecha: ev.fecha.toISOString(),
        materia: ev.materia.nombre,
        icono: ev.materia.icono,
        calificacion: ev.calificacion,
      })),
      tareas: tareas.map((t) => ({
        id: t.id,
        titulo: t.titulo,
        descripcion: t.descripcion,
        fechaEntrega: t.fechaEntrega.toISOString(),
        materia: t.materia.nombre,
        icono: t.materia.icono,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener datos del dashboard" },
      { status: 500 }
    );
  }
}
