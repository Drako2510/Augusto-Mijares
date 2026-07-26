export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verificarPermiso } from "@/lib/permissions";
import { notificarRepresentantesDeSeccion } from "@/lib/notificaciones";
import type { Rol } from "@/lib/permissions";

// GET /api/tareas?materiaId=...&anio=...&seccion=...
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
    const tareas = await prisma.tarea.findMany({
      where: { materiaId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tareas });
  } catch {
    return NextResponse.json({ error: "Error al obtener tareas" }, { status: 500 });
  }
}

// POST /api/tareas — crear tarea
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { materiaId, anio, seccion, titulo, descripcion, fechaEntrega } =
      await request.json();

    if (!materiaId || !titulo) {
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

    const tarea = await prisma.tarea.create({
      data: {
        materiaId,
        titulo,
        descripcion: descripcion ?? "",
        fechaEntrega: fechaEntrega ? new Date(fechaEntrega) : new Date(),
        anio: anio || null,
        seccion: seccion || null,
      },
    });

    // Notificar a todos los representantes de la sección
    if (anio && seccion) {
      try {
        const materia = await prisma.materia.findUnique({
          where: { id: materiaId },
          select: { nombre: true },
        });
        await notificarRepresentantesDeSeccion(
          anio,
          seccion,
          "TAREA",
          "Nueva tarea asignada",
          `📨 Nueva tarea en ${materia?.nombre ?? materiaId}: "${titulo}". Entrega: ${fechaEntrega ? new Date(fechaEntrega).toLocaleDateString("es") : "pronto"}.`,
          materiaId,
          session.userId
        );
      } catch {
        // No bloquear
      }
    }

    return NextResponse.json({ success: true, tarea });
  } catch {
    return NextResponse.json({ error: "Error al crear tarea" }, { status: 500 });
  }
}
