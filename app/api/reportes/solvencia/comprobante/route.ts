import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/reportes/solvencia/comprobante — Enviar comprobante
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const { estudianteId, estudianteNombre, estudianteAnio, estudianteSeccion, referencia, metodo, screenshot } = await request.json();

    if (!estudianteId || !referencia) {
      return NextResponse.json({ error: "Datos requeridos" }, { status: 400 });
    }

    await prisma.comprobantePago.create({
      data: {
        estudianteId,
        estudianteNombre,
        estudianteAnio,
        estudianteSeccion,
        referencia,
        metodo: metodo || "Transferencia",
        screenshot: screenshot || null,
        aprobado: false,
      },
    });

    return NextResponse.json({ success: true, message: "Comprobante enviado" });
  } catch {
    return NextResponse.json({ error: "Error al enviar" }, { status: 500 });
  }
}
