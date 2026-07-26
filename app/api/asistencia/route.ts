import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verificarPermiso } from "@/lib/permissions";
import { notificarRepresentantes } from "@/lib/notificaciones";
import type { Rol } from "@/lib/permissions";

// GET /api/asistencia?materiaId=...&anio=...&seccion=...
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const materiaId = searchParams.get("materiaId") ?? "";
  const anio = searchParams.get("anio") ?? "";
  const seccion = searchParams.get("seccion") ?? "";

  // Verificar permiso de vista
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
    const estudiantes = await prisma.estudiante.findMany({
      where: { anio, seccion, activo: true },
      orderBy: { nombre: "asc" },
    });

    // Obtener asistencias del día para estos estudiantes
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const asistencias = await prisma.asistencia.findMany({
      where: {
        materiaId,
        fecha: { gte: hoy, lt: manana },
        estudianteId: { in: estudiantes.map((e) => e.id) },
      },
    });

    const mapa = Object.fromEntries(
      asistencias.map((a) => [a.estudianteId, a.estado])
    );

    return NextResponse.json({
      estudiantes: estudiantes.map((e) => ({
        ...e,
        estado: mapa[e.id] ?? "sin_marcar",
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener asistencias" },
      { status: 500 }
    );
  }
}

// POST /api/asistencia — marcar asistencia de un estudiante
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { estudianteId, materiaId, anio, seccion, estado } = await request.json();

    if (!estudianteId || !materiaId || !estado) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    // Verificar permiso de edición
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

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const asistencia = await prisma.asistencia.upsert({
      where: {
        estudianteId_materiaId_fecha: {
          estudianteId,
          materiaId,
          fecha: hoy,
        },
      },
      update: { estado },
      create: {
        estudianteId,
        materiaId,
        fecha: hoy,
        estado,
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
      const etiqueta = estado === "presente" ? "✅ Presente" : estado === "ausente" ? "❌ Ausente" : `⏰ ${estado}`;
      await notificarRepresentantes(
        estudianteId,
        "ASISTENCIA",
        "Asistencia registrada",
        `${estudiante?.nombre ?? "Estudiante"} fue marcado como ${etiqueta} en ${materia?.nombre ?? materiaId}.`,
        session.userId
      );
    } catch {
      // No bloquear si falla la notificación
    }

    return NextResponse.json({ success: true, asistencia });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al registrar asistencia" },
      { status: 500 }
    );
  }
}
