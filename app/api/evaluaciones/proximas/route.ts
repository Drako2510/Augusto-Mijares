export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/evaluaciones/proximas?estudianteId=...
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const estudianteId = searchParams.get("estudianteId");

  if (!estudianteId) {
    return NextResponse.json({ error: "estudianteId requerido" }, { status: 400 });
  }

  if (session.rol === "profesor") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Representante: verificar que sea su hijo
  if (session.rol === "representante") {
    const relacion = await prisma.representanteHijo.findFirst({
      where: { representanteId: session.userId, estudianteId },
    });
    if (!relacion) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  }

  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const evaluaciones = await prisma.evaluacion.findMany({
      where: {
        estudianteId,
        fecha: { gte: hoy },
        // Excluir evaluaciones que ya tienen calificación
        NOT: {
          calificaciones: {
            some: { estudianteId, nota: { gt: 0 } },
          },
        },
      },
      include: { materia: { select: { nombre: true, icono: true } } },
      orderBy: { fecha: "asc" },
      take: 10,
    });

    return NextResponse.json({
      evaluaciones: evaluaciones.map((ev) => ({
        id: ev.id,
        titulo: ev.titulo,
        fecha: ev.fecha.toISOString(),
        materia: ev.materia.nombre,
        icono: ev.materia.icono,
        calificacion: ev.calificacion,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Error al obtener evaluaciones" }, { status: 500 });
  }
}
