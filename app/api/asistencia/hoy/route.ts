import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/asistencia/hoy?estudianteId=...
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const estudianteId = searchParams.get("estudianteId");
  const fechaParam = searchParams.get("fecha");

  if (!estudianteId) {
    return NextResponse.json({ error: "estudianteId requerido" }, { status: 400 });
  }

  // Solo representantes (y directivos)
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
    // Determinar fecha a consultar (hoy por defecto)
    let fecha: Date;
    if (fechaParam) {
      fecha = new Date(fechaParam + "T00:00:00");
    } else {
      fecha = new Date();
    }
    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);

    const asistencias = await prisma.asistencia.findMany({
      where: { estudianteId, fecha: { gte: inicioDia, lte: finDia } },
      include: { materia: { select: { nombre: true, icono: true } } },
      orderBy: { fecha: "desc" },
    });

    return NextResponse.json({
      asistencias: asistencias.map((a) => ({
        materia: a.materia.nombre,
        icono: a.materia.icono,
        estado: a.estado,
        fecha: a.fecha.toISOString(),
      })),
      diaSemana: fecha.getDay(),
    });
  } catch {
    return NextResponse.json({ error: "Error al obtener asistencia" }, { status: 500 });
  }
}
