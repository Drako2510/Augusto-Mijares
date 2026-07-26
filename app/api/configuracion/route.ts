export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/configuracion
export async function GET() {
  try {
    let config = await prisma.configuracion.findUnique({ where: { id: "institucion" } });
    if (!config) {
      config = await prisma.configuracion.create({
        data: { id: "institucion", nombre: "Asistencia Plus", logo: "" },
      });
    }
    return NextResponse.json({ nombre: config.nombre, logo: config.logo });
  } catch {
    return NextResponse.json({ nombre: "Asistencia Plus", logo: "" });
  }
}

// PUT /api/configuracion — Solo directivo
export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session || session.rol !== "directivo") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  try {
    const { nombre, logo } = await request.json();
    const data: any = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (logo !== undefined) data.logo = logo;

    const config = await prisma.configuracion.upsert({
      where: { id: "institucion" },
      update: data,
      create: { id: "institucion", nombre: nombre || "Asistencia Plus", logo: logo || "" },
    });
    return NextResponse.json({ success: true, nombre: config.nombre, logo: config.logo });
  } catch {
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
  }
}
