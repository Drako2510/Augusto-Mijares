export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitirEvento } from "@/lib/eventos";
import { enviarAMultiplesClientes } from "@/lib/sse-connections";

/**
 * POST /api/notificaciones/batch
 * Crea múltiples notificaciones y las envía por SSE en lote.
 * Usado por el sistema de guardado en batch.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { notificaciones: lista } = await request.json();

    if (!Array.isArray(lista) || lista.length === 0) {
      return NextResponse.json(
        { error: "notificaciones debe ser un array no vacío" },
        { status: 400 }
      );
    }

    const repIds = new Set<string>();
    const creadas = [];

    for (const n of lista) {
      const { tipo, titulo, mensaje, usuarioId, estudianteId, materiaId, data } = n;

      if (!usuarioId || !mensaje) continue;

      const notif = await prisma.notificacion.create({
        data: {
          tipo: tipo || "SISTEMA",
          titulo: titulo || tipo || "Notificación",
          mensaje,
          usuarioId,
          estudianteId: estudianteId || null,
          materiaId: materiaId || null,
          data: data ? JSON.stringify(data) : null,
          creadoPor: session.userId,
          enCola: false,
          enviado: true,
        },
      });

      creadas.push(notif);
      repIds.add(usuarioId);
    }

    // Push SSE a todos los representantes afectados
    const repArray = Array.from(repIds);
    const eventoActualizacion = `data: ${JSON.stringify({
      type: "actualizacion",
      data: { timestamp: new Date().toISOString() },
    })}\n\n`;
    enviarAMultiplesClientes(repArray, eventoActualizacion);
    emitirEvento(repArray);

    return NextResponse.json({
      success: true,
      creadas: creadas.length,
      notificados: repArray.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al crear notificaciones" },
      { status: 500 }
    );
  }
}
