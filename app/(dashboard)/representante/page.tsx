import { getSession } from "@/lib/auth";
import { RepresentantePermisos } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RepresentanteDashboardCliente } from "./RepresentanteDashboardCliente";

export const dynamic = "force-dynamic";

export default async function RepresentanteDashboardPage() {
  const session = await getSession();

  if (!session) redirect("/login?redirect=/representante");
  if (session.rol !== "representante") redirect("/unauthorized");

  // Obtener hijos del representante
  const relaciones = await RepresentantePermisos.getHijos(session.userId);
  const hijos = relaciones.map((r) => ({
    id: r.estudiante.id,
    nombre: r.estudiante.nombre,
    anio: r.estudiante.anio,
    seccion: r.estudiante.seccion,
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <RepresentanteDashboardCliente hijos={hijos} />
    </main>
  );
}
