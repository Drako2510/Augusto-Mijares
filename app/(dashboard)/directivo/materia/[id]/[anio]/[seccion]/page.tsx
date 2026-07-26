import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getMateriaById, getAnioById, getSeccionById, estudiantesPorSeccion } from "@/data/seed";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { DirectivoClaseClient } from "./DirectivoClaseClient";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string; anio: string; seccion: string };
}

export default async function DirectivoMateriaPage({ params }: Props) {
  const session = await getSession();

  if (!session) redirect(`/login?redirect=/directivo/materia/${params.id}/${params.anio}/${params.seccion}`);
  if (session.rol !== "directivo") redirect("/unauthorized");

  const materia = getMateriaById(params.id);
  const anio = getAnioById(params.anio);
  const seccion = getSeccionById(params.seccion);

  if (!materia || !anio || !seccion) notFound();

  // Obtener estudiantes de la sección
  let estudiantes: { id: string; nombre: string }[] = [];
  try {
    const db = await prisma.estudiante.findMany({
      where: { anio: params.anio, seccion: params.seccion, activo: true },
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true },
    });
    estudiantes = db;
  } catch {
    const names = estudiantesPorSeccion[params.seccion] ?? [];
    estudiantes = names.map((n, i) => ({ id: `fallback-${i}`, nombre: n }));
  }

  // Resumen de asistencia del día
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  let asistenciasHoy: Record<string, string> = {};
  try {
    const asis = await prisma.asistencia.findMany({
      where: {
        materiaId: params.id,
        fecha: { gte: hoy, lt: manana },
        estudianteId: { in: estudiantes.map((e) => e.id) },
      },
    });
    asistenciasHoy = Object.fromEntries(asis.map((a) => [a.estudianteId, a.estado]));
  } catch {}

  return (
    <DirectivoClaseClient
      materia={materia}
      anio={anio}
      seccion={seccion}
      estudiantes={estudiantes}
      asistenciasHoy={asistenciasHoy}
    />
  );
}
