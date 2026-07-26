import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * POST /api/profesor/generar-clave
 * El profesor genera una clave temporal de 5 minutos y 1 solo uso
 * para que el directivo pueda desbloquear los controles de edición.
 *
 * Body: { materiaId, anio, seccion }
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (session.rol !== "profesor") {
    return NextResponse.json(
      { error: "Solo profesores pueden generar claves" },
      { status: 403 }
    );
  }

  try {
    const { materiaId, anio, seccion } = await request.json();

    if (!materiaId || !anio || !seccion) {
      return NextResponse.json(
        { error: "materiaId, anio y seccion son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que el profesor tenga esta sección asignada
    const asignacion = await prisma.profesorMateria.findFirst({
      where: { usuarioId: session.userId, materiaId, anio, seccion, activo: true },
    });

    if (!asignacion) {
      return NextResponse.json(
        { error: "No tienes asignada esta sección" },
        { status: 403 }
      );
    }

    // Generar clave aleatoria de 8 caracteres
    const clave = crypto.randomBytes(4).toString("hex").toUpperCase();

    // Expira en 5 minutos
    const expiraAt = new Date(Date.now() + 5 * 60 * 1000);

    // Guardar en BD
    await prisma.claveTemporal.create({
      data: {
        clave,
        materiaId,
        anio,
        seccion,
        creadoPor: session.userId,
        expiraAt,
      },
    });

    // Log de auditoría
    await prisma.logAuditoria.create({
      data: {
        usuarioId: session.userId,
        accion: "GENERAR_CLAVE_TEMPORAL",
        detalle: `Clave temporal generada para ${materiaId} - ${anio} "${seccion}". Expira: ${expiraAt.toISOString()}`,
      },
    });

    return NextResponse.json({
      success: true,
      clave,
      expiraAt: expiraAt.toISOString(),
      expiraEn: "5 minutos",
      unicoUso: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al generar clave" },
      { status: 500 }
    );
  }
}
