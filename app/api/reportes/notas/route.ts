import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reportes/notas?estudianteId=
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const estudianteId = searchParams.get("estudianteId") ?? "";

  if (!estudianteId) return NextResponse.json({ error: "estudianteId requerido" }, { status: 400 });

  if (session.rol === "representante") {
    const relacion = await prisma.representanteHijo.findFirst({
      where: { representanteId: session.userId, estudianteId },
    });
    if (!relacion) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const estudiante = await prisma.estudiante.findUnique({
    where: { id: estudianteId },
    select: { anio: true, seccion: true },
  });
  if (!estudiante) return NextResponse.json({ error: "Estudiante no encontrado" }, { status: 404 });

  // Materias que cursa (asignaciones de su año+sección)
  const asignaciones = await prisma.profesorMateria.findMany({
    where: { anio: estudiante.anio, seccion: estudiante.seccion, activo: true },
    select: { materia: { select: { nombre: true, icono: true } } },
  });

  // Evaluaciones existentes + calificaciones
  const [todasEval, calificaciones] = await Promise.all([
    prisma.evaluacion.findMany({
      where: {
        OR: [
          { estudianteId },
          { anio: estudiante.anio, seccion: estudiante.seccion },
        ],
      },
      include: { materia: { select: { nombre: true } } },
      orderBy: { fecha: "asc" },
    }),
    prisma.calificacion.findMany({
      where: { estudianteId },
      include: {
        materia: { select: { nombre: true } },
        evaluacion: { select: { titulo: true, fecha: true } },
      },
    }),
  ]);

  // Agrupar notas por materia (con info de evaluación)
  // Primero calificaciones (prioridad), luego evaluaciones (solo si no hay calificación duplicada)
  const calTitulos = new Set(calificaciones.map((c) => c.evaluacion?.titulo || ""));
  const evalsPorMateria = new Map<string, { valor: number; evaluacion: string; fecha: string }[]>();

  for (const cal of calificaciones) {
    const key = cal.materia?.nombre ?? "Sin materia";
    if (!evalsPorMateria.has(key)) evalsPorMateria.set(key, []);
    evalsPorMateria.get(key)!.push({ valor: cal.nota, evaluacion: cal.evaluacion?.titulo || "Evaluación", fecha: cal.fechaRegistro.toISOString() });
  }
  for (const ev of todasEval) {
    // Solo incluir evaluaciones con estudianteId (notas individuales)
    // Las evaluaciones de sección (estudianteId: null) son plantillas, no notas reales
    if (!ev.estudianteId) continue;
    const key = ev.materia?.nombre ?? "Sin materia";
    if (!evalsPorMateria.has(key)) evalsPorMateria.set(key, []);
    evalsPorMateria.get(key)!.push({ valor: ev.calificacion, evaluacion: ev.titulo, fecha: ev.fecha.toISOString() });
  }

  // Construir lista de materias (todas las que cursa, incluso sin notas)
  const materiasSet = new Set<string>();
  const materias = asignaciones.map((a) => {
    const nombre = a.materia.nombre;
    materiasSet.add(nombre);
    const notas = evalsPorMateria.get(nombre) || [];
    const valores = notas.map((n) => n.valor);
    return {
      materia: nombre,
      icono: a.materia.icono,
      notas,
      cantidad: notas.length,
      promedio: valores.length > 0
        ? Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10
        : 0,
    };
  });

  // Agregar materias con evaluaciones pero sin asignación (por si acaso)
  for (const [nombre, notas] of evalsPorMateria) {
    if (!materiasSet.has(nombre)) {
      const valores = notas.map((n) => n.valor);
      materias.push({
        materia: nombre,
        icono: "📋",
        notas,
        cantidad: notas.length,
        promedio: Math.round((valores.reduce((a, b) => a + b, 0) / valores.length) * 10) / 10,
      });
    }
  }

  const todasLasNotas = materias.flatMap((m) => m.notas.map((n) => n.valor));
  const promedioGeneral = todasLasNotas.length > 0
    ? Math.round((todasLasNotas.reduce((a, b) => a + b, 0) / todasLasNotas.length) * 10) / 10
    : 0;

  return NextResponse.json({
    materias,
    promedioGeneral,
    total: todasLasNotas.length,
    maxEvaluaciones: 5,
  });
}
