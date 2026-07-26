export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/notificaciones/marcar-leida
 * Marca una notificación como leída. Solo el dueño de la notificación.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { notificacionId } = await request.json();

    if (!notificacionId) {
      return NextResponse.json({ error: "notificacionId requerido" }, { status: 400 });
    }

    const notificacion = await prisma.notificacion.update({
      where: { id: notificacionId, usuarioId: session.userId },
      data: { leida: true },
    });

    return NextResponse.json({ success: true, notificacion });
  } catch {
    return NextResponse.json(
      { error: "Error al marcar como leída" },
      { status: 500 }
    );
  }
}
