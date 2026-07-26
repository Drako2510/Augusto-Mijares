import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ProfesorPermisos } from "@/lib/permissions";
import { getMateriaById, getAnioById, getSeccionById } from "@/data/seed";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string; anio: string; seccion: string };
}

export default async function ProfesorMateriaDashboardPage({ params }: Props) {
  const session = await getSession();

  if (!session) {
    redirect(`/login?redirect=/profesor/materia/${params.id}/${params.anio}/${params.seccion}`);
  }

  // Solo profesores y directivos pueden acceder
  if (session.rol !== "profesor" && session.rol !== "directivo") {
    redirect("/unauthorized");
  }

  const materia = getMateriaById(params.id);
  const anio = getAnioById(params.anio);
  const seccion = getSeccionById(params.seccion);

  if (!materia || !anio || !seccion) {
    notFound();
  }

  // Verificar permiso (profesor debe tener esta sección asignada)
  if (session.rol === "profesor") {
    const permiso = await ProfesorPermisos.canEdit(
      session.userId,
      params.id,
      params.anio,
      params.seccion
    );

    if (!permiso.permitido) {
      redirect("/unauthorized");
    }
  }

  // Obtener estudiantes desde BD, con fallback a datos estáticos
  let estudiantes: string[] = [];
  let estudianteMap: Record<string, string> = {};
  try {
    const dbEstudiantes = await prisma.estudiante.findMany({
      where: { anio: params.anio, seccion: params.seccion, activo: true },
      orderBy: { nombre: "asc" },
    });
    if (dbEstudiantes.length > 0) {
      estudiantes = dbEstudiantes.map((e) => e.nombre);
      estudianteMap = Object.fromEntries(dbEstudiantes.map((e) => [e.nombre, e.id]));
    }
  } catch {
    // Fallback a datos estáticos (seed.ts)
    const { estudiantesPorSeccion } = await import("@/data/seed");
    estudiantes = estudiantesPorSeccion[params.seccion] ?? [];
  }

  return (
    <DashboardClient
      materia={materia}
      anio={anio}
      seccion={seccion}
      estudiantesIniciales={estudiantes}
      estudianteMap={estudianteMap}
    />
  );
}
