import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HistorialEstudianteCliente } from "./HistorialEstudianteCliente";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function EstudianteHistorialPage({ params }: Props) {
  const session = await getSession();

  if (!session) redirect(`/login?redirect=/directivo/estudiante/${params.id}`);
  if (session.rol !== "directivo") redirect("/unauthorized");

  const estudiante = await prisma.estudiante.findUnique({
    where: { id: params.id },
    include: {
      representantes: {
        include: { representante: { select: { nombre: true, email: true } } },
      },
    },
  });

  if (!estudiante) notFound();

  // ── Asistencias (último año como máximo) ──
  const haceUnAnio = new Date();
  haceUnAnio.setFullYear(haceUnAnio.getFullYear() - 1);

  const asistencias = await prisma.asistencia.findMany({
    where: { estudianteId: estudiante.id, fecha: { gte: haceUnAnio } },
    include: { materia: { select: { nombre: true, icono: true } } },
    orderBy: { fecha: "desc" },
  });

  // ── Evaluaciones (del estudiante O de su sección) ──
  const evaluaciones = await prisma.evaluacion.findMany({
    where: {
      OR: [
        { estudianteId: estudiante.id },
        { anio: estudiante.anio, seccion: estudiante.seccion },
      ],
    },
    include: { materia: { select: { nombre: true, icono: true } } },
    orderBy: { fecha: "desc" },
  });

  // ── Calificaciones (nuevo sistema) ──
  // Excluir calificaciones con nota 0 vinculadas a evaluaciones plantilla
  const calificaciones = await prisma.calificacion.findMany({
    where: {
      estudianteId: estudiante.id,
      NOT: { nota: 0 },
    },
    include: {
      materia: { select: { nombre: true, icono: true } },
      evaluacion: { select: { titulo: true, fecha: true } },
    },
    orderBy: { fechaRegistro: "desc" },
  });

  // ── Promedio por materia ──
  const porMateriaMap = new Map<
    string,
    { materiaId: string; materiaNombre: string; icono: string; notas: number[] }
  >();
  for (const ev of evaluaciones) {
    // Saltar evaluaciones de sección sin nota real (plantillas con nota 0)
    if (!ev.estudianteId && ev.calificacion === 0) continue;
    const key = ev.materiaId || "sin-materia";
    if (!porMateriaMap.has(key)) {
      porMateriaMap.set(key, {
        materiaId: key,
        materiaNombre: ev.materia?.nombre ?? "Sin materia",
        icono: ev.materia?.icono ?? "📋",
        notas: [],
      });
    }
    porMateriaMap.get(key)!.notas.push(ev.calificacion);
  }
  // Agregar calificaciones al mapa
  for (const cal of calificaciones) {
    const key = cal.materia?.nombre ?? "Sin materia";
    if (!porMateriaMap.has(key)) {
      porMateriaMap.set(key, {
        materiaId: key,
        materiaNombre: cal.materia?.nombre ?? "Sin materia",
        icono: cal.materia?.icono ?? "📋",
        notas: [],
      });
    }
    porMateriaMap.get(key)!.notas.push(cal.nota);
  }

  const promediosPorMateria = Array.from(porMateriaMap.values())
    .map((m) => ({
      materiaId: m.materiaId,
      materiaNombre: m.materiaNombre,
      icono: m.icono,
      cantidad: m.notas.length,
      notas: m.notas.sort((a, b) => b - a),
      promedio:
        Math.round(
          (m.notas.reduce((a, b) => a + b, 0) / m.notas.length) * 10
        ) / 10,
    }))
    .sort((a, b) => b.promedio - a.promedio);

  // Promedio general (promedio de los promedios por materia, base 20)
  const promediosConNota = promediosPorMateria.filter((m) => m.cantidad > 0);
  const promedioGeneral =
    promediosConNota.length > 0
      ? Math.round(
          (promediosConNota.reduce((sum, m) => sum + m.promedio, 0) /
            promediosConNota.length) *
            10
        ) / 10
      : 0;

  // ── Tareas pendientes ──
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const tareas = await prisma.tarea.findMany({
    where: {
      fechaEntrega: { gte: hoy },
      OR: [
        { anio: estudiante.anio, seccion: estudiante.seccion },
        { anio: null, seccion: null },
      ],
    },
    include: { materia: { select: { nombre: true, icono: true } } },
    orderBy: { fechaEntrega: "asc" },
    take: 20,
  });

  const representante = estudiante.representantes[0]?.representante;

  return (
    <HistorialEstudianteCliente
      estudiante={{
        id: estudiante.id,
        nombre: estudiante.nombre,
        anio: estudiante.anio,
        seccion: estudiante.seccion,
        representante: representante
          ? { nombre: representante.nombre, email: representante.email }
          : null,
      }}
      asistencias={asistencias.map((a) => ({
        id: a.id,
        fecha: a.fecha.toISOString(),
        materiaNombre: a.materia?.nombre ?? "",
        materiaIcono: a.materia?.icono ?? "",
        estado: a.estado,
      }))}
      evaluaciones={evaluaciones.map((ev) => ({
        id: ev.id,
        fecha: ev.fecha.toISOString(),
        titulo: ev.titulo,
        calificacion: ev.calificacion,
        tipo: ev.tipo,
        materiaNombre: ev.materia?.nombre ?? "",
        materiaIcono: ev.materia?.icono ?? "",
      }))}
      promedioGeneral={promedioGeneral}
      promediosPorMateria={promediosPorMateria}
      calificaciones={calificaciones.map((c) => ({
        id: c.id,
        nota: c.nota,
        observacion: c.observacion,
        tituloEvaluacion: c.evaluacion?.titulo || "Evaluación",
        fecha: c.fechaRegistro.toISOString(),
        materiaNombre: c.materia?.nombre ?? "",
        materiaIcono: c.materia?.icono ?? "",
      }))}
      tareas={tareas.map((t) => ({
        id: t.id,
        titulo: t.titulo,
        descripcion: t.descripcion,
        fechaEntrega: t.fechaEntrega.toISOString(),
        materiaNombre: t.materia?.nombre ?? "",
        materiaIcono: t.materia?.icono ?? "",
      }))}
    />
  );
}
