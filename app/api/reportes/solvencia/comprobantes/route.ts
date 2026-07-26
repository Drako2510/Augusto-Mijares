import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reportes/solvencia/comprobantes
export async function GET() {
  const session = await getSession();
  if (!session || session.rol !== "directivo") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  try {
    const [pendientes, confirmados] = await Promise.all([
      prisma.comprobantePago.findMany({ where: { aprobado: false }, orderBy: { createdAt: "desc" } }),
      prisma.comprobantePago.findMany({ where: { aprobado: true }, orderBy: { createdAt: "desc" }, take: 30 }),
    ]);
    return NextResponse.json({ pendientes, confirmados });
  } catch {
    return NextResponse.json({ comprobantes: [] });
  }
}
