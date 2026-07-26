export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/horarios?anio=...&seccion=...
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const anio = searchParams.get("anio");
  const seccion = searchParams.get("seccion");

  try {
    const where: Record<string, string> = {};
    if (anio) where.anio = anio;
    if (seccion) where.seccion = seccion;

    const horarios = await prisma.horario.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    const response = NextResponse.json({
      horarios: horarios.map((h) => ({
        id: h.id,
        anio: h.anio,
        seccion: h.seccion,
        data: JSON.parse(h.data),
        archivoNombre: h.archivoNombre,
        updatedAt: h.updatedAt.toISOString(),
      })),
    });
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );
    return response;
  } catch {
    return NextResponse.json(
      { error: "Error al obtener horarios" },
      { status: 500 }
    );
  }
}

// POST /api/horarios — crear o reemplazar horario
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (session.rol !== "directivo") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { anio, seccion, data, archivoNombre } = await request.json();

    if (!anio || !seccion || !data) {
      return NextResponse.json(
        { error: "Año, sección y datos del horario son requeridos" },
        { status: 400 }
      );
    }

    // Upsert: si ya existe un horario para este año+sección, lo reemplaza
    const horario = await prisma.horario.upsert({
      where: {
        anio_seccion: { anio, seccion },
      },
      update: {
        data: JSON.stringify(data),
        archivoNombre: archivoNombre || "horario.xlsx",
      },
      create: {
        anio,
        seccion,
        data: JSON.stringify(data),
        archivoNombre: archivoNombre || "horario.xlsx",
      },
    });

    return NextResponse.json({
      success: true,
      horario: {
        id: horario.id,
        anio: horario.anio,
        seccion: horario.seccion,
        data: JSON.parse(horario.data),
        archivoNombre: horario.archivoNombre,
      },
      message: "Horario guardado correctamente",
    });
  } catch {
    return NextResponse.json(
      { error: "Error al guardar el horario" },
      { status: 500 }
    );
  }
}
