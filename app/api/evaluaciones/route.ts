export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verificarPermiso } from "@/lib/permissions";
import { notificarRepresentantes } from "@/lib/notificaciones";
import type { Rol } from "@/lib/permissions";

// GET /api/evaluaciones?materiaId=...&anio=...&seccion=...
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const materiaId = searchParams.get("materiaId") ?? "";
  const anio = searchParams.get("anio") ?? "";
  const seccion = searchParams.get("seccion") ?? "";

  const permiso = await verificarPermiso({
    userId: session.userId,
    rol: session.rol as Rol,
    accion: "ver",
    materiaId,
    anio,
    seccion,
  });

  if (!permiso.permitido) {
    return NextResponse.json({ error: permiso.motivo }, { status: 403 });
  }

  try {
    // Obtener estudiantes de la sección
    const estudiantes = await prisma.estudiante.findMany({
      where: { anio, seccion, activo: true },
      select: { id: true },
    });

    const evaluaciones = await prisma.evaluacion.findMany({
      where: {
        materiaId,
        OR: [
          { estudianteId: { in: estudiantes.map((e) => e.id) } },
          { estudianteId: null, anio, seccion },
        ],
      },
      orderBy: { fecha: "desc" },
      include: { estudiante: { select: { nombre: true } } },
    });

    return NextResponse.json({ evaluaciones });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener evaluaciones" },
      { status: 500 }
    );
  }
}

// POST /api/evaluaciones — crear evaluación
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { materiaId, anio, seccion, tipo, titulo, calificacion, estudianteId, fecha, descripcion } =
      await request.json();

    if (!materiaId || !tipo || !titulo || calificacion == null) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const permiso = await verificarPermiso({
      userId: session.userId,
      rol: session.rol as Rol,
      accion: "editar",
      materiaId,
      anio,
      seccion,
    });

    if (!permiso.permitido) {
      return NextResponse.json({ error: permiso.motivo }, { status: 403 });
    }

    const evaluacion = await prisma.evaluacion.create({
      data: {
        estudianteId: estudianteId || null,
        materiaId,
        tipo,
        titulo,
        calificacion,
        descripcion: descripcion || null,
        fecha: fecha ? new Date(fecha) : new Date(),
        anio: anio || null,
        seccion: seccion || null,
        profesorId: session.userId,
      },
    });

    // Notificar al representante
    try {
      const estudiante = await prisma.estudiante.findUnique({
        where: { id: estudianteId },
        select: { nombre: true },
      });
      const materia = await prisma.materia.findUnique({
        where: { id: materiaId },
        select: { nombre: true },
      });
      await notificarRepresentantes(
        estudianteId,
        "EVALUACION",
        "Nueva evaluación",
        `📝 ${estudiante?.nombre ?? "Estudiante"} tiene nueva evaluación en ${materia?.nombre ?? materiaId}: "${titulo}" (${calificacion}/10).`,
        session.userId
      );
    } catch {
      // No bloquear
    }

    return NextResponse.json({ success: true, evaluacion });
  } catch {
    return NextResponse.json(
      { error: "Error al crear evaluación" },
      { status: 500 }
    );
  }
}

// PATCH /api/evaluaciones — actualizar evaluación
export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { id, titulo, descripcion, tipo, fecha } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const evaluacion = await prisma.evaluacion.findUnique({ where: { id } });
    if (!evaluacion) {
      return NextResponse.json({ error: "Evaluación no encontrada" }, { status: 404 });
    }

    const data: any = {};
    if (titulo !== undefined) data.titulo = titulo;
    if (descripcion !== undefined) data.descripcion = descripcion;
    if (tipo !== undefined) data.tipo = tipo;
    if (fecha !== undefined) data.fecha = new Date(fecha);

    await prisma.evaluacion.update({ where: { id }, data });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar evaluación" },
      { status: 500 }
    );
  }
}

// DELETE /api/evaluaciones — eliminar evaluación
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { id, materiaId, anio, seccion } = await request.json();

    // Solo verificar permiso para profesores, directivo tiene acceso total
    if (session.rol !== "directivo") {
      const permiso = await verificarPermiso({
        userId: session.userId,
        rol: session.rol as Rol,
        accion: "editar",
        materiaId,
        anio,
        seccion,
      });
      if (!permiso.permitido) {
        return NextResponse.json({ error: permiso.motivo }, { status: 403 });
      }
    }

    await prisma.evaluacion.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar evaluación" },
      { status: 500 }
    );
  }
}
