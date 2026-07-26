import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notificarRepresentantes } from "@/lib/notificaciones";

/**
 * POST /api/asistencia/batch
 * Guarda múltiples asistencias en una sola llamada.
 * Útil para el botón "Guardar Cambios" del directivo.
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
    const { asistencias, materiaId, anio, seccion } = await request.json();

    if (!Array.isArray(asistencias) || asistencias.length === 0) {
      return NextResponse.json(
        { error: "asistencias debe ser un array no vacío" },
        { status: 400 }
      );
    }

    const resultados = [];
    for (const a of asistencias) {
      const { estudianteId, estado, fecha } = a;
      if (!estudianteId || !estado) continue;

      const fechaDate = fecha ? new Date(fecha) : new Date();
      fechaDate.setHours(0, 0, 0, 0);

      const result = await prisma.asistencia.upsert({
        where: {
          estudianteId_materiaId_fecha: {
            estudianteId,
            materiaId,
            fecha: fechaDate,
          },
        },
        update: { estado },
        create: {
          estudianteId,
          materiaId,
          fecha: fechaDate,
          estado,
        },
      });

      resultados.push(result);

      // Notificar al representante de este estudiante
      const estudiante = await prisma.estudiante.findUnique({
        where: { id: estudianteId },
        select: { nombre: true },
      });
      const materia = await prisma.materia.findUnique({
        where: { id: materiaId },
        select: { nombre: true },
      });
      const etiqueta =
        estado === "presente" ? "✅ Presente" : estado === "ausente" ? "❌ Ausente" : estado;

      await notificarRepresentantes(
        estudianteId,
        "ASISTENCIA",
        "Asistencia registrada",
        `${estudiante?.nombre ?? "Estudiante"} fue marcado como ${etiqueta} en ${materia?.nombre ?? materiaId}.`,
        session.userId
      );
    }

    return NextResponse.json({
      success: true,
      guardadas: resultados.length,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al guardar asistencias" },
      { status: 500 }
    );
  }
}
