export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/reportes/solvencia/comprobante/[id] — Aprobar
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session || session.rol !== "directivo") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  try {
    const comprobante = await prisma.comprobantePago.findUnique({ where: { id: params.id } });
    if (!comprobante) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await prisma.comprobantePago.update({ where: { id: params.id }, data: { aprobado: true } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
