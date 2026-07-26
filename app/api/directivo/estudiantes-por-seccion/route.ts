export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/directivo/estudiantes-por-seccion?anio=&seccion=
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.rol !== "directivo" && session.rol !== "profesor") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const anio = searchParams.get("anio") ?? "";
  const seccion = searchParams.get("seccion") ?? "";

  const estudiantes = await prisma.estudiante.findMany({
    where: { anio, seccion, activo: true },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" },
  });

  return NextResponse.json({ estudiantes });
}
