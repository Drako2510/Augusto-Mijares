import { getSession } from "@/lib/auth";
import { DirectivoPermisos } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DirectivoDashboardCliente } from "./DirectivoDashboardCliente";

export const dynamic = "force-dynamic";

export default async function DirectivoDashboardPage() {
  const session = await getSession();

  if (!session) redirect("/login?redirect=/directivo");
  if (session.rol !== "directivo") redirect("/unauthorized");

  // Obtener todas las asignaciones (profesor + materia + año + sección)
  const asignaciones = await DirectivoPermisos.getAllAsignaciones();

  // Obtener todos los estudiantes activos con sus representantes
  let estudiantes: {
    id: string;
    nombre: string;
    anio: string;
    seccion: string;
    representantes: { representante: { nombre: string; email: string } }[];
  }[] = [];
  try {
    estudiantes = await prisma.estudiante.findMany({
      where: { activo: true },
      orderBy: [{ anio: "asc" }, { seccion: "asc" }, { nombre: "asc" }],
      select: {
        id: true,
        nombre: true,
        anio: true,
        seccion: true,
        representantes: {
          select: {
            representante: { select: { nombre: true, email: true } },
          },
        },
      },
    });
  } catch {
    // Si falla la BD, se muestra lista vacía
  }

  return (
    <DirectivoDashboardCliente
      asignaciones={asignaciones}
      estudiantes={estudiantes}
    />
  );
}
