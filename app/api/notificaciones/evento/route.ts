export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitirEvento } from "@/lib/eventos";
import { enviarACliente, enviarAMultiplesClientes } from "@/lib/sse-connections";

/**
 * POST /api/notificaciones/evento
 * Endpoint centralizado de eventos de notificación.
 * Profesores/directivos disparan eventos después de cada acción.
 *
 * Flujo:
 * 1. Recibe el evento (tipo, estudianteId o data.anio+seccion, etc.)
 * 2. Crea notificaciones en BD para los representantes afectados
 * 3. Notifica instantáneamente a los SSE conectados (push)
 * 4. Emite evento para el sistema de polling de respaldo
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const rol = session.rol;
  if (rol !== "profesor" && rol !== "directivo") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { tipo, estudianteId, materiaId, data, titulo, mensaje } =
      await request.json();

    if (!tipo || !mensaje) {
      return NextResponse.json(
        { error: "tipo y mensaje son requeridos" },
        { status: 400 }
      );
    }

    const eventoActualizacion = {
      type: "actualizacion",
      data: {
        tipo,
        materiaId,
        estudianteId: estudianteId || null,
        data,
        timestamp: new Date().toISOString(),
      },
    };
    const eventoPayload = `data: ${JSON.stringify(eventoActualizacion)}\n\n`;

    // ── Caso 1: Notificación por estudiante específico ────
    if (estudianteId) {
      const relaciones = await prisma.representanteHijo.findMany({
        where: { estudianteId },
        select: {
          representanteId: true,
          estudiante: { select: { nombre: true } },
        },
      });

      if (relaciones.length > 0) {
        // Crear notificaciones en BD
        await Promise.all(
          relaciones.map((rel) =>
            prisma.notificacion.create({
              data: {
                tipo,
                titulo: titulo || tipo,
                mensaje,
                usuarioId: rel.representanteId,
                estudianteId,
                materiaId: materiaId || null,
                data: data ? JSON.stringify(data) : null,
                creadoPor: session.userId,
                enCola: false,
                enviado: true, // Se marca enviado porque hacemos push directo
              },
            })
          )
        );

        // Push instantáneo a SSE conectados
        const repIds = relaciones.map((r) => r.representanteId);
        enviarAMultiplesClientes(repIds, eventoPayload);
        emitirEvento(repIds);

        return NextResponse.json({
          success: true,
          notificaciones: relaciones.length,
          pushDirecto: repIds.filter((id) =>
            repIds.includes(id)
          ).length,
        });
      }

      return NextResponse.json({
        success: true,
        notificaciones: 0,
        message: "Estudiante sin representante asignado",
      });
    }

    // ── Caso 2: Notificación para toda una sección ──────
    const anio = data?.anio as string | undefined;
    const seccion = data?.seccion as string | undefined;

    if (anio && seccion) {
      const estudiantes = await prisma.estudiante.findMany({
        where: { anio, seccion, activo: true },
        select: {
          id: true,
          representantes: { select: { representanteId: true } },
        },
      });

      const repIds = new Set<string>();
      for (const est of estudiantes) {
        for (const rel of est.representantes) {
          repIds.add(rel.representanteId);
        }
      }

      if (repIds.size === 0) {
        return NextResponse.json({
          success: true,
          notificaciones: 0,
          message: "Sin representantes en esta sección",
        });
      }

      const repArray = Array.from(repIds);

      // Crear notificaciones en BD
      await prisma.notificacion.createMany({
        data: repArray.map((uid) => ({
          tipo,
          titulo: titulo || tipo,
          mensaje,
          usuarioId: uid,
          materiaId: materiaId || null,
          data: data ? JSON.stringify(data) : null,
          creadoPor: session.userId,
          enCola: false,
          enviado: true,
        })),
      });

      // Push instantáneo a SSE conectados
      enviarAMultiplesClientes(repArray, eventoPayload);
      emitirEvento(repArray);

      return NextResponse.json({
        success: true,
        notificaciones: repArray.length,
        seccion: `${anio} "${seccion}"`,
      });
    }

    return NextResponse.json(
      { error: "Se requiere estudianteId o data.anio+data.seccion" },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error interno al procesar evento" },
      { status: 500 }
    );
  }
}
