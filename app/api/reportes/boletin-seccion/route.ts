export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reportes/boletin-seccion?anio=&seccion=
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.rol !== "directivo") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const anio = searchParams.get("anio") ?? "";
  const seccion = searchParams.get("seccion") ?? "";

  const estudiantes = await prisma.estudiante.findMany({
    where: { anio, seccion, activo: true },
    select: { id: true, nombre: true, anio: true, seccion: true },
    orderBy: { nombre: "asc" },
  });

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const hace30 = new Date();
  hace30.setDate(hace30.getDate() - 30);

  const resultado = await Promise.all(
    estudiantes.map(async (est) => {
      const [asistencias, evaluaciones, tareas] = await Promise.all([
        prisma.asistencia.findMany({ where: { estudianteId: est.id, fecha: { gte: hace30 } }, select: { estado: true } }),
        prisma.evaluacion.findMany({ where: { estudianteId: est.id }, select: { calificacion: true, materia: { select: { nombre: true } } } }),
        prisma.tarea.count({ where: { fechaEntrega: { gte: hoy }, OR: [{ anio, seccion }, { anio: null, seccion: null }] } }),
      ]);

      const total = asistencias.length || 1;
      const presentes = asistencias.filter((a) => a.estado === "presente").length;
      const asistencia = Math.round((presentes / total) * 100);

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

      return { nombre: est.nombre, anio: est.anio, seccion: est.seccion, asistencia, totalDias: total, promedio, materias, tareas };
    })
  );

  return NextResponse.json({ estudiantes: resultado });
}
