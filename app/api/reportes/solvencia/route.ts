import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reportes/solvencia
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (session.rol !== "directivo") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const estudiantes = await prisma.estudiante.findMany({
      where: { activo: true },
      select: {
        id: true,
        nombre: true,
        anio: true,
        seccion: true,
        solvente: true,
        representantes: {
          select: {
            representante: { select: { nombre: true, email: true } },
          },
        },
      },
      orderBy: [{ anio: "asc" }, { seccion: "asc" }, { nombre: "asc" }],
    });

    const solventes = estudiantes.filter((e) => e.solvente);
    const noSolventes = estudiantes.filter((e) => !e.solvente);

    return NextResponse.json({ solventes, noSolventes, total: estudiantes.length });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener datos de solvencia" },
      { status: 500 }
    );
  }
}

// PATCH /api/reportes/solvencia — cambiar estado de solvencia
export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (session.rol !== "directivo") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { estudianteId, solvente } = await request.json();

    if (!estudianteId) {
      return NextResponse.json(
        { error: "estudianteId requerido" },
        { status: 400 }
      );
    }

    const estudiante = await prisma.estudiante.update({
      where: { id: estudianteId },
      data: { solvente },
      select: { id: true, nombre: true, solvente: true },
    });

    return NextResponse.json({
      success: true,
      estudiante,
      message: solvente
        ? `${estudiante.nombre} marcado como solvente ✅`
        : `${estudiante.nombre} marcado como no solvente ❌`,
    });
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar solvencia" },
      { status: 500 }
    );
  }
}
