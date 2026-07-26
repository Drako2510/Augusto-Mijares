export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/calificaciones?estudianteId=&materiaId=
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const estudianteId = searchParams.get("estudianteId") ?? "";
  const materiaId = searchParams.get("materiaId") ?? "";

  if (session.rol === "representante" && estudianteId) {
    const relacion = await prisma.representanteHijo.findFirst({
      where: { representanteId: session.userId, estudianteId },
    });
    if (!relacion) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const where: any = {};
  if (estudianteId) where.estudianteId = estudianteId;
  if (materiaId) where.materiaId = materiaId;

  const calificaciones = await prisma.calificacion.findMany({
    where,
    include: {
      estudiante: { select: { nombre: true, anio: true, seccion: true } },
      evaluacion: { select: { titulo: true, fecha: true, tipo: true } },
      materia: { select: { nombre: true, icono: true } },
    },
    orderBy: { fechaRegistro: "desc" },
  });

  return NextResponse.json({ calificaciones });
}

// POST /api/calificaciones — batch
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || (session.rol !== "profesor" && session.rol !== "directivo")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { evaluacionId, materiaId, notas, anio, seccion, passwordConfirmacion } = await request.json();

    if (!evaluacionId || !materiaId || !notas?.length) {
      return NextResponse.json({ error: "Datos requeridos: evaluacionId, materiaId, notas" }, { status: 400 });
    }

    let guardadas = 0;
    let errores: string[] = [];

    // Verificar que la evaluación existe
    const evaluacion = await prisma.evaluacion.findUnique({ where: { id: evaluacionId } });
    if (!evaluacion) {
      return NextResponse.json({ error: "La evaluación no existe en el calendario" }, { status: 404 });
    }

    // Si es profesor y hay notas > 0 existentes, verificar autorización del directivo
    let necesitaAuth = false;
    if (session.rol === "profesor") {
      for (const item of notas) {
        const existente = await prisma.calificacion.findUnique({
          where: { estudianteId_evaluacionId: { estudianteId: item.estudianteId, evaluacionId } },
        });
        if (existente) {
          necesitaAuth = true;
          break;
        }
      }
    }

    if (necesitaAuth) {
      if (!passwordConfirmacion) {
        return NextResponse.json({ error: "Requiere autorización del directivo para modificar notas existentes" }, { status: 403 });
      }
      const directivo = await prisma.usuario.findFirst({ where: { rol: "directivo" }, select: { password: true } });
      if (!directivo) return NextResponse.json({ error: "No hay directivo registrado" }, { status: 404 });
      const bcrypt = await import("bcryptjs");
      const ok = await bcrypt.default.compare(passwordConfirmacion, directivo.password);
      if (!ok) return NextResponse.json({ error: "Contraseña del directivo incorrecta" }, { status: 403 });
    }

    for (const item of notas) {
      const { estudianteId, nota, observacion } = item;
      if (nota == null || nota < 0 || nota > 20) continue;

      await prisma.calificacion.upsert({
          where: { estudianteId_evaluacionId: { estudianteId, evaluacionId } },
          update: session.rol === "directivo" ? { nota, observacion, publicada: true } : { nota, observacion, publicada: true },
          create: {
            estudianteId, evaluacionId, materiaId,
            profesorId: session.userId, nota, observacion, publicada: true,
          },
        });

      // Notificar al representante
      try {
        const estudiante = await prisma.estudiante.findUnique({ where: { id: estudianteId }, select: { nombre: true } });
        const materia = await prisma.materia.findUnique({ where: { id: materiaId }, select: { nombre: true } });
        const relaciones = await prisma.representanteHijo.findMany({ where: { estudianteId }, select: { representanteId: true } });

        for (const rel of relaciones) {
          await prisma.notificacion.create({
            data: {
              tipo: "CALIFICACION",
              titulo: `📝 Nueva Nota: ${materia?.nombre || ""}`,
              mensaje: `📝 ${estudiante?.nombre || ""} recibió ${nota}/20 en ${materia?.nombre || ""}.`,
              usuarioId: rel.representanteId,
              estudianteId,
              materiaId,
              creadoPor: session.userId,
              enCola: false,
              enviado: false,
            },
          });
        }
      } catch { /* no bloquear */ }

      guardadas++;
    }

    return NextResponse.json({ success: true, guardadas, errores: errores.length > 0 ? errores : undefined });
  } catch {
    return NextResponse.json({ error: "Error al guardar calificaciones" }, { status: 500 });
  }
}
