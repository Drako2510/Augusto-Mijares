import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/tareas/pendientes?estudianteId=...
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

    // Obtener anio/seccion del estudiante para filtrar solo sus tareas
    const estudiante = await prisma.estudiante.findUnique({
      where: { id: estudianteId },
      select: { anio: true, seccion: true },
    });

    const tareas = await prisma.tarea.findMany({
      where: {
        fechaEntrega: { gte: hoy },
        OR: estudiante
          ? [
              { anio: estudiante.anio, seccion: estudiante.seccion },
              { anio: null, seccion: null },
            ]
          : [{ anio: null, seccion: null }],
      },
      include: { materia: { select: { nombre: true, icono: true } } },
      orderBy: { fechaEntrega: "asc" },
      take: 10,
    });

    return NextResponse.json({
      tareas: tareas.map((t) => ({
        id: t.id,
        titulo: t.titulo,
        descripcion: t.descripcion,
        fechaEntrega: t.fechaEntrega.toISOString(),
        materia: t.materia.nombre,
        icono: t.materia.icono,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Error al obtener tareas" }, { status: 500 });
  }
}
