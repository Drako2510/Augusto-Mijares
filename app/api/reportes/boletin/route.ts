export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reportes/boletin?estudianteId=
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.rol !== "directivo") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const estudianteId = searchParams.get("estudianteId") ?? "";

  const estudiante = await prisma.estudiante.findUnique({
    where: { id: estudianteId },
    select: { id: true, nombre: true, anio: true, seccion: true },
  });
  if (!estudiante) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Asistencias últimos 30 días
  const hace30 = new Date();
  hace30.setDate(hace30.getDate() - 30);
  const asistencias = await prisma.asistencia.findMany({
    where: { estudianteId, fecha: { gte: hace30 } },
    select: { estado: true },
  });
  const total = asistencias.length || 1;
  const presentes = asistencias.filter((a) => a.estado === "presente").length;
  const asistencia = Math.round((presentes / total) * 100);

  // Evaluaciones agrupadas por materia
  const evaluaciones = await prisma.evaluacion.findMany({
    where: { estudianteId },
    select: { calificacion: true, materia: { select: { nombre: true } } },
    orderBy: { fecha: "desc" },
  });

  const materiasMap = new Map<string, { materia: string; notas: number[] }>();
  for (const ev of evaluaciones) {
    const key = ev.materia?.nombre ?? "Sin materia";
    if (!materiasMap.has(key)) materiasMap.set(key, { materia: key, notas: [] });
    materiasMap.get(key)!.notas.push(ev.calificacion);
  }
  const materias = Array.from(materiasMap.values()).map((m) => ({
    ...m,
    promedio: Math.round((m.notas.reduce((a, b) => a + b, 0) / m.notas.length) * 10) / 10,
  }));

  const promedio = evaluaciones.length > 0
    ? Math.round((evaluaciones.reduce((s, e) => s + e.calificacion, 0) / evaluaciones.length) * 10) / 10
    : 0;

  // Tareas pendientes
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const tareas = await prisma.tarea.count({
    where: { fechaEntrega: { gte: hoy }, OR: [{ anio: estudiante.anio, seccion: estudiante.seccion }, { anio: null, seccion: null }] },
  });

  return NextResponse.json({
    estudiante: {
      nombre: estudiante.nombre,
      anio: estudiante.anio,
      seccion: estudiante.seccion,
      asistencia,
      totalDias: total,
      promedio,
      materias,
      tareas,
    },
  });
}
