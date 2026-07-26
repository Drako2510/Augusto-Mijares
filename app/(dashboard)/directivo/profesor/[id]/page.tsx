import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GestionProfesorCliente } from "./GestionProfesorCliente";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function GestionProfesorPage({ params }: Props) {
  const session = await getSession();

  if (!session) redirect(`/login?redirect=/directivo/profesor/${params.id}`);
  if (session.rol !== "directivo") redirect("/unauthorized");

  // Obtener datos del profesor
  const profesor = await prisma.usuario.findUnique({
    where: { id: params.id },
    select: { id: true, nombre: true, email: true, activo: true, rol: true },
  });

  if (!profesor || profesor.rol !== "profesor") notFound();

  // Obtener asignaciones activas del profesor
  const asignaciones = await prisma.profesorMateria.findMany({
    where: { usuarioId: params.id, activo: true },
    include: { materia: { select: { id: true, nombre: true, icono: true } } },
    orderBy: [{ anio: "asc" }, { seccion: "asc" }],
  });

  return (
    <GestionProfesorCliente
      profesor={{
        id: profesor.id,
        nombre: profesor.nombre,
        email: profesor.email,
        activo: profesor.activo,
      }}
      asignaciones={asignaciones.map((a) => ({
        id: a.id,
        materiaId: a.materiaId,
        materia: a.materia,
        anio: a.anio,
        seccion: a.seccion,
        claveSecreta: a.claveSecreta,
      }))}
    />
  );
}
