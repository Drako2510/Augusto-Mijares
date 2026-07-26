export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/directivo/historial-estudiante/[id]
// Permite: directivos (todos) y representantes (solo sus propios hijos)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Representante: verificar que sea su hijo
  if (session.rol === "representante") {
    const relacion = await prisma.representanteHijo.findFirst({
      where: { representanteId: session.userId, estudianteId: params.id },
    });
    if (!relacion) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  } else if (session.rol !== "directivo") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const estudiante = await prisma.estudiante.findUnique({
      where: { id: params.id },
      include: {
        asistencias: {
          include: { materia: { select: { nombre: true, icono: true } } },
          orderBy: { fecha: "desc" },
          take: 30,
        },
        evaluaciones: {
          include: { materia: { select: { nombre: true, icono: true } } },
          orderBy: { fecha: "desc" },
        },
      },
    });

    if (!estudiante) {
      return NextResponse.json({ error: "Estudiante no encontrado" }, { status: 404 });
    }

    // Tareas de cualquier materia
    const tareas = await prisma.tarea.findMany({
      where: { fechaEntrega: { gte: new Date() } },
      include: { materia: { select: { nombre: true, icono: true } } },
      orderBy: { fechaEntrega: "asc" },
      take: 10,
    });

    return NextResponse.json({
      estudiante: {
        id: estudiante.id,
        nombre: estudiante.nombre,
        anio: estudiante.anio,
        seccion: estudiante.seccion,
        fechaNacimiento: estudiante.fechaNacimiento,
        activo: estudiante.activo,
      },
      asistencias: estudiante.asistencias.map((a) => ({
        id: a.id,
        fecha: a.fecha.toISOString(),
        materia: a.materia.nombre,
        icono: a.materia.icono,
        estado: a.estado,
      })),
      evaluaciones: estudiante.evaluaciones.map((ev) => ({
        id: ev.id,
        fecha: ev.fecha.toISOString(),
        materia: ev.materia.nombre,
        icono: ev.materia.icono,
        titulo: ev.titulo,
        calificacion: ev.calificacion,
      })),
      tareas: tareas.map((t) => ({
        id: t.id,
        materia: t.materia.nombre,
        icono: t.materia.icono,
        titulo: t.titulo,
        descripcion: t.descripcion,
        fechaEntrega: t.fechaEntrega.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener historial" },
      { status: 500 }
    );
  }
}
