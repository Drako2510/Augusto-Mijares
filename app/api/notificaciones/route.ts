export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notificaciones — Obtener notificaciones del usuario autenticado
// Parámetros: ?noLeidas=true&limit=20
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const soloNoLeidas = searchParams.get("noLeidas") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");

    const notificaciones = await prisma.notificacion.findMany({
      where: {
        usuarioId: session.userId,
        ...(soloNoLeidas ? { leida: false } : {}),
      },
      orderBy: { fecha: "desc" },
      take: Math.min(limit, 50),
      include: {
        estudiante: { select: { nombre: true, anio: true, seccion: true } },
        materia: { select: { nombre: true, icono: true } },
      },
    });

    return NextResponse.json({ notificaciones });
  } catch {
    return NextResponse.json({ error: "Error al obtener notificaciones" }, { status: 500 });
  }
}

// POST /api/notificaciones — Crear una notificación (uso interno)
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const { tipo, titulo, mensaje, estudianteId, materiaId, data } = await request.json();
    if (!mensaje) {
      return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 });
    }

    const notificacion = await prisma.notificacion.create({
      data: {
        usuarioId: session.userId,
        tipo: tipo || "SISTEMA",
        titulo: titulo || tipo || "Notificación",
        mensaje,
        estudianteId: estudianteId || null,
        materiaId: materiaId || null,
        data: data ? JSON.stringify(data) : null,
        enCola: false,
        enviado: false,
      },
    });

    return NextResponse.json({ success: true, notificacion });
  } catch {
    return NextResponse.json({ error: "Error al crear notificación" }, { status: 500 });
  }
}
