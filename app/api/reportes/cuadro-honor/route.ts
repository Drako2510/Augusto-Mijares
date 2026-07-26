import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reportes/cuadro-honor
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (session.rol !== "directivo") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    // Obtener todos los estudiantes activos con sus evaluaciones
    const estudiantes = await prisma.estudiante.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        anio: true,
        seccion: true,
        evaluaciones: {
          select: { calificacion: true, materia: { select: { nombre: true } } },
        },
      },
    });

    // Calcular promedio por estudiante
    const ranking = estudiantes
      .map((e) => {
        const calificaciones = e.evaluaciones.map((ev) => ev.calificacion);
        const cantidad = calificaciones.length;
        const promedio =
          cantidad > 0
            ? Math.round(
                (calificaciones.reduce((a, b) => a + b, 0) / cantidad) * 10
              ) / 10
            : 0;

        return {
          id: e.id,
          nombre: e.nombre,
          anio: e.anio,
          seccion: e.seccion,
          promedio,
          cantidad,
        };
      })
      .filter((e) => e.cantidad > 0) // solo estudiantes con al menos 1 evaluación
      .sort((a, b) => b.promedio - a.promedio);

    return NextResponse.json({ ranking });
  } catch {
    return NextResponse.json(
      { error: "Error al generar el cuadro de honor" },
      { status: 500 }
    );
  }
}
