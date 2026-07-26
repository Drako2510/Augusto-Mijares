export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/asistencia/historial?estudianteId=...&mes=7&anio=2026&materiaId=...
 *
 * Retorna el historial completo de asistencias de un estudiante para un mes,
 * organizado por día y materia. Incluye resumen estadístico.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const estudianteId = searchParams.get("estudianteId");
  const mes = parseInt(searchParams.get("mes") || String(new Date().getMonth() + 1));
  const anio = parseInt(searchParams.get("anio") || String(new Date().getFullYear()));
  const materiaId = searchParams.get("materiaId") || undefined;

  if (!estudianteId) {
    return NextResponse.json({ error: "estudianteId requerido" }, { status: 400 });
  }

  // Representante: verificar parentesco
  if (session.rol === "representante") {
    const relacion = await prisma.representanteHijo.findFirst({
      where: { representanteId: session.userId, estudianteId },
    });
    if (!relacion) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
  }

  if (session.rol === "profesor") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    // Rango del mes
    const inicio = new Date(anio, mes - 1, 1);
    const fin = new Date(anio, mes, 1); // día 1 del mes siguiente

    // Asistencias del mes
    const asistencias = await prisma.asistencia.findMany({
      where: {
        estudianteId,
        fecha: { gte: inicio, lt: fin },
        ...(materiaId ? { materiaId } : {}),
      },
      include: {
        materia: { select: { id: true, nombre: true, icono: true } },
      },
      orderBy: { fecha: "asc" },
    });

    // Agrupar por día
    const porDia = new Map<string, typeof asistencias>();
    for (const a of asistencias) {
      const clave = a.fecha.toISOString().split("T")[0];
      if (!porDia.has(clave)) porDia.set(clave, []);
      porDia.get(clave)!.push(a);
    }

    // Materias del estudiante (para mostrar todas aunque no tengan registro)
    const materias = await prisma.materia.findMany({
      select: { id: true, nombre: true, icono: true },
    });

    // Calcular todos los días hábiles del mes (lun-vie)
    const dias: string[] = [];
    const cursor = new Date(inicio);
    while (cursor < fin) {
      const dia = cursor.getDay();
      if (dia !== 0 && dia !== 6) {
        dias.push(cursor.toISOString().split("T")[0]);
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    // Construir respuesta por día
    const historial = dias.map((fecha) => {
      const registros = porDia.get(fecha) ?? [];
      return {
        fecha,
        dia: new Date(fecha + "T00:00:00").getDate(),
        diaSemana: new Date(fecha + "T00:00:00").toLocaleDateString("es", { weekday: "short" }),
        registros: materias
          .filter((m) => !materiaId || m.id === materiaId)
          .map((m) => {
            const reg = registros.find((r) => r.materiaId === m.id);
            return {
              materiaId: m.id,
              materia: m.nombre,
              icono: m.icono,
              estado: reg?.estado ?? "sin_marcar",
              observacion: reg?.observacion ?? null,
            };
          }),
      };
    });

    // Estadísticas del mes
    const totalRegistros = asistencias.length;
    const presentes = asistencias.filter((a) => a.estado === "presente").length;
    const ausentes = asistencias.filter((a) => a.estado === "ausente").length;
    const tardes = asistencias.filter((a) => a.estado === "tarde").length;
    const justificados = asistencias.filter((a) => a.estado === "justificado").length;
    const diasConRegistro = porDia.size;
    const totalDias = dias.length;
    const porcentaje = totalDias > 0 ? Math.round((diasConRegistro / totalDias) * 100) : 0;

    return NextResponse.json({
      historial,
      materias: materias.map((m) => ({ id: m.id, nombre: m.nombre, icono: m.icono })),
      resumen: {
        mes,
        anio,
        totalDias,
        diasConRegistro,
        porcentaje,
        registros: totalRegistros,
        presentes,
        ausentes,
        tardes,
        justificados,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Error al obtener historial" },
      { status: 500 }
    );
  }
}
