import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/directivo/cambiar-seccion
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.rol !== "directivo") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const { anio, seccionOrigen, seccionDestino, estudianteIds, passwordConfirmacion } = await request.json();

    if (!anio || !seccionOrigen || !seccionDestino || !estudianteIds?.length) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 });
    }

    if (seccionOrigen === seccionDestino) {
      return NextResponse.json({ error: "La sección de destino debe ser diferente" }, { status: 400 });
    }

    // Verificar contraseña
    if (!passwordConfirmacion) {
      return NextResponse.json({ error: "Debes ingresar tu contraseña para confirmar" }, { status: 400 });
    }

    const directivo = await prisma.usuario.findUnique({
      where: { id: session.userId },
      select: { password: true },
    });
    if (!directivo) return NextResponse.json({ error: "Directivo no encontrado" }, { status: 404 });

    const ok = await bcrypt.compare(passwordConfirmacion, directivo.password);
    if (!ok) return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 403 });

    // Cambiar sección
    await prisma.estudiante.updateMany({
      where: { id: { in: estudianteIds }, anio, seccion: seccionOrigen },
      data: { seccion: seccionDestino },
    });

    await prisma.logAuditoria.create({
      data: {
        usuarioId: session.userId,
        accion: "CAMBIAR_SECCION",
        detalle: `${estudianteIds.length} estudiantes de ${anio} "${seccionOrigen}" movidos a "${seccionDestino}"`,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${estudianteIds.length} estudiante(s) movido(s) de "${seccionOrigen}" a "${seccionDestino}"`,
    });
  } catch {
    return NextResponse.json({ error: "Error al cambiar de sección" }, { status: 500 });
  }
}
