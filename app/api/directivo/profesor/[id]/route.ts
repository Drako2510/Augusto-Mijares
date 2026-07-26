export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// PATCH /api/directivo/profesor/[id] — Activar/desactivar profesor
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

    // Verificar contraseña del directivo para confirmar la acción
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

    const profesor = await prisma.usuario.findUnique({
      where: { id: params.id },
      select: { rol: true },
    });

    if (!profesor || profesor.rol !== "profesor") {
      return NextResponse.json(
        { error: "Profesor no encontrado" },
        { status: 404 }
      );
    }

    await prisma.usuario.update({
      where: { id: params.id },
      data: { activo },
    });

    // Si se desactiva, desactivar también sus asignaciones
    if (!activo) {
      await prisma.profesorMateria.updateMany({
        where: { usuarioId: params.id },
        data: { activo: false },
      });
    }

    // Log de auditoría
    await prisma.logAuditoria.create({
      data: {
        usuarioId: session.userId,
        accion: activo ? "PROFESOR_ACTIVADO" : "PROFESOR_DESACTIVADO",
        detalle: `Profesor ${params.id} ${activo ? "activado" : "desactivado"} — confirmación con contraseña`,
      },
    });

    return NextResponse.json({
      success: true,
      activo,
      message: activo
        ? "Profesor activado correctamente"
        : "Profesor dado de baja correctamente",
    });
  } catch {
    return NextResponse.json(
      { error: "Error al actualizar profesor" },
      { status: 500 }
    );
  }
}
