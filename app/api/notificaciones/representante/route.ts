export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/notificaciones/representante
 * Obtener notificaciones del representante logueado.
 * Parámetros: ?noLeidas=true&limit=20
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "representante") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const soloNoLeidas = searchParams.get("noLeidas") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");

    const notificaciones = await prisma.notificacion.findMany({
      where: {
        usuarioId: session.userId,
        ...(soloNoLeidas ? { leida: false } : {}),
      },
      orderBy: { fecha: "desc" },
      take: Math.min(limit, 50),
      include: {
        estudiante: {
          select: { nombre: true, anio: true, seccion: true },
        },
        materia: {
          select: { nombre: true, icono: true },
        },
      },
    });

    // Contar no leídas
    const noLeidas = await prisma.notificacion.count({
      where: { usuarioId: session.userId, leida: false },
    });

    return NextResponse.json({
      notificaciones,
      total: notificaciones.length,
      noLeidas,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener notificaciones" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notificaciones/representante
 * Marca notificaciones como leídas.
 * Body: { ids: string[] } o { todas: true }
 */
export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "representante") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body.todas) {
      await prisma.notificacion.updateMany({
        where: { usuarioId: session.userId, leida: false },
        data: { leida: true },
      });
    } else if (Array.isArray(body.ids) && body.ids.length > 0) {
      await prisma.notificacion.updateMany({
        where: { id: { in: body.ids }, usuarioId: session.userId },
        data: { leida: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error al marcar como leídas" },
      { status: 500 }
    );
  }
}
