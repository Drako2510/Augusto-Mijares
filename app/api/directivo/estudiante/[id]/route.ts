export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// PATCH /api/directivo/estudiante/[id] — Activar/desactivar estudiante
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  if (session.rol !== "directivo") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const { activo, passwordConfirmacion } = await request.json();

    // Verificar contraseña del directivo para confirmar
    if (passwordConfirmacion) {
      const directivo = await prisma.usuario.findUnique({
        where: { id: session.userId },
        select: { password: true },
      });

      if (!directivo) {
        return NextResponse.json(
          { error: "Directivo no encontrado" },
          { status: 404 }
        );
      }

      const passwordValida = await bcrypt.compare(
        passwordConfirmacion,
        directivo.password
      );

      if (!passwordValida) {
        return NextResponse.json(
          { error: "Contraseña incorrecta. No se puede confirmar la acción." },
          { status: 403 }
        );
      }
    }

    const estudiante = await prisma.estudiante.findUnique({
      where: { id: params.id },
      select: { id: true, nombre: true },
    });

    if (!estudiante) {
      return NextResponse.json(
        { error: "Estudiante no encontrado" },
        { status: 404 }
      );
    }

    await prisma.estudiante.update({
      where: { id: params.id },
      data: { activo },
    });

    await prisma.logAuditoria.create({
      data: {
        usuarioId: session.userId,
        accion: activo ? "ESTUDIANTE_ACTIVADO" : "ESTUDIANTE_DESACTIVADO",
        detalle: `Estudiante ${estudiante.nombre} (${params.id}) ${activo ? "activado" : "desactivado"}`,
      },
    });

    return NextResponse.json({
      success: true,
      activo,
      message: activo
        ? "Estudiante activado correctamente"
        : "Estudiante dado de baja correctamente",
    });
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar estudiante" },
      { status: 500 }
    );
  }
}
